const TMDB_API_KEY = "c5bb9a766bdc90fcc8f7293f6cd9c26a"; // Replace if needed

// Utility for saving/retrieving data
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getData(key, defaultValue=[]) {
  return JSON.parse(localStorage.getItem(key)) || defaultValue;
}

// Onboarding (index.html)
if (document.getElementById("searchInput")) {
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("searchResults");
  const selectedList = document.getElementById("selectedList");
  let selectedTitles = [];

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (query.length > 2) searchAll(query);
  });

  async function searchAll(query) {
    resultsContainer.innerHTML = "";
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const tmdbData = await tmdbRes.json();
    const tmdbResults = (tmdbData.results || []).slice(0,5).map(item => item.title || item.name);

    const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const bookData = await bookRes.json();
    const books = (bookData.items || []).map(b=>b.volumeInfo.title);

    [...tmdbResults, ...books].forEach(name => {
      const li = document.createElement("li");
      li.textContent = name;
      li.className = "p-2 hover:bg-gray-100 cursor-pointer";
      li.onclick = () => {
        selectedTitles.push(name);
        const chip = document.createElement("div");
        chip.textContent = name;
        chip.className = "px-3 py-1 bg-[#f3e7e8] rounded-full text-sm";
        selectedList.appendChild(chip);
        resultsContainer.innerHTML = "";
        searchInput.value = "";
      };
      resultsContainer.appendChild(li);
    });
  }

  document.getElementById("continueButton").onclick = () => {
    saveData("selectedTitles", selectedTitles);
    window.location.href = "tags.html";
  };
}

// Tags (tags.html)
if (document.getElementById("tagOptions")) {
  const tags = ["Suspenseful","Thought-Provoking","Wholesome","Intense","Emotional","Funny","Romantic","Action-Packed","Mysterious","Heartwarming"];
  const emojis = ["🧞","💔","🤯","🌈","🎬","🤔"];
  const selectedTags = [];
  let selectedEmoji = "";

  const tagContainer = document.getElementById("tagOptions");
  tags.forEach(tag=>{
    const btn = document.createElement("div");
    btn.textContent = tag;
    btn.className = "px-4 py-1 bg-[#f3e7e8] rounded-full cursor-pointer";
    btn.onclick = ()=> {
      if(selectedTags.includes(tag)) {
        selectedTags.splice(selectedTags.indexOf(tag),1);
        btn.classList.remove("bg-[#994d51]","text-white");
      } else if(selectedTags.length<5) {
        selectedTags.push(tag);
        btn.classList.add("bg-[#994d51]","text-white");
      }
    };
    tagContainer.appendChild(btn);
  });

  const emojiContainer = document.getElementById("emojiOptions");
  emojis.forEach(e=>{
    const btn = document.createElement("div");
    btn.textContent = e;
    btn.className = "px-4 py-1 bg-[#f3e7e8] rounded-full cursor-pointer";
    btn.onclick = ()=> {
      selectedEmoji = e;
      [...emojiContainer.children].forEach(c=>c.classList.remove("bg-[#994d51]","text-white"));
      btn.classList.add("bg-[#994d51]","text-white");
    };
    emojiContainer.appendChild(btn);
  });

  document.getElementById("submitTags").onclick = ()=>{
    saveData("selectedTags", selectedTags);
    saveData("selectedEmoji", selectedEmoji);
    window.location.href = "recommendations.html";
  };
}

// Recommendations (recommendations.html)
if (document.getElementById("recommendationList")) {
  const recList = document.getElementById("recommendationList");
  const tags = getData("selectedTags");
  const emoji = getData("selectedEmoji","");

  async function fetchData() {
    const genreMap = {
      "Suspenseful":53,"Thought-Provoking":18,"Wholesome":10751,
      "Intense":28,"Emotional":18,"Funny":35,"Romantic":10749,
      "Action-Packed":28,"Mysterious":9648,"Heartwarming":10751
    };
    const genreIds = tags.map(t=>genreMap[t]).filter(Boolean).join(",");
    const movieURL = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genreIds}`;
    const movies = (await (await fetch(movieURL)).json()).results.slice(0,6).map(m=>({
      title:m.title,image:`https://image.tmdb.org/t/p/w200${m.poster_path}`,desc:m.overview||"",type:"Movie"
    }));
    const bookQ = tags[0] || "bestseller";
    const books = (await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQ)}&maxResults=6`)).json()).items.map(b=>({
      title:b.volumeInfo.title,image:b.volumeInfo.imageLinks?.thumbnail||"",desc:b.volumeInfo.description||"",type:"Book"
    }));
    [...movies,...books].forEach(item=>{
      const card = document.createElement("div");
      card.className="p-4 border rounded-lg bg-white max-w-[200px]";
      card.innerHTML=`
        <img src="${item.image}" class="rounded mb-2">
        <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3>
        <p class="text-xs text-gray-600">${item.desc}</p>
        <button class="mt-2 px-3 py-1 bg-[#f3e7e8] rounded-full text-sm addWatch">Save</button>
      `;
      card.querySelector(".addWatch").onclick = ()=>{
        const list = getData("watchlist");
        list.push(item);
        saveData("watchlist",list);
        alert("Added to Watchlist!");
      };
      recList.appendChild(card);
    });
  }
  fetchData();
}

// Watchlist (watchlist.html)
if (document.getElementById("watchlistContainer")) {
  const container = document.getElementById("watchlistContainer");
  const items = getData("watchlist");
  items.forEach(item=>{
    const card = document.createElement("div");
    card.className="p-4 border rounded-lg bg-white max-w-[200px]";
    card.innerHTML=`
      <img src="${item.image}" class="rounded mb-2">
      <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3>
      <button class="mt-2 px-3 py-1 bg-[#e92932] text-white rounded-full text-sm removeBtn">Remove</button>
    `;
    card.querySelector(".removeBtn").onclick = ()=>{
      const list = getData("watchlist").filter(x=>x.title!==item.title);
      saveData("watchlist",list);
      card.remove();
    };
    container.appendChild(card);
  });
}
