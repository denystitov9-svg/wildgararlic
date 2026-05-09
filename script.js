let currentQuery = "";
let currentPage = 1;
let currentMovieId = null;

// 1. Поиск
async function searchMovies(event, page = 1) {
  if (event) event.preventDefault();
  const searchInput = document.querySelector("#search");
  const query = event ? searchInput.value.trim() : currentQuery;
  const moviesContainer = document.querySelector(".movie-list");
  const statusText = document.querySelector(".js-movies-found");

  if (!query) return;

  currentQuery = query;
  currentPage = parseInt(page);
  moviesContainer.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=800c93bf&s=${query}&page=${page}`,
    );
    const data = await response.json();

    if (data.Response === "False") {
      statusText.textContent = data.Error;
      moviesContainer.innerHTML = "";
      renderPagination(0);
      return;
    }

    statusText.textContent = `${data.totalResults} movies found`;
    renderMovieList(data.Search);
    renderPagination(data.totalResults);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error(error);
  }
}

// 2. Список фильмов
function renderMovieList(movies) {
  const container = document.querySelector(".movie-list");
  container.innerHTML = movies
    .map(
      (m) => `
    <div class="movie-card" onclick="showMovieDetails('${m.imdbID}')">
      <img src="${m.Poster !== "N/A" ? m.Poster : "https://via.placeholder.com/300x450"}" alt="${m.Title}">
      <div class="movie-card__info">
        <h4>${m.Title}</h4>
        <p>${m.Year}</p>
      </div>
    </div>
  `,
    )
    .join("");
}

// 3. Пагинация (ИСПРАВЛЕННАЯ)
function renderPagination(totalResults) {
  const container = document.querySelector(".pagination");
  const totalPages = Math.ceil(totalResults / 10);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const maxPages = Math.min(totalPages, 100);
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(maxPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  let html = "";
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="searchMovies(null, ${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

// 4. Детали фильма
async function showMovieDetails(id) {
  currentMovieId = id;
  document.getElementById("home-page").classList.add("hidden");
  document.getElementById("movie-details").classList.remove("hidden");

  const content = document.getElementById("details-content");
  content.innerHTML = "<p>Loading details...</p>";

  const res = await fetch(`https://www.omdbapi.com/?apikey=800c93bf&i=${id}`);
  const m = await res.json();

  content.innerHTML = `
    <div style="display: flex; gap: 20px;">
      <img src="${m.Poster}" style="width: 250px; border-radius: 10px;">
      <div>
        <h2>${m.Title}</h2>
        <p><strong>Year:</strong> ${m.Year}</p>
        <p><strong>Plot:</strong> ${m.Plot}</p>
        <p><strong>IMDB Rating:</strong> ⭐ ${m.imdbRating}</p>
      </div>
    </div>
  `;
  updateStars(0); // Сброс звезд при открытии нового фильма
  loadReviews();
}

// 5. ЛОГИКА ЗВЕЗД (НОВАЯ)
const stars = document.querySelectorAll(".star");
const ratingInput = document.getElementById("user-rating");
const ratingValueText = document.getElementById("rating-value");

function updateStars(val) {
  stars.forEach((s) => s.classList.toggle("selected", s.dataset.value <= val));
  ratingValueText.textContent = `Selected: ${val}/10`;
  ratingInput.value = val;
}

stars.forEach((star) => {
  star.onclick = () => updateStars(star.dataset.value);
  star.onmouseover = () => {
    const v = star.dataset.value;
    stars.forEach(
      (s) => (s.style.color = s.dataset.value <= v ? "#f1c40f" : ""),
    );
  };
  star.onmouseout = () => stars.forEach((s) => (s.style.color = ""));
});

document.getElementById("reset-rating").onclick = () => updateStars(0);

// 6. Отзывы
document.getElementById("submit-review").onclick = () => {
  const text = document.getElementById("comment-text").value;
  const rating = ratingInput.value;
  if (!text.trim() || rating == 0)
    return alert("Please write a comment and select stars!");

  const review = { text, rating, date: new Date().toLocaleDateString() };
  const reviews = JSON.parse(localStorage.getItem(currentMovieId) || "[]");
  reviews.push(review);
  localStorage.setItem(currentMovieId, JSON.stringify(reviews));

  document.getElementById("comment-text").value = "";
  updateStars(0);
  loadReviews();
};

function loadReviews() {
  const container = document.getElementById("reviews-container");
  const reviews = JSON.parse(localStorage.getItem(currentMovieId) || "[]");
  container.innerHTML =
    reviews
      .map(
        (r) => `
    <div style="background: rgba(255,255,255,0.1); padding: 10px; margin-top: 10px; border-radius: 8px;">
      <p style="color: #f1c40f;">${"★".repeat(r.rating)} (${r.rating}/10)</p>
      <p>${r.text}</p>
      <small>${r.date}</small>
    </div>
  `,
      )
      .join("") || "<p>No reviews yet.</p>";
}

document.getElementById("back-btn").onclick = () => {
  document.getElementById("home-page").classList.remove("hidden");
  document.getElementById("movie-details").classList.add("hidden");
};

document.getElementById("search-form").onsubmit = (e) => searchMovies(e);
