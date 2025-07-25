const TMDB_API_KEY = "c5bb9a766bdc90fcc8f7293f6cd9c26a";

// Storage helpers
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getData(key, def=[]) { return JSON.parse(localStorage.getItem(key)) || def; }

// Elements
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const selectedList = document.getElementById("selectedList");
const tagContainer = document.getElementById("tagOptions");
const moodGrid = document.getElementById("moodGrid");
const recList = document.getElementById("recommendationList");
const watchlistContainer = document.getElementById("watchlistContainer");

let selectedTitles = [];
let selectedTags = [];
let selectedMood = null;

// Mood Icon Set (12)
const moods = [
  "https://img.icons8.com/emoji/48/grinning-face.png",
  "https://img.icons8.com/emoji/48/smiling-face-with-sunglasses.png",
  "https://img.icons8.com/emoji/48/exploding-head.png",
  "https://img.icons8.com/emoji/48/crying-face.png",
  "https://img.icons8.com/emoji/48/heart-with-arrow.png",
  "https://img.icons8.com/emoji/48/popcorn.png",
  "https://img.icons8.com/emoji/48/fearful-face.png",
  "https://img.icons8.com/emoji/48/pouting-face.png",
  "https://img.icons8.com/emoji/48/sun-behind-small-cloud.png",
  "https://img.icons8.com/emoji/48/new-moon-face.png",
  "https://img.icons8.com/emoji/48/running-shoe.png",
  "https://img.icons8.com/emoji/48/open-book.png"
];

// Tags
const tags = ["Suspenseful","Thought-Provoking","Wholesome","Intense","Emotional","Funny","Romantic","Action-Packed","Mysterious","Heartwarming"];

// Generate tags
if (tagContainer) {
  tags.forEach(tag => {
    const btn = document.createElement("div");
    btn.textContent = tag;
    btn.className = "px-4 py-1 bg-[#f3e7e8] rounded-full cursor-pointer";
    btn.onclick = () => {
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t=>t!==tag);
        btn.classList.remove("bg-[#994d51]","text-white");
      } else if (selectedTags.length<5) {
        selectedTags.push(tag);
        btn.classList.add("bg-[#994d51]","text-white");
      }
    };
    tagContainer.appendChild(btn);
  });
}

// Generate mood icons
if (moodGrid) {
  moods.forEach(url=>{
    const img = document.createElement("img");
    img.src = url;
    img.className = "cursor-pointer p-1 rounded hover:bg-[#f3e7e8]";
    img.onclick = ()=>{
      selectedMood = url;
      [...moodGrid.children].forEach(c=>c.classList.remove("bg-[#994d51]"));
      img.classList.add("bg-[#994d51]");
    };
    moodGrid.appendChild(img);
  });
}

// Search Movies & Books
if (searchInput) {
  searchInput.addEventListener("input", ()=> {
    const query = searchInput.value.trim();
    if (query.length>2) searchAll(query);
  });
}

async function searchAll(query) {
  searchResults.innerHTML="<li class='p-2 text-gray-500'>Searching...</li>";
  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const tmdbData = await tmdbRes.json();
    const tmdbResults = (tmdbData.results||[]).slice(0,5).map(item=>({id:item.id,title:item.title||item.name,type:item.media_type}));

    const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const bookData = await bookRes.json();
    const bookResults = (bookData.items||[]).map(b=>({id:b.id,title:b.volumeInfo.title,type:"book"}));

    const results = [...tmdbResults,...bookResults];
    searchResults.innerHTML="";
    if (!results.length) {
      searchResults.innerHTML="<li class='p-2 text-gray-500'>No results</li>";
    } else {
      results.forEach(item=>{
        const li=document.createElement("li");
        li.textContent=item.title;
        li.className="p-2 hover:bg-gray-100 cursor-pointer";
        li.onclick=()=>{
          selectedTitles.push(item);
          const chip=document.createElement("div");
          chip.className="px-3 py-1 bg-[#f3e7e8] rounded-full text-sm flex flex-col";
          chip.innerHTML=`<span>${item.title}</span><div class="details text-xs mt-1 text-gray-600"></div>`;
          selectedList.appendChild(chip);
          fetchDetails(item,chip.querySelector(".details"));
          searchResults.innerHTML="";
          searchInput.value="";
        };
        searchResults.appendChild(li);
      });
    }
  } catch(e){console.error(e);}
}

