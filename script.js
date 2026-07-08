/**
 * 開發組規範文檔 — 配置驅動的導航與內容載入
 * 支援 HTTP 伺服器（fetch）與 file:// 本地直接開啟（bundle.js）
 */

(function () {
  const mainEl = document.getElementById("main");
  const navListEl = document.getElementById("nav-list");
  const footerLinkEl = document.getElementById("footer-link");

  const sectionCache = new Map();
  let navConfig = null;
  let bundleSections = null;
  let bundleExamples = null;
  let activeSectionId = null;
  const isFileProtocol = window.location.protocol === "file:";

  function resolveUrl(path) {
    return new URL(path, document.baseURI).href;
  }

  async function fetchText(path) {
    const response = await fetch(resolveUrl(path));
    if (!response.ok) {
      throw new Error(`無法載入 ${path}（${response.status}）`);
    }
    return response.text();
  }

  function applyBundle(bundle) {
    navConfig = bundle.nav;
    bundleSections = bundle.sections;
    bundleExamples = bundle.examples;
  }

  async function loadConfig() {
    if (window.GUIDELINES_BUNDLE) {
      applyBundle(window.GUIDELINES_BUNDLE);
      return;
    }

    if (isFileProtocol) {
      throw new Error(
        "缺少 content/bundle.js。請在專案目錄執行：python3 build.py"
      );
    }

    navConfig = JSON.parse(await fetchText("config/nav.json"));
  }

  function createNavLink(item) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${item.id}`;
    link.className = "nav-link";
    link.dataset.section = item.id;
    link.textContent = item.label;
    li.appendChild(link);
    return li;
  }

  function renderNav(config) {
    navListEl.innerHTML = "";

    config.nav.forEach((item) => {
      if (item.type === "link") {
        navListEl.appendChild(createNavLink(item));
        return;
      }

      if (item.type === "group") {
        const groupLi = document.createElement("li");
        groupLi.className = "nav-group";

        const label = document.createElement("span");
        label.className = "nav-group-label";
        label.textContent = item.label;

        const sublist = document.createElement("ul");
        sublist.className = "nav-sublist";
        item.children.forEach((child) => {
          sublist.appendChild(createNavLink(child));
        });

        groupLi.appendChild(label);
        groupLi.appendChild(sublist);
        navListEl.appendChild(groupLi);
      }
    });
  }

  function getSectionMeta(sectionId) {
    return navConfig?.sections?.[sectionId] || null;
  }

  async function loadSectionHtml(sectionId) {
    if (sectionCache.has(sectionId)) {
      return sectionCache.get(sectionId);
    }

    if (bundleSections?.[sectionId]) {
      const html = bundleSections[sectionId];
      sectionCache.set(sectionId, html);
      return html;
    }

    const meta = getSectionMeta(sectionId);
    if (!meta?.file) {
      throw new Error(`找不到欄目設定：${sectionId}`);
    }

    const html = await fetchText(meta.file);
    sectionCache.set(sectionId, html);
    return html;
  }

  async function loadExampleText(path) {
    if (bundleExamples?.[path]) {
      return bundleExamples[path];
    }
    return fetchText(path);
  }

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

  function setNavActive(sectionId) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });
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

  function bindCrossReferences() {
    document.querySelectorAll(".section-ref").forEach(bindSectionNavigation);
  }

  async function loadPromptText(path) {
    return loadExampleText(path);
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function bindCopyPromptButtons(root = document) {
    root.querySelectorAll(".copy-prompt-btn").forEach((button) => {
      if (button.dataset.copyBound === "true") return;
      button.dataset.copyBound = "true";

      button.addEventListener("click", async () => {
        const path = button.dataset.copyPrompt;
        if (!path) return;

        const defaultLabel = button.dataset.defaultLabel || "複製 Prompt";
        button.disabled = true;

        try {
          const text = await loadPromptText(path);
          await copyTextToClipboard(text);
          button.textContent = "已複製";
          button.classList.add("is-copied");
          window.setTimeout(() => {
            button.textContent = defaultLabel;
            button.classList.remove("is-copied");
            button.disabled = false;
          }, 2000);
        } catch (error) {
          button.textContent = "複製失敗";
          button.classList.add("is-error");
          console.error(error);
          window.setTimeout(() => {
            button.textContent = defaultLabel;
            button.classList.remove("is-error");
            button.disabled = false;
          }, 2000);
        }
      });
    });
  }

  async function loadEmbeddedExamples(root) {
    const textExamples = root.querySelectorAll("[data-example]");
    await Promise.all(
      Array.from(textExamples).map(async (el) => {
        const path = el.dataset.example;
        if (!path || el.dataset.loaded === "true") return;
        try {
          el.textContent = await loadExampleText(path);
          el.dataset.loaded = "true";
        } catch {
          el.textContent = `無法載入範例：${path}`;
        }
      })
    );

    const htmlExamples = root.querySelectorAll("[data-example-html]");
    await Promise.all(
      Array.from(htmlExamples).map(async (el) => {
        const path = el.dataset.exampleHtml;
        if (!path || el.dataset.loaded === "true") return;
        try {
          el.innerHTML = await loadExampleText(path);
          el.dataset.loaded = "true";
          bindCrossReferences();
        } catch {
          el.innerHTML = `<p class="error-state">無法載入：${path}</p>`;
        }
      })
    );
  }

  async function mountSection(sectionId) {
    const html = await loadSectionHtml(sectionId);
    const meta = getSectionMeta(sectionId);

    mainEl.innerHTML = html;

    const sectionEl = mainEl.querySelector(".section");
    if (sectionEl) {
      sectionEl.classList.add("active");
      if (meta?.className) {
        sectionEl.classList.add(...meta.className.split(/\s+/).filter(Boolean));
      }
    }

    await loadEmbeddedExamples(mainEl);
    bindCrossReferences();
    bindCopyPromptButtons(mainEl);
    setNavActive(sectionId);
    activeSectionId = sectionId;
  }

  async function activateSection(sectionId, anchorId) {
    try {
      if (activeSectionId !== sectionId) {
        await mountSection(sectionId);
      }

      const hash = anchorId || sectionId;
      history.replaceState(null, "", `#${hash}`);

      if (anchorId) {
        requestAnimationFrame(() => scrollToAnchor(anchorId));
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      mainEl.innerHTML = `<div class="error-state"><h2>載入失敗</h2><p>${error.message}</p></div>`;
      console.error(error);
    }
  }

  function resolveHash(hash) {
    if (!hash) {
      return { sectionId: navConfig.defaultSection, anchorId: null };
    }
    if (navConfig.sections[hash]) {
      return { sectionId: hash, anchorId: null };
    }
    if (hash.startsWith("habit-")) {
      return { sectionId: "work-habits", anchorId: hash };
    }
    if (hash === "youtube-upload" || hash === "youtube-share") {
      return { sectionId: "youtube-upload-share", anchorId: hash };
    }
    if (hash === "planner-progress-report") {
      return { sectionId: "planner-manage-task", anchorId: hash };
    }
    return { sectionId: navConfig.defaultSection, anchorId: hash };
  }

  async function init() {
    try {
      await loadConfig();

      document.getElementById("site-title").textContent = navConfig.site.title;
      document.getElementById("site-subtitle").textContent = navConfig.site.subtitle;
      document.title = navConfig.site.title;

      if (navConfig.site.version) {
        document.getElementById("site-version").textContent = navConfig.site.version;
      }
      if (navConfig.site.updatedAt) {
        document.getElementById("site-updated").textContent =
          `更新於 ${navConfig.site.updatedAt}`;
      }
      if (navConfig.site.copyright) {
        document.getElementById("site-copyright").textContent =
          navConfig.site.copyright;
      }

      if (navConfig.footer) {
        footerLinkEl.textContent = navConfig.footer.label;
        footerLinkEl.dataset.section = navConfig.footer.id;
        footerLinkEl.href = `#${navConfig.footer.id}`;
      }

      renderNav(navConfig);
      bindSectionNavigation(footerLinkEl);

      const hash = window.location.hash.slice(1);
      const { sectionId, anchorId } = resolveHash(hash);

      await activateSection(sectionId, anchorId);
    } catch (error) {
      mainEl.innerHTML = `<div class="error-state"><h2>初始化失敗</h2><p>${error.message}</p></div>`;
      console.error(error);
    }
  }

  window.addEventListener("hashchange", () => {
    if (!navConfig) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    if (navConfig.sections[hash]) {
      activateSection(hash);
      return;
    }

    const { sectionId, anchorId } = resolveHash(hash);
    if (sectionId) {
      activateSection(sectionId, anchorId);
    }
  });

  init();
})();
