/**
 * 開發組規範文檔 — 導航與欄目切換
 */

(function () {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");
  const sectionRefs = document.querySelectorAll(".section-ref");

  function getSectionForAnchor(anchorId) {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return null;
    const section = anchor.closest(".section");
    return section ? section.dataset.section : null;
  }

  function scrollToAnchor(anchorId) {
    const anchor = document.getElementById(anchorId);
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function activateSection(sectionId, anchorId) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });

    sections.forEach((section) => {
      section.classList.toggle("active", section.dataset.section === sectionId);
    });

    const hash = anchorId || sectionId;
    history.replaceState(null, "", `#${hash}`);

    if (anchorId) {
      requestAnimationFrame(() => scrollToAnchor(anchorId));
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function bindSectionNavigation(link) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      const href = link.getAttribute("href") || "";
      const anchorId =
        link.dataset.anchor ||
        (href.startsWith("#habit-") ? href.slice(1) : null);
      activateSection(sectionId, anchorId);
    });
  }

  navLinks.forEach(bindSectionNavigation);
  sectionRefs.forEach(bindSectionNavigation);

  const hash = window.location.hash.slice(1);
  if (!hash) return;

  if (document.querySelector(`[data-section="${hash}"]`)) {
    activateSection(hash);
    return;
  }

  const sectionId = getSectionForAnchor(hash);
  if (sectionId) {
    activateSection(sectionId, hash);
  }
})();
