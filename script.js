async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
}

// Inject animated star field into a hero element
function injectStarField(hero) {
  // Try loading the SVG first (root-relative path so it works on all pages)
  fetch("/assets/hero-stars.svg")
    .then(r => {
      if (!r.ok) throw new Error("SVG not found");
      return r.text();
    })
    .then(svg => {
      hero.insertAdjacentHTML("afterbegin", svg);
    })
    .catch(() => {
      // Fallback: generate a JS star field so the hero always looks great
      const container = document.createElement("div");
      container.id = "hero-stars";
      container.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;";

      const starCount = 90;
      for (let i = 0; i < starCount; i++) {
        const dot = document.createElement("div");
        const size = Math.random() * 2.2 + 0.6;
        const dur  = (2.5 + Math.random() * 4).toFixed(2);
        const delay = (Math.random() * 5).toFixed(2);
        // Mix mostly white stars with occasional faint gold ones
        const isGold = Math.random() < 0.12;
        dot.style.cssText = `
          position:absolute;
          border-radius:50%;
          width:${size}px;
          height:${size}px;
          left:${(Math.random() * 100).toFixed(2)}%;
          top:${(Math.random() * 100).toFixed(2)}%;
          background:${isGold ? "#e8b84b" : "#ffffff"};
          --dur:${dur}s;
          --delay:${delay}s;
          animation:twinkle ${dur}s ${delay}s ease-in-out infinite;
          opacity:0.1;
        `;
        container.appendChild(dot);
      }

      // Lone-star watermark (Texas ★)
      const loneStar = document.createElement("div");
      loneStar.style.cssText = `
        position:absolute;
        right:6%;
        top:50%;
        transform:translateY(-50%);
        font-size:320px;
        color:#c8922a;
        opacity:0.04;
        line-height:1;
        pointer-events:none;
        animation:pulse-star 6s ease-in-out infinite;
        user-select:none;
      `;
      loneStar.textContent = "★";
      container.appendChild(loneStar);

      hero.insertAdjacentElement("afterbegin", container);

      // Inject keyframes once
      if (!document.getElementById("star-keyframes")) {
        const style = document.createElement("style");
        style.id = "star-keyframes";
        style.textContent = `
          @keyframes twinkle {
            0%,100% { opacity:0.1; transform:scale(1); }
            50%      { opacity:0.75; transform:scale(1.5); }
          }
          @keyframes pulse-star {
            0%,100% { opacity:0.04; }
            50%      { opacity:0.07; }
          }
        `;
        document.head.appendChild(style);
      }
    });
}

document.addEventListener("DOMContentLoaded", async function () {

  await Promise.all([
    loadComponent("#site-header", "/components/header.html"),
    loadComponent("#site-footer", "/components/footer.html"),
  ]);

  // Star field — works on index hero AND any page-hero
  const hero = document.querySelector(".hero, .page-hero");
  if (hero) injectStarField(hero);

  // Mobile menu toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav    = document.querySelector(".site-nav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      siteNav.classList.toggle("open");
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!menuToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

});
