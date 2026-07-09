/**
 * 開發組規範文檔 — 配置驅動的導航與內容載入
 * 支援 HTTP 伺服器（fetch）與 file:// 本地直接開啟（bundle.js）
 */

(function () {
  const mainEl = document.getElementById("main");
  const navListEl = document.getElementById("nav-list");
  const footerLinkEl = document.getElementById("footer-link");
  const navToggleEl = document.getElementById("nav-toggle");
  const sidebarOverlayEl = document.getElementById("sidebar-overlay");
  const sidebarCloseEl = document.getElementById("sidebar-close");
  const mobileTopbarTitleEl = document.getElementById("mobile-topbar-title");

  const mobileLayoutQuery = window.matchMedia("(max-width: 1024px)");
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

  function isMobileLayout() {
    return mobileLayoutQuery.matches;
  }

  function setSidebarOpen(isOpen) {
    document.body.classList.toggle("sidebar-open", isOpen);
    if (navToggleEl) {
      navToggleEl.setAttribute("aria-expanded", String(isOpen));
      navToggleEl.setAttribute("aria-label", isOpen ? "關閉導航" : "開啟導航");
    }
    if (sidebarOverlayEl) {
      sidebarOverlayEl.setAttribute("aria-hidden", String(!isOpen));
    }
  }

  function openSidebar() {
    if (!isMobileLayout()) return;
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function toggleSidebar() {
    if (!isMobileLayout()) return;
    setSidebarOpen(!document.body.classList.contains("sidebar-open"));
  }

  function closeSidebarIfMobile() {
    if (isMobileLayout()) {
      closeSidebar();
    }
  }

  function scrollToMainTop() {
    if (isMobileLayout()) {
      const top =
        mainEl.getBoundingClientRect().top +
        window.scrollY -
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--mobile-topbar-height"
          ) || "52"
        );
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToAnchor(anchorId) {
    const anchor = document.getElementById(anchorId);
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initMobileNav() {
    navToggleEl?.addEventListener("click", toggleSidebar);
    sidebarCloseEl?.addEventListener("click", closeSidebar);
    sidebarOverlayEl?.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSidebar();
      }
    });

    mobileLayoutQuery.addEventListener("change", () => {
      if (!isMobileLayout()) {
        closeSidebar();
      }
    });
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

  function lockCopyButtonWidth(button, defaultLabel) {
    const states = [defaultLabel, "已複製", "複製失敗"];
    const computed = getComputedStyle(button);
    const probe = document.createElement("span");
    probe.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "white-space:nowrap",
      `font-family:${computed.fontFamily}`,
      `font-size:${computed.fontSize}`,
      `font-weight:${computed.fontWeight}`,
      `letter-spacing:${computed.letterSpacing}`,
    ].join(";");
    document.body.appendChild(probe);

    let maxTextWidth = 0;
    states.forEach((label) => {
      probe.textContent = label;
      maxTextWidth = Math.max(maxTextWidth, probe.offsetWidth);
    });
    document.body.removeChild(probe);

    const paddingX =
      parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    const borderX =
      parseFloat(computed.borderLeftWidth) + parseFloat(computed.borderRightWidth);
    button.style.minWidth = `${Math.ceil(maxTextWidth + paddingX + borderX)}px`;
    button.style.textAlign = "center";
  }

  function bindCopyPromptButtons(root = document) {
    root.querySelectorAll(".copy-prompt-btn").forEach((button) => {
      if (button.dataset.copyBound === "true") return;
      button.dataset.copyBound = "true";

      if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.textContent.trim();
      }
      lockCopyButtonWidth(button, button.dataset.defaultLabel);

      button.addEventListener("click", async () => {
        const path = button.dataset.copyPrompt;
        if (!path) return;

        const defaultLabel = button.dataset.defaultLabel;
        button.disabled = true;

        try {
          const text = await loadPromptText(path);
          await copyTextToClipboard(text);
          button.textContent = "已複製";
          window.setTimeout(() => {
            button.textContent = defaultLabel;
            button.disabled = false;
          }, 2000);
        } catch (error) {
          button.textContent = "複製失敗";
          console.error(error);
          window.setTimeout(() => {
            button.textContent = defaultLabel;
            button.disabled = false;
          }, 2000);
        }
      });
    });
  }

  let echartsLoadPromise = null;

  const ORG_CHART_MUTED = {
    itemStyle: {
      color: "#fafafa",
      borderColor: "#cccccc",
      borderWidth: 1,
      borderType: "dashed",
    },
    label: { color: "#666666" },
  };

  const ORG_CHART_DATA = {
    name: "VTM DIGITAL LIMITED",
    symbolSize: [210, 46],
    itemStyle: { color: "#0a0a0a", borderColor: "#0a0a0a", borderWidth: 0 },
    label: { color: "#ffffff", fontWeight: 700, fontSize: 13 },
    children: [
      {
        name: "CTO\nVictor DAO",
        symbolSize: [132, 50],
        itemStyle: { color: "#ffffff", borderColor: "#1a1a1a", borderWidth: 2 },
        label: { color: "#1a1a1a", fontWeight: 600 },
        children: [
          {
            name: "Technical Department\n本文檔重點",
            symbolSize: [188, 50],
            itemStyle: { color: "#ffffff", borderColor: "#1a1a1a", borderWidth: 2 },
            label: { color: "#1a1a1a", fontWeight: 600 },
            children: [
              {
                name: "Project Management\n& Operation",
                symbolSize: [156, 46],
                itemStyle: {
                  color: "#f5f5f5",
                  borderColor: "#1a1a1a",
                  borderWidth: 1,
                },
              },
              {
                name: "R&D",
                symbolSize: [84, 40],
                itemStyle: {
                  color: "#f5f5f5",
                  borderColor: "#1a1a1a",
                  borderWidth: 1,
                },
              },
              {
                name: "Production\n開發組",
                symbolSize: [118, 50],
                itemStyle: { color: "#ffffff", borderColor: "#1a1a1a", borderWidth: 2 },
                label: { color: "#1a1a1a", fontWeight: 600 },
                children: [
                  {
                    name: "Graphics",
                    symbolSize: [96, 38],
                    itemStyle: {
                      color: "#ffffff",
                      borderColor: "#1a1a1a",
                      borderWidth: 1,
                    },
                  },
                  {
                    name: "Programming",
                    symbolSize: [108, 38],
                    itemStyle: {
                      color: "#ffffff",
                      borderColor: "#1a1a1a",
                      borderWidth: 1,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "CEO\nTerry DAO",
        symbolSize: [132, 50],
        itemStyle: { color: "#ffffff", borderColor: "#1a1a1a", borderWidth: 2 },
        label: { color: "#1a1a1a", fontWeight: 600 },
        children: [
          {
            name: "Business Development\nDepartment",
            symbolSize: [156, 46],
            ...ORG_CHART_MUTED,
          },
          {
            name: "Accounting\nDepartment",
            symbolSize: [132, 46],
            ...ORG_CHART_MUTED,
          },
          {
            name: "HR & Admin\nDepartment",
            symbolSize: [132, 46],
            ...ORG_CHART_MUTED,
          },
          {
            name: "Marketing",
            symbolSize: [104, 40],
            ...ORG_CHART_MUTED,
          },
        ],
      },
    ],
  };

  function loadEchartsScript() {
    if (window.echarts) {
      return Promise.resolve(window.echarts);
    }

    if (!echartsLoadPromise) {
      echartsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = resolveUrl("assets/vendor/echarts.min.js");
        script.onload = () => resolve(window.echarts);
        script.onerror = () => {
          reject(new Error("無法載入 ECharts（assets/vendor/echarts.min.js）"));
        };
        document.head.appendChild(script);
      });
    }

    return echartsLoadPromise;
  }

  function getOrgChartOption() {
    return {
      backgroundColor: "transparent",
      series: [
        {
          type: "tree",
          data: [ORG_CHART_DATA],
          orient: "TB",
          top: "4%",
          left: "3%",
          bottom: "4%",
          right: "3%",
          symbol: "rect",
          roam: false,
          expandAndCollapse: false,
          initialTreeDepth: -1,
          edgeShape: "polyline",
          edgeForkPosition: "50%",
          lineStyle: {
            color: "#333333",
            width: 1.5,
            curveness: 0,
          },
          label: {
            position: "inside",
            verticalAlign: "middle",
            align: "center",
            fontSize: 12,
            lineHeight: 16,
            color: "#1a1a1a",
            overflow: "break",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", "Helvetica Neue", sans-serif',
          },
          leaves: {
            label: {
              fontSize: 11,
            },
          },
          animationDuration: 250,
          animationDurationUpdate: 250,
        },
      ],
    };
  }

  function disposeOrgChart(mount) {
    if (mount._orgChartResize) {
      window.removeEventListener("resize", mount._orgChartResize);
      mount._orgChartResize = null;
    }
    if (mount._orgChartInstance) {
      mount._orgChartInstance.dispose();
      mount._orgChartInstance = null;
    }
  }

  async function initOrgChart(root) {
    const mount = root.querySelector("#org-chart-mount");
    if (!mount) return;

    disposeOrgChart(mount);
    mount.innerHTML = "";

    try {
      const echarts = await loadEchartsScript();
      const chart = echarts.init(mount, null, { renderer: "svg" });
      mount._orgChartInstance = chart;
      chart.setOption(getOrgChartOption());

      const resize = () => chart.resize();
      mount._orgChartResize = resize;
      window.addEventListener("resize", resize);
    } catch (error) {
      mount.innerHTML = `<p class="error-state">組織架構圖載入失敗：${error.message}</p>`;
      console.error(error);
    }
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
    const existingMount = mainEl.querySelector("#org-chart-mount");
    if (existingMount) {
      disposeOrgChart(existingMount);
    }

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
    await initOrgChart(mainEl);
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

      closeSidebarIfMobile();

      if (anchorId) {
        requestAnimationFrame(() => scrollToAnchor(anchorId));
      } else {
        requestAnimationFrame(() => scrollToMainTop());
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
    if (
      hash === "planner-progress-report" ||
      hash === "planner-man-day-change" ||
      hash === "planner-comment-join" ||
      hash === "planner-task-fields"
    ) {
      return { sectionId: "planner-manage-task", anchorId: hash };
    }
    if (
      hash === "phase-pre-production" ||
      hash === "phase-g1-p1" ||
      hash === "phase-g2-p2" ||
      hash === "phase-g3-p3"
    ) {
      return { sectionId: "development-phases", anchorId: hash };
    }
    return { sectionId: navConfig.defaultSection, anchorId: hash };
  }

  async function init() {
    try {
      await loadConfig();

      document.getElementById("site-title").textContent = navConfig.site.title;
      document.getElementById("site-subtitle").textContent = navConfig.site.subtitle;
      document.title = navConfig.site.title;
      if (mobileTopbarTitleEl) {
        mobileTopbarTitleEl.textContent = navConfig.site.title;
      }

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
      initMobileNav();

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
