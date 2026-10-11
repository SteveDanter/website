const state = { pages: window.SITE_PAGES || [] };

const labels = {
  life: "life",
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
  suzukigsx1000gx: "Suzuki GSX-S1000GX+",
  suzukim800: "Suzuki M800",
  triumph1050gt: "Triumph 1050 GT",
  hondaxl750: "Honda XL750",
  "astramax-2": "AstraMax",
  "santafe-2": "Santa Fe",
};

function displayTitle(page) {
  return displayNames[page.slug] || page.title;
}

/*
 * This controls the order of stories within each chapter.
 * It is used both by the homepage and by the Previous/Next
 * navigation on individual story pages.
 */
const preferredOrder = {
  life: [
    "on-foot-and-pedal-power",
    "my-bikes-and-cars"
  ],

  bikes: [
    "suzukits100",
    "yamahasr250",
    "suzukigs400",
    "suzukigs550",
    "kawasakigpz",
    "suzukim800",
    "triumph1050gt",
    "triumph-tiger-sport",
    "suzuki-1050-vstrom",
    "hondaxl750",
    "new-bike",
    "suzukigsx1000gx"
  ],

  cars: [
    "strada-2",
    "capri-2",
    "metro",
    "astramax-2",
    "vauxhall-astra",
    "primera-2",
    "santafe-2",
    "nissan-300zx",
    "renault-laguna",
    "citroen-c5"
  ],

  work: [
    "army",
    "bp",
    "radius",
    "cgi"
  ],

  travel: [
    "campsites"
    "photos-from-france",
    "france-2023",
    "france-june-2026",
    "france-sept-2026",
  ],
};

function ordered(category) {
  const order = preferredOrder[category] || [];

  return state.pages
    .filter((page) => page.category === category)
    .sort((a, b) => {
      const aIndex = order.indexOf(a.slug);
      const bIndex = order.indexOf(b.slug);

      const aOrder = aIndex === -1 ? Infinity : aIndex;
      const bOrder = bIndex === -1 ? Infinity : bIndex;

      return aOrder - bOrder;
    });
}

function storyUrl(slug) {
  return state.pages.find((page) => page.slug === slug)?.file || "index.html";
}

