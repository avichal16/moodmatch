// Insert your TMDB API key here
const TMDB_API_KEY = "YOUR_TMDB_KEY_HERE";

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

// Debounced search
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(() => searchAll(query), 400);
  }
});

// Search TMDB and Google Books
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

  // TMDB Search (Movies + TV)
  const tmdbResp = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
  );
  const tmdbData = await tmdbResp.json();

  const tmdbResults = (tmdbData.results || []).slice(0, 5).map(item => ({
    name: item.title || item.name,
    type: item.media_type || "movie"
  }));

  // Google Books Search
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

// Display search results
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

// Move to tags page
nextButton.addEventListener("click", () => {
  if (selectedTitles.length > 0) {
    onboardingSection.classList.add("hidden");
    tagEmojiSection.classList.remove("hidden");
    loadTags();
  }
});

// Load tag buttons
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

// Fetch recommendations dynamically from TMDB
document.getElementById("recommendButton").addEventListener("click", () => {
  tagEmojiSection.classList.add("hidden");
  recommendations.classList.remove("hidden");
  fetchRecommendations();
});

async function fetchRecommendations() {
  recommendationList.innerHTML = "";

  // Map tags to keywords (simplified)
  const keywordMap = {
    Philosophical: "drama",
    Wholesome: "family",
    Dark: "thriller",
    Funny: "comedy",
    "Action-packed": "action"
  };

  const keywords = selectedTags.map(tag => keywordMap[tag] || "").join(",");

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${c5bb9a766bdc90fcc8f7293f6cd9c26a}&language=en-US&sort_by=popularity.desc&with_keywords=${encodeURIComponent(keywords)}`;
  const resp = await fetch(url);
  const data = await resp.json();

  const results = (data.results || []).slice(0, 6);

  if (results.length === 0) {
    recommendationList.innerHTML = "<p>No matches found. Try different moods!</p>";
    return;
  }

  results.forEach(movie => {
    const div = document.createElement("div");
    div.className = "p-4 border rounded shadow bg-white";
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
      : "";
    div.innerHTML = `
      <img src="${poster}" alt="${movie.title}" class="mb-2 rounded" />
      <h3 class="font-bold">${movie.title}</h3>
      <p class="text-sm text-gray-600">${movie.overview || "No description available."}</p>
      <p class="mt-2 text-xs">Matches your mood: ${selectedTags.join(", ")} ${emojiPicker.value}</p>
    `;
    recommendationList.appendChild(div);
  });
}
