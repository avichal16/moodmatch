const TMDB_API_KEY = "c5bb9a766bdc90fcc8f7293f6cd9c26a"; // Replace if needed

function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getData(key, defaultValue=[]) { return JSON.parse(localStorage.getItem(key)) || defaultValue; }

// Elements
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const selectedList = document.getElementById("selectedList");
const tagContainer = document.getElementById("tagOptions");
const emojiContainer = document.getElementById("emojiOptions");
const recList = document.getElementById("recommendationList");

let selectedTitles = [];
let selectedTags = [];
let selectedEmoji = "";

// Tags & Emojis
const tags = ["Suspenseful","Thought-Provoking","Wholesome","Intense","Emotional","Funny","Romantic","Action-Packed","Mysterious","Heartwarming"];
const emojis = ["🧞","💔","🤯","🌈","🎬","🤔"];

tags.forEach(tag=>{
  const btn = document.createElement("div");
  btn.textContent = tag;
  btn.className = "px-4 py-1 bg-[#f3e7e8] rounded-full cursor-pointer";
  btn.onclick = () => {
    if(selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
      btn.classList.remove("bg-[#994d51]","text-white");
    } else if(selectedTags.length < 5) {
      selectedTags.push(tag);
      btn.classList.add("bg-[#994d51]","text-white");
    }
  };
  tagContainer.appendChild(btn);
});

emojis.forEach(e=>{
  const btn = document.createElement("div");
  btn.textContent = e;
  btn.className = "px-4 py-1 bg-[#f3e7e8] rounded-full cursor-pointer";
  btn.onclick = () => {
    selectedEmoji = e;
    [...emojiContainer.children].forEach(c=>c.classList.remove("bg-[#994d51]","text-white"));
    btn.classList.add("bg-[#994d51]","text-white");
  };
  emojiContainer.appendChild(btn);
});

// Search (Movies + Books)
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if(query.length > 2) searchAll(query);
});

async function searchAll(query) {
  searchResults.innerHTML = "<li class='p-2 text-gray-500'>Searching...</li>";
  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const tmdbData = await tmdbRes.json();
    const tmdbResults = (tmdbData.results || []).slice(0,5).map(item=>item.title||item.name);
    const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const bookData = await bookRes.json();
    const bookResults = (bookData.items || []).map(b=>b.volumeInfo.title);
    const results = [...tmdbResults, ...bookResults];

    searchResults.innerHTML = "";
    if(!results.length) {
      searchResults.innerHTML = "<li class='p-2 text-gray-500'>No results found</li>";
    } else {
      results.forEach(name=>{
        const li = document.createElement("li");
        li.textContent = name;
        li.className = "p-2 hover:bg-gray-100 cursor-pointer";
        li.onclick = () => {
          selectedTitles.push(name);
          const chip = document.createElement("div");
          chip.textContent = name;
          chip.className = "px-3 py-1 bg-[#f3e7e8] rounded-full text-sm";
          selectedList.appendChild(chip);
          searchResults.innerHTML = "";
          searchInput.value = "";
        };
        searchResults.appendChild(li);
      });
    }
  } catch(err) {
    console.error(err);
    searchResults.innerHTML = "<li class='p-2 text-red-500'>API Error</li>";
  }
}

// Fetch Recommendations
document.getElementById("recommendButton").onclick = async () => {
  recList.innerHTML = "<p class='p-4 text-gray-500'>Loading...</p>";
  const genreMap = {
    "Suspenseful":53,"Thought-Provoking":18,"Wholesome":10751,
    "Intense":28,"Emotional":18,"Funny":35,"Romantic":10749,
    "Action-Packed":28,"Mysterious":9648,"Heartwarming":10751
  };
  const genreIds = selectedTags.map(t=>genreMap[t]).filter(Boolean).join(",");

  try {
    const movieURL = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genreIds}`;
    const movies = (await (await fetch(movieURL)).json()).results.slice(0,6).map(m=>({
      title:m.title,image:`https://image.tmdb.org/t/p/w200${m.poster_path}`,desc:m.overview||"",type:"Movie"
    }));
    const bookQ = selectedTags[0] || "bestseller";
    const books = (await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQ)}&maxResults=6`)).json()).items.map(b=>({
      title:b.volumeInfo.title,image:b.volumeInfo.imageLinks?.thumbnail||"",desc:b.volumeInfo.description||"",type:"Book"
    }));

    const results = [...movies,...books];
    recList.innerHTML = "";
    results.forEach(item=>{
      const card = document.createElement("div");
      card.className = "p-4 border rounded-lg bg-white max-w-[200px]";
      card.innerHTML = `
        <img src="${item.image}" class="rounded mb-2">
        <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3>
        <p class="text-xs text-gray-600">${item.desc}</p>
        <button class="mt-2 px-3 py-1 bg-[#f3e7e8] rounded-full text-sm addWatch">Save</button>
      `;
      card.querySelector(".addWatch").onclick = () => {
        const list = getData("watchlist");
        list.push(item);
        saveData("watchlist",list);
        alert("Added to Watchlist!");
      };
      recList.appendChild(card);
    });
  } catch (e) {
    recList.innerHTML = "<p class='p-4 text-red-500'>Error fetching recommendations.</p>";
    console.error(e);
  }
};