function card(page, index) {
  const image = page.image || "media/2024/11/questionmark.png";

  return `
    <article class="story-card reveal">
      <a href="${storyUrl(page.slug)}" aria-label="Read ${page.title}">
        <div class="card-image">
          <img src="${image}" alt="" loading="lazy">
        </div>
        <div class="card-meta">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <span>${labels[page.category]}</span>
        </div>
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
      .map(
        (page) =>
          `<a href="${storyUrl(page.slug)}">
            <span>${displayTitle(page)}</span>
            <span>→</span>
          </a>`
      )
      .join("");
  });

  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const rail = button.closest(".chapter")?.querySelector(".card-rail");

      if (!rail) return;

      rail.scrollBy({
        left: button.dataset.scroll === "forward" ? 420 : -420,
        behavior: "smooth",
      });
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.08 }
    );

    document
      .querySelectorAll(".reveal, .chapter-heading, .featured-story")
      .forEach((item) => observer.observe(item));
  }
}

function setupMenu() {
  const button = document.querySelector(".menu-button");

  if (!button) return;

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!open));

    document
      .getElementById("site-nav")
      ?.classList.toggle("is-open", !open);
  });
}

/*
 * Automatically add a Back to Top button to every page.
 * If the page already has one (such as index.html), it reuses it.
 */
function setupBackToTop() {
  let button = document.querySelector(".back-to-top");

  if (!button) {
    button = document.createElement("button");
    button.className = "back-to-top";
    button.type = "button";
    button.setAttribute("aria-label", "Back to the top");
    button.textContent = "↑";

    document.body.appendChild(button);
  }

  const updateBackToTopButton = () => {
    button.classList.toggle("is-visible", window.scrollY > 500);
  };

  window.addEventListener("scroll", updateBackToTopButton, {
    passive: true,
  });

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  updateBackToTopButton();
}

/*
 * Work out which story page is currently being displayed.
 */
function currentStory() {
  const filename =
    window.location.pathname.split("/").pop() || "index.html";

  return state.pages.find((page) => page.file === filename);
}

/*
 * Create Previous/Next navigation on story pages.
 *
 * Navigation remains within the same chapter:
 *
 * Bikes  -> previous/next bike
 * Cars   -> previous/next car
 * Work   -> previous/next job
 * Travel -> previous/next travel story
 *
 * This means CGI doesn't suddenly lead into a Citroen C5,
 * for example.
 */
function setupStoryNavigation() {
  const article = document.querySelector(".story-content");

  if (!article) return;

  const current = currentStory();

  if (!current) return;

  const stories = ordered(current.category);
  const index = stories.findIndex(
    (page) => page.file === current.file
  );

  if (index === -1) return;

  const previous = index > 0 ? stories[index - 1] : null;
  const next =
    index < stories.length - 1 ? stories[index + 1] : null;

  /*
   * Remove an old manually-created story-actions block if one
   * already exists at the end of the article. This prevents
   * duplicate navigation while converting older pages.
   */
  const existingActions = article.querySelector(":scope > .story-actions");

  if (existingActions) {
    existingActions.remove();
  }

  const navigation = document.createElement("nav");
  navigation.className = "story-navigation";
  navigation.setAttribute("aria-label", "Story navigation");

  const previousHolder = document.createElement("div");
  previousHolder.className = "story-navigation-previous";

  const nextHolder = document.createElement("div");
  nextHolder.className = "story-navigation-next";

  if (previous) {
    const previousLink = document.createElement("a");

    previousLink.className = "story-nav-button story-nav-previous";
    previousLink.href = previous.file;
    previousLink.innerHTML = `
      <span class="story-nav-direction">← Previous</span>
      <strong>${displayTitle(previous)}</strong>
    `;

    previousHolder.appendChild(previousLink);
  }

  if (next) {
    const nextLink = document.createElement("a");

    nextLink.className = "story-nav-button story-nav-next";
    nextLink.href = next.file;
    nextLink.innerHTML = `
      <span class="story-nav-direction">Next →</span>
      <strong>${displayTitle(next)}</strong>
    `;

    nextHolder.appendChild(nextLink);
  }

  navigation.appendChild(previousHolder);
  navigation.appendChild(nextHolder);

  article.appendChild(navigation);
}

setupMenu();
renderHome();
setupBackToTop();
setupStoryNavigation();
/* Photo viewer for in-article photographs and galleries. */
function setupPhotoViewer() {
  const dialog = document.createElement('dialog');
  dialog.className = 'site-photo-viewer';
  dialog.setAttribute('aria-label', 'Full-size photograph');
  dialog.innerHTML = `
    <div class="site-photo-toolbar">
      <button type="button" class="site-photo-back">← Back to the page</button>
    </div>
    <div class="site-photo-stage"><img alt=""></div>
    <p class="site-photo-caption"></p>`;
  document.body.appendChild(dialog);
  const back = dialog.querySelector('.site-photo-back');
  const photo = dialog.querySelector('img');
  const caption = dialog.querySelector('.site-photo-caption');
  let origin;
  let scrollPosition = 0;
  let previousOverflow = '';

  function imageLink(link) {
    if (!link) return false;
    try {
      return /\.(?:avif|gif|jpe?g|png|svg|webp|bmp)$/i.test(new URL(link.href).pathname);
    } catch { return false; }
  }

  function preparePhotos() {
    document.querySelectorAll('article.story-content img').forEach(img => {
      if (!img.getAttribute('src') || img.closest('[data-no-photo-viewer], .story-hero, .story-hero-image, .hero, .hero-gallery, .story-cover, .archive-card, .archive-intro, .slideshow, .carousel')) return;
      const destination = img.closest('a');
      if (destination && !imageLink(destination)) return;
      img.classList.add('site-photo-trigger');
      const link = img.closest('a');
      if (imageLink(link)) {
        link.setAttribute('aria-haspopup', 'dialog');
      } else {
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-haspopup', 'dialog');
        img.setAttribute('aria-label', img.alt ? `Enlarge photo: ${img.alt}` : 'Enlarge photograph');
      }
    });
  }

  function openPhoto(img) {
    origin = img.hasAttribute('tabindex') ? img : img.closest('a') || img;
    scrollPosition = window.scrollY;
    previousOverflow = document.documentElement.style.overflow;
    const link = img.closest('a');
    photo.src = imageLink(link) ? link.href : img.currentSrc || img.src;
    photo.alt = img.alt;
    const text = img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || img.alt;
    caption.textContent = text;
    caption.hidden = !text;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    back.focus({ preventScroll: true });
  }

  back.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      back.focus();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    photo.removeAttribute('src');
    origin?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
  });

  // Capture image clicks before older gallery handlers or image links open a tab.
  document.addEventListener('click', event => {
    const link = event.target.closest('main a');
    const img = event.target.closest('main img.site-photo-trigger') ||
      (imageLink(link) ? link.querySelector('img.site-photo-trigger') : null);
    if (!img || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openPhoto(img);
  }, true);
  document.addEventListener('keydown', event => {
    if (event.target.matches('main img.site-photo-trigger') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPhoto(event.target);
    }
  }, true);
  preparePhotos();
}

setupPhotoViewer();
