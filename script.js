// Insert your TMDB API key here
const TMDB_API_KEY = "c5bb9a766bdc90fcc8f7293f6cd9c26a";

const searchInput = document.getElementById("searchInput");
const selectedList = document.getElementById("selectedList");
const nextButton = document.getElementById("nextButton");
const tagEmojiSection = document.getElementById("tagEmojiSection");
const onboardingSection = document.getElementById("onboarding");
const recommendations = document.getElementById("recommendations");
const recommendationList = document.getElementById("recommendationList");
const emojiPicker = document.getElementById("emojiPicker");

let searchTimeout;
let selectedTitles = [];
let selectedTags = [];

// Debounced search on typing
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(() => searchAll(query), 400);
  }
});

// Search TMDB (movies + TV) and Google Books
async function searchAll(query) {
  const resultsContainer = document.getElementById("searchResults");
  if (!resultsContainer) {
    const ul = document.createElement("ul");
    ul.id = "searchResults";
    ul.className = "mt-2 border rounded bg-white";
    searchInput.insertAdjacentElement("afterend", ul);
  } else {
    resultsContainer.innerHTML = "";
  }

  // TMDB search
  const tmdbResp = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const tmdbData = await tmdbResp.json();

  const tmdbResults = (tmdbData.results || []).slice(0, 5).map(item => ({
    name: item.title || item.name,
    type: item.media_type || "movie"
  }));

  // Google Books search
  const booksResp = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
  );
  const booksData = await booksResp.json();

  const booksResults = (booksData.items || []).map(book => ({
    name: book.volumeInfo.title,
    type: "book"
  }));

  const results = [...tmdbResults, ...booksResults];
  displayResults(results);
}

// Show search results below the input
function displayResults(results) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";
  results.forEach(result => {
    const li = document.createElement("li");
    li.className = "p-2 hover:bg-gray-100 cursor-pointer";
    li.textContent = `${result.name} (${result.type})`;
    li.addEventListener("click", () => {
      selectedTitles.push(result.name);
      const sLi = document.createElement("li");
      sLi.textContent = result.name;
      selectedList.appendChild(sLi);
      resultsContainer.innerHTML = "";
      searchInput.value = "";
    });
    resultsContainer.appendChild(li);
  });
}

// Go to tag selection screen
nextButton.addEventListener("click", () => {
  if (selectedTitles.length > 0) {
    onboardingSection.classList.add("hidden");
    tagEmojiSection.classList.remove("hidden");
    loadTags();
  }
});

// Show selectable mood tags
function loadTags() {
  const tags = ["Philosophical", "Wholesome", "Dark", "Funny", "Action-packed"];
  const tagContainer = document.getElementById("tags");
  tagContainer.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "px-3 py-1 bg-gray-200 rounded hover:bg-gray-300";
    btn.addEventListener("click", () => {
      btn.classList.toggle("bg-indigo-300");
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
      } else {
        selectedTags.push(tag);
      }
    });
    tagContainer.appendChild(btn);
  });
}

// On click: fetch recommendations from both APIs
document.getElementById("recommendButton").addEventListener("click", () => {
  tagEmojiSection.classList.add("hidden");
  recommendations.classList.remove("hidden");
  fetchRecommendations();
});

// Fetch and merge movies + books
async function fetchRecommendations() {
  recommendationList.innerHTML = "";

  // TMDB genre mapping for moods
  const genreMap = {
    Philosophical: 18,       // Drama
    Wholesome: 10751,        // Family
    Dark: 53,                // Thriller
    Funny: 35,               // Comedy
    "Action-packed": 28      // Action
  };

  const genreIds = selectedTags.map(tag => genreMap[tag]).filter(Boolean).join(",");

  try {
    // Fetch movies based on genres
    const movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreIds}`;
    const movieResp = await fetch(movieUrl);
    const movieData = await movieResp.json();
    const movies = (movieData.results || []).slice(0, 6).map(movie => ({
      title: movie.title,
      description: movie.overview || "No description available.",
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "",
      type: "Movie"
    }));

    // Fetch books based on first mood tag (fallback to "bestseller")
    const bookQuery = selectedTags[0] || "bestseller";
    const bookUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQuery)}&maxResults=6`;
    const bookResp = await fetch(bookUrl);
    const bookData = await bookResp.json();
    const books = (bookData.items || []).map(book => ({
      title: book.volumeInfo.title,
      description: book.volumeInfo.description || "No description available.",
      image: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "",
      type: "Book"
    }));

    const results = [...movies, ...books];

    if (!results.length) {
      recommendationList.innerHTML = "<p>No matches found. Try different moods!</p>";
      return;
    }

    // Render recommendations
    results.forEach(item => {
      const div = document.createElement("div");
      div.className = "p-4 border rounded shadow bg-white";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="mb-2 rounded" />
        <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3>
        <p class="text-sm text-gray-600">${item.description}</p>
        <p class="mt-2 text-xs">Matches your mood: ${selectedTags.join(", ")} ${emojiPicker.value}</p>
      `;
      recommendationList.appendChild(div);
    });

  } catch (error) {
    recommendationList.innerHTML = `<p class="text-red-600">Error fetching recommendations. Check your API key.</p>`;
    console.error("Fetch Error:", error);
  }
}