// Fetch reviews & keywords
async function fetchDetails(item,container) {
  container.innerHTML="Loading details...";
  try {
    if (item.type==="movie"||item.type==="tv") {
      const kwRes=await fetch(`https://api.themoviedb.org/3/${item.type}/${item.id}/keywords?api_key=${TMDB_API_KEY}`);
      const kwData=await kwRes.json();
      const keywords=(kwData.keywords||kwData.results||[]).map(k=>k.name).slice(0,5);
      const revRes=await fetch(`https://api.themoviedb.org/3/${item.type}/${item.id}/reviews?api_key=${TMDB_API_KEY}`);
      const revData=await revRes.json();
      const reviews=(revData.results||[]).slice(0,2).map(r=>truncateReview(r.content));
      renderDetails(container,keywords,reviews);
    } else {
      const gbRes=await fetch(`https://www.googleapis.com/books/v1/volumes/${item.id}`);
      const gbData=await gbRes.json();
      const keywords=(gbData.volumeInfo?.categories||[]).slice(0,5);
      const reviews=[truncateReview(gbData.volumeInfo?.description||"No description")];
      renderDetails(container,keywords,reviews);
    }
  } catch(e){container.innerHTML="No details";}
}

function truncateReview(text) {
  if (!text) return "No review";
  return text.length>200 ? `${text.slice(0,200)}... <span class="readmore text-blue-600 cursor-pointer">Read More</span>` : text;
}

function renderDetails(container,keywords,reviews) {
  container.innerHTML="";
  const kwDiv=document.createElement("div");
  kwDiv.className="flex gap-2 flex-wrap mb-2";
  keywords.forEach(k=>{
    const chip=document.createElement("div");
    chip.textContent=k;
    chip.className="px-2 py-1 bg-[#f3e7e8] rounded-full text-xs cursor-pointer";
    chip.onclick=()=>filterByKeyword(k);
    kwDiv.appendChild(chip);
  });
  container.appendChild(kwDiv);
  reviews.forEach(r=>{
    const p=document.createElement("p");
    p.className="mb-1 text-gray-700 text-sm";
    p.innerHTML=r;
    container.appendChild(p);
    const rm=p.querySelector(".readmore");
    if (rm) {
      rm.onclick=()=>{p.textContent=r.replace(/<.*?>/g,"");};
    }
  });
}

// Keyword filtering
async function filterByKeyword(keyword) {
  selectedTags=[keyword];
  document.getElementById("recommendButton").click();
}

// Recommendations
const recommendBtn=document.getElementById("recommendButton");
if (recommendBtn) {
  recommendBtn.onclick=async()=>{
    recList.innerHTML="<p class='p-4 text-gray-500'>Loading...</p>";
    const genreMap={"Suspenseful":53,"Thought-Provoking":18,"Wholesome":10751,"Intense":28,"Emotional":18,"Funny":35,"Romantic":10749,"Action-Packed":28,"Mysterious":9648,"Heartwarming":10751};
    const genreIds=selectedTags.map(t=>genreMap[t]).filter(Boolean).join(",");
    try {
      const movieURL=`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&with_genres=${genreIds}`;
      const movies=(await (await fetch(movieURL)).json()).results.slice(0,6).map(m=>({id:m.id,title:m.title,image:`https://image.tmdb.org/t/p/w200${m.poster_path}`,desc:m.overview,type:"movie"}));
      const bookQ=selectedTags[0]||"bestseller";
      const books=(await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQ)}&maxResults=6`)).json()).items.map(b=>({id:b.id,title:b.volumeInfo.title,image:b.volumeInfo.imageLinks?.thumbnail||"",desc:b.volumeInfo.description||"",type:"book"}));
      const results=[...movies,...books];
      recList.innerHTML="";
      results.forEach(item=>{
        const card=document.createElement("div");
        card.className="p-4 border rounded-lg bg-white max-w-[220px] relative";
        const moodBadge=selectedMood?`<img src="${selectedMood}" class="absolute top-2 right-2 w-6 h-6">`:"";
        card.innerHTML=`
          ${moodBadge}
          <img src="${item.image}" class="rounded mb-2">
          <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3>
          <p class="text-xs text-gray-600">${item.desc.slice(0,100)}...</p>
          <div class="details text-xs mt-1 text-gray-600">Loading details...</div>
          <button class="mt-2 px-3 py-1 bg-[#f3e7e8] rounded-full text-sm addWatch">Save</button>`;
        recList.appendChild(card);
        fetchDetails(item,card.querySelector(".details"));
        card.querySelector(".addWatch").onclick=()=>{
          const list=getData("watchlist");
          list.push({...item,mood:selectedMood});
          saveData("watchlist",list);
          alert("Saved!");
        };
      });
    } catch(e){console.error(e);}
  };
}

// Watchlist page
if (watchlistContainer) {
  const items=getData("watchlist");
  if (!items.length) watchlistContainer.innerHTML="<p class='p-4 text-gray-500'>No saved titles.</p>";
  items.forEach(item=>{
    const card=document.createElement("div");
    card.className="p-4 border rounded-lg bg-white max-w-[200px] relative";
    const moodBadge=item.mood?`<img src="${item.mood}" class="absolute top-2 right-2 w-6 h-6">`:"";
    card.innerHTML=`
      ${moodBadge}
      <img src="${item.image}" class="rounded mb-2">
      <h3 class="font-bold">${item.title} <span class="text-xs text-gray-500">(${item.type})</span></h3
