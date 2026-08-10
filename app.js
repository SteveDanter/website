const state = { pages: window.SITE_PAGES || [] };

const labels = {
  life: "Life",
  bikes: "Motorbike",
  cars: "Car",
  work: "Working life",
  travel: "Journey",
};

const displayNames = {
  yamahasr250: "Yamaha SR250",
  suzukits100: "Suzuki TS100",
  suzukigs400: "Suzuki GS400",
  suzukigs550: "Suzuki GS550",
  kawasakigpz: "Kawasaki GPz",
  suzukim800: "Suzuki M800",
  triumph1050gt: "Triumph 1050 GT",
  hondaxl750: "Honda XL750",
  "astramax-2": "AstraMax",
  "santafe-2": "Santa Fe",
};

function displayTitle(page) {
  return displayNames[page.slug] || page.title;
}

const preferredOrder = {
  bikes: ["suzukits100", "yamahasr250", "suzukigs400", "suzukigs550", "kawasakigpz", "suzukim800", "triumph1050gt", "triumph-tiger-sport", "suzuki-1050-vstrom", "hondaxl750", "new-bike"],
  cars: ["strada-2", "metro", "capri-2", "astramax-2", "vauxhall-astra", "primera-2", "santafe-2", "nissan-300zx", "renault-laguna", "citroen-c5"],
  work: ["army", "radius", "bp", "cgi"],
  travel: ["the-journey-there", "home", "france-2023", "france-2026", "campsites", "ni"],
};

function ordered(category) {
  const order = preferredOrder[category] || [];
  return state.pages
    .filter((page) => page.category === category)
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

function storyUrl(slug) {
  return state.pages.find((page) => page.slug === slug)?.file || "index.html";
}

function card(page, index) {
  const image = page.image || "media/2024/11/questionmark.png";
  return `
    <article class="story-card reveal">
      <a href="${storyUrl(page.slug)}" aria-label="Read ${page.title}">
        <div class="card-image"><img src="${image}" alt="" loading="lazy"></div>
        <div class="card-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${labels[page.category]}</span></div>
        <h3>${displayTitle(page)}</h3>
        <p>${page.excerpt}</p>
        <span class="card-arrow">Read the story →</span>
      </a>
    </article>`;
}

function renderHome() {
  document.querySelectorAll("[data-cards]").forEach((container) => {
    const category = container.dataset.cards;
    container.innerHTML = ordered(category).map(card).join("");
  });

  document.querySelectorAll("[data-links]").forEach((container) => {
    const category = container.dataset.links;
    container.innerHTML = ordered(category)
      .map((page) => `<a href="${storyUrl(page.slug)}"><span>${displayTitle(page)}</span><span>→</span></a>`)
      .join("");
  });

  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const rail = button.closest(".chapter").querySelector(".card-rail");
      rail.scrollBy({ left: button.dataset.scroll === "forward" ? 420 : -420, behavior: "smooth" });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible"));
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal, .chapter-heading, .featured-story").forEach((item) => observer.observe(item));
}

function setupMenu() {
  const button = document.querySelector(".menu-button");
  if (!button) return;
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    document.getElementById("site-nav").classList.toggle("is-open", !open);
  });
}

setupMenu();
renderHome();
