// ===== Navbar =====
const nav = document.querySelector(".site-nav");
const navMenu = document.getElementById("navMenu");

// Soft shadow under the navbar once the page is scrolled
function updateNavShadow() {
  nav.classList.toggle("scrolled", window.scrollY > 10);
}

updateNavShadow();
window.addEventListener("scroll", updateNavShadow, { passive: true });

// On phones, close the dropdown menu after a link is tapped
nav.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (navMenu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false }).hide();
    }
  });
});
