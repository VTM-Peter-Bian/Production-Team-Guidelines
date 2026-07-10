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

  function buildSectionGroupLabels(navItems) {
    const map = new Map();

    navItems.forEach((item) => {
      if (item.type === "group" && item.children) {
        item.children.forEach((child) => {
          if (child.type === "link" && child.id) {
            map.set(child.id, item.label);
          }
        });
        return;
      }

      if (item.type === "link" && item.id) {
        map.set(item.id, item.label);
      }
    });

    return map;
  }

  function getSectionGroupLabel(sectionId) {
    const groupLabels = buildSectionGroupLabels(navConfig.nav);
    if (groupLabels.has(sectionId)) {
      return groupLabels.get(sectionId);
    }

    if (navConfig.footer?.id === sectionId) {
      return "附錄";
    }

    return null;
  }

  function applySectionGroupLabel(sectionId, root) {
    const label = getSectionGroupLabel(sectionId);
    if (!label) return;

    const labelEl = root.querySelector(".section-label");
    if (labelEl) {
      labelEl.textContent = label;
    }
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

  const DEV_ENV_DEPRECATED_STYLE = {
    color: "#dddddd",
    borderColor: "#aaaaaa",
    borderWidth: 1,
    borderType: "dashed",
  };

  const DEV_ENV_NODE_SIZES = [22, 16, 10, 8];

  const DEV_ENV_LABEL_FONT =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif';

  function devEnvNode(id, name, category, overrides = {}) {
    return {
      id,
      name,
      category,
      symbol: "circle",
      symbolSize: DEV_ENV_NODE_SIZES[category],
      ...(category === 3 ? { itemStyle: DEV_ENV_DEPRECATED_STYLE } : {}),
      ...overrides,
    };
  }

  const DEV_ENV_GRAPH = {
    categories: [
      {
        name: "核心",
        itemStyle: { color: "#f8b4c4", borderColor: "#e895a8", borderWidth: 2 },
      },
      {
        name: "核心分支",
        itemStyle: { color: "#f5c882", borderColor: "#e5a84a", borderWidth: 2 },
      },
      {
        name: "組成部分",
        itemStyle: { color: "#4a4a4a", borderColor: "#4a4a4a", borderWidth: 0 },
      },
      {
        name: "棄用",
        itemStyle: DEV_ENV_DEPRECATED_STYLE,
      },
    ],
    nodes: [
      devEnvNode("unity", "Unity 6", 0),

      devEnvNode("data-mgmt", "1. Data Management", 1),
      devEnvNode("azure-web", "Azure Static Web", 2),
      devEnvNode("azure-db", "Azure Database", 2),
      devEnvNode("aws-web", "AWS Web", 3),
      devEnvNode("aws-db", "AWS Database", 3),
      devEnvNode("azure-blob", "Azure Blob", 2),
      devEnvNode("aws-s3", "AWS S3", 3),

      devEnvNode("src-code", "2. Source Code", 1),
      devEnvNode("gh-desktop", "GitHub Desktop", 2),
      devEnvNode("github", "GitHub", 2),
      devEnvNode("back-up", "Back Up", 1),
      devEnvNode("vtm-nas", "VTM-NAS", 2),
      devEnvNode("smart-svn", "Smart SVN", 3),
      devEnvNode("svn", "SVN", 3),

      devEnvNode("platforms", "3. Platforms", 1),
      devEnvNode("android", "Android", 2),
      devEnvNode("ios", "iOS", 2),
      devEnvNode("windows", "Windows", 2),
      devEnvNode("hardware", "XR Headset", 2),
      devEnvNode("meta-quest", "Meta Quest", 2),
      devEnvNode("pico", "Pico", 2),
      devEnvNode("htc", "HTC", 2),
      devEnvNode("api-std", "API Standard", 2),
      devEnvNode("openxr", "OpenXR", 2),
      devEnvNode("application", "Application", 2),
      devEnvNode("pcvr", "PCVR", 2),

      devEnvNode("factory", "4. Software Factory", 1),
      devEnvNode("sf-library", "Library", 1),
      devEnvNode("design-lib", "Design Lib", 2),
      devEnvNode("function-lib", "Function Lib", 2),
      devEnvNode("ui-lib", "UI Lib", 2),
      devEnvNode("sf-standard", "Standard", 1),
      devEnvNode("tsa", "TSA", 2),
      devEnvNode("reds", "REDS", 2),
      devEnvNode("sf-template", "Template", 1),
      devEnvNode("ctp", "CTP", 2),
      devEnvNode("pmtp", "PMTP", 2),

      devEnvNode("ai", "5. AI", 1),
      devEnvNode("ai-tools", "Tools", 1),
      devEnvNode("cursor", "Cursor", 2),
      devEnvNode("genspark", "Genspark", 2),
      devEnvNode("minimax", "MiniMax", 2),
      devEnvNode("ai-api", "API", 1),
      devEnvNode("deepseek", "DeepSeek", 2),
      devEnvNode("doubao", "Doubao", 2),

      devEnvNode("third-party", "6. 3rd Party", 1),
      devEnvNode("tp-plugin", "Plugin", 1),
      devEnvNode("opencv", "OpenCV", 2),
      devEnvNode("tp-sdk", "SDK", 1),
      devEnvNode("omni-one-sdk", "Omni One SDK", 2),
      devEnvNode("lcc-unity", "LCC Unity", 2),
      devEnvNode("votanic", "Votanic", 2),
      devEnvNode("tp-hardware", "Hardware", 1),
      devEnvNode("omni-one", "Omni One", 2),
      devEnvNode("webcam", "Webcam", 2),
      devEnvNode("portal-cam", "PortalCam", 2),
    ],
    links: [
      { source: "unity", target: "data-mgmt" },
      { source: "unity", target: "src-code" },
      { source: "unity", target: "platforms" },
      { source: "unity", target: "factory" },
      { source: "unity", target: "ai" },
      { source: "unity", target: "third-party" },

      { source: "data-mgmt", target: "azure-web" },
      { source: "azure-web", target: "azure-db" },
      { source: "data-mgmt", target: "azure-blob" },
      { source: "data-mgmt", target: "aws-web", lineStyle: { type: "dashed", opacity: 0.4 } },
      { source: "aws-web", target: "aws-db", lineStyle: { type: "dashed", opacity: 0.4 } },
      { source: "data-mgmt", target: "aws-s3", lineStyle: { type: "dashed", opacity: 0.4 } },

      { source: "src-code", target: "gh-desktop" },
      { source: "gh-desktop", target: "github" },
      { source: "src-code", target: "back-up" },
      { source: "back-up", target: "vtm-nas" },
      { source: "github", target: "back-up" },
      { source: "src-code", target: "smart-svn", lineStyle: { type: "dashed", opacity: 0.4 } },
      { source: "smart-svn", target: "svn", lineStyle: { type: "dashed", opacity: 0.4 } },

      { source: "platforms", target: "android" },
      { source: "platforms", target: "windows" },
      { source: "platforms", target: "ios" },
      { source: "android", target: "hardware" },
      { source: "hardware", target: "meta-quest" },
      { source: "hardware", target: "pico" },
      { source: "hardware", target: "htc" },
      { source: "meta-quest", target: "openxr", lineStyle: { type: "dashed", opacity: 0.7, curveness: 0.45 } },
      { source: "pico", target: "openxr", lineStyle: { type: "dashed", opacity: 0.7, curveness: 0.2 } },
      { source: "htc", target: "openxr", lineStyle: { type: "dashed", opacity: 0.7, curveness: -0.35 } },
      { source: "android", target: "api-std" },
      { source: "api-std", target: "openxr" },
      { source: "windows", target: "application" },
      { source: "windows", target: "pcvr" },
      { source: "pcvr", target: "openxr", lineStyle: { type: "dashed", opacity: 0.7, curveness: -0.5 } },

      { source: "factory", target: "sf-library" },
      { source: "factory", target: "sf-standard" },
      { source: "factory", target: "sf-template" },
      { source: "sf-library", target: "design-lib" },
      { source: "sf-library", target: "function-lib" },
      { source: "sf-library", target: "ui-lib" },
      { source: "sf-standard", target: "tsa" },
      { source: "sf-standard", target: "reds" },
      { source: "sf-template", target: "ctp" },
      { source: "sf-template", target: "pmtp" },
      { source: "design-lib", target: "tsa", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.35 } },
      { source: "design-lib", target: "reds", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.5 } },
      { source: "function-lib", target: "tsa", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.2 } },
      { source: "function-lib", target: "reds", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.25 } },
      { source: "ui-lib", target: "tsa", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.4 } },
      { source: "ui-lib", target: "reds", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.2 } },
      { source: "ctp", target: "design-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.45 } },
      { source: "ctp", target: "function-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.25 } },
      { source: "ctp", target: "ui-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: -0.1 } },
      { source: "pmtp", target: "design-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.55 } },
      { source: "pmtp", target: "function-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.4 } },
      { source: "pmtp", target: "ui-lib", lineStyle: { type: "dashed", opacity: 0.65, curveness: 0.25 } },

      { source: "ai", target: "ai-tools" },
      { source: "ai", target: "ai-api" },
      { source: "ai-tools", target: "cursor" },
      { source: "ai-tools", target: "genspark" },
      { source: "ai-tools", target: "minimax" },
      { source: "ai-api", target: "deepseek" },
      { source: "ai-api", target: "doubao" },

      { source: "third-party", target: "tp-plugin" },
      { source: "third-party", target: "tp-sdk" },
      { source: "third-party", target: "tp-hardware" },
      { source: "tp-plugin", target: "opencv" },
      { source: "tp-sdk", target: "omni-one-sdk" },
      { source: "tp-sdk", target: "lcc-unity" },
      { source: "tp-sdk", target: "votanic" },
      { source: "tp-hardware", target: "omni-one" },
      { source: "tp-hardware", target: "portal-cam" },
      { source: "tp-hardware", target: "webcam" },
      {
        source: "omni-one",
        target: "omni-one-sdk",
        lineStyle: { type: "dashed", opacity: 0.7, curveness: 0.25 },
      },
      {
        source: "portal-cam",
        target: "lcc-unity",
        lineStyle: { type: "dashed", opacity: 0.7, curveness: -0.25 },
      },
      {
        source: "webcam",
        target: "opencv",
        lineStyle: { type: "dashed", opacity: 0.7, curveness: 0.4 },
      },
      {
        source: "tp-sdk",
        target: "application",
        lineStyle: { color: "#888888", type: "dashed", width: 1.5, opacity: 0.7, curveness: -0.35 },
      },
      {
        source: "tp-plugin",
        target: "application",
        lineStyle: { color: "#888888", type: "dashed", width: 1.5, opacity: 0.7, curveness: -0.45 },
      },
    ],
  };

  /**
   * 六區固定座標（大幅拉開間距）
   *
   *              [4 Factory]
   *   [1 Data]                 [3 Platforms]
   *              Unity 6
   *   [2 Source]    [5 AI]     [6 3rd Party]
   */
  const DEV_ENV_LAYOUT = {
    unity: { x: 0, y: 0 },

    "data-mgmt": { x: -420, y: -200 },
    "azure-web": { x: -620, y: -300 },
    "azure-db": { x: -820, y: -300 },
    "azure-blob": { x: -620, y: -180 },
    "aws-web": { x: -620, y: -420 },
    "aws-db": { x: -820, y: -420 },
    "aws-s3": { x: -620, y: -60 },

    "src-code": { x: -420, y: 180 },
    "gh-desktop": { x: -620, y: 80 },
    github: { x: -820, y: 80 },
    "back-up": { x: -620, y: 260 },
    "vtm-nas": { x: -820, y: 260 },
    "smart-svn": { x: -620, y: 400 },
    svn: { x: -820, y: 400 },

    platforms: { x: 380, y: -80 },
    android: { x: 560, y: -260 },
    hardware: { x: 720, y: -380 },
    "meta-quest": { x: 880, y: -520 },
    pico: { x: 880, y: -380 },
    htc: { x: 880, y: -240 },
    "api-std": { x: 720, y: -140 },
    openxr: { x: 1080, y: -380 },
    windows: { x: 560, y: 40 },
    application: { x: 760, y: -20 },
    pcvr: { x: 760, y: 100 },
    ios: { x: 560, y: 220 },

    factory: { x: 0, y: -260 },
    "sf-library": { x: -260, y: -400 },
    "design-lib": { x: -400, y: -620 },
    "function-lib": { x: -260, y: -540 },
    "ui-lib": { x: -120, y: -620 },
    "sf-standard": { x: 0, y: -400 },
    tsa: { x: -60, y: -540 },
    reds: { x: 80, y: -620 },
    "sf-template": { x: 260, y: -400 },
    ctp: { x: 180, y: -540 },
    pmtp: { x: 340, y: -620 },

    ai: { x: -80, y: 420 },
    "ai-tools": { x: -280, y: 560 },
    cursor: { x: -420, y: 700 },
    genspark: { x: -280, y: 700 },
    minimax: { x: -140, y: 700 },
    "ai-api": { x: 80, y: 560 },
    deepseek: { x: 20, y: 700 },
    doubao: { x: 180, y: 700 },

    /* 6. 3rd Party：三欄，子節點扇形散開（不成直線） */
    "third-party": { x: 560, y: 360 },
    "tp-plugin": { x: 280, y: 520 },
    opencv: { x: 280, y: 700 },
    "tp-sdk": { x: 560, y: 520 },
    "omni-one-sdk": { x: 420, y: 680 },
    "lcc-unity": { x: 560, y: 820 },
    votanic: { x: 700, y: 680 },
    "tp-hardware": { x: 920, y: 520 },
    "omni-one": { x: 820, y: 680 },
    "portal-cam": { x: 920, y: 820 },
    webcam: { x: 1040, y: 680 },
  };

  function buildDevEnvNodes() {
    const hubLabelPos = {
      unity: "bottom",
      "data-mgmt": "top",
      "src-code": "top",
      platforms: "top",
      factory: "bottom",
      "sf-library": "top",
      "sf-standard": "top",
      "sf-template": "top",
      ai: "top",
      "third-party": "top",
      "back-up": "bottom",
      "ai-tools": "top",
      "ai-api": "top",
      "tp-plugin": "top",
      "tp-sdk": "top",
      "tp-hardware": "top",
    };

    return DEV_ENV_GRAPH.nodes.map((node) => {
      const pos = DEV_ENV_LAYOUT[node.id] || { x: 0, y: 0 };
      const isHub = node.category <= 1;

      return {
        ...node,
        x: pos.x,
        y: pos.y,
        fixed: true,
        label: {
          show: true,
          position: isHub ? hubLabelPos[node.id] || "top" : "bottom",
          distance: isHub ? 12 : 6,
          fontSize: node.category === 0 ? 14 : node.category === 1 ? 12 : 10,
          color: node.category === 3 ? "#999999" : "#333333",
          fontWeight: node.category === 0 ? 700 : node.category === 1 ? 600 : 400,
          fontFamily: DEV_ENV_LABEL_FONT,
        },
      };
    });
  }

  function buildDevEnvAdjacency() {
    const adj = new Map();
    DEV_ENV_GRAPH.nodes.forEach((node) => adj.set(node.id, []));
    DEV_ENV_GRAPH.links.forEach((link) => {
      adj.get(link.source)?.push(link.target);
      adj.get(link.target)?.push(link.source);
    });
    return adj;
  }

  function findDevEnvPathToUnity(startId) {
    if (startId === "unity") return ["unity"];

    const adj = buildDevEnvAdjacency();
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      for (const next of adj.get(last) || []) {
        if (visited.has(next)) continue;
        const nextPath = path.concat(next);
        if (next === "unity") return nextPath;
        visited.add(next);
        queue.push(nextPath);
      }
    }

    return [startId];
  }

  function devEnvEdgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function collectDevEnvPathNodes(startIds) {
    const nodeSet = new Set();
    startIds.forEach((id) => {
      findDevEnvPathToUnity(id).forEach((nodeId) => nodeSet.add(nodeId));
    });
    return nodeSet;
  }

  function applyDevEnvPathHighlight(chart, selectedNodeIds) {
    const nodeSet = selectedNodeIds?.size
      ? selectedNodeIds
      : null;
    const edgeSet = new Set();

    if (nodeSet) {
      const ordered = Array.from(nodeSet);
      ordered.forEach((id) => {
        const path = findDevEnvPathToUnity(id);
        for (let i = 0; i < path.length - 1; i += 1) {
          edgeSet.add(devEnvEdgeKey(path[i], path[i + 1]));
        }
      });
      // Also keep edges between selected nodes that sit on any path to Unity
      DEV_ENV_GRAPH.links.forEach((link) => {
        if (nodeSet.has(link.source) && nodeSet.has(link.target)) {
          edgeSet.add(devEnvEdgeKey(link.source, link.target));
        }
      });
    }

    const data = buildDevEnvNodes().map((node) => {
      const onPath = !nodeSet || nodeSet.has(node.id);
      return {
        ...node,
        itemStyle: {
          ...(node.itemStyle || {}),
          opacity: onPath ? 1 : 0.12,
          borderWidth: onPath && nodeSet && node.id === "unity" ? 3 : node.itemStyle?.borderWidth,
        },
        label: {
          ...node.label,
          opacity: onPath ? 1 : 0.18,
          fontWeight: onPath && nodeSet ? 700 : node.label.fontWeight,
          color: onPath && nodeSet && node.id === "unity" ? "#c45c7a" : node.label.color,
        },
      };
    });

    const links = DEV_ENV_GRAPH.links.map((link) => {
      const onPath =
        !nodeSet || edgeSet.has(devEnvEdgeKey(link.source, link.target));
      const base = link.lineStyle || {};
      return {
        ...link,
        lineStyle: {
          ...base,
          opacity: onPath ? (nodeSet ? 1 : base.opacity ?? 0.85) : 0.05,
          width: onPath && nodeSet ? 2.75 : base.width || 1.25,
          color: onPath && nodeSet ? "#e5a84a" : base.color || "#c0c0c0",
        },
      };
    });

    chart.setOption({ series: [{ data, links }] }, { replaceMerge: [] });
  }

  function getDevEnvChartOption() {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter(params) {
          if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}`;
          }
          return params.name;
        },
        textStyle: { fontFamily: DEV_ENV_LABEL_FONT },
      },
      series: [
        {
          type: "graph",
          layout: "none",
          data: buildDevEnvNodes(),
          links: DEV_ENV_GRAPH.links,
          categories: DEV_ENV_GRAPH.categories,
          roam: true,
          draggable: false,
          focusNodeAdjacency: false,
          scaleLimit: { min: 0.3, max: 2.5 },
          edgeSymbol: ["none", "none"],
          lineStyle: {
            color: "#c0c0c0",
            width: 1.25,
            curveness: 0,
            opacity: 0.85,
          },
          label: {
            show: true,
            fontFamily: DEV_ENV_LABEL_FONT,
          },
          emphasis: {
            disabled: true,
          },
          animation: false,
        },
      ],
    };
  }

  function disposeDevEnvChart(mount) {
    if (mount._devEnvChartResize) {
      window.removeEventListener("resize", mount._devEnvChartResize);
      mount._devEnvChartResize = null;
    }
    if (mount._devEnvChartInstance) {
      mount._devEnvChartInstance.dispose();
      mount._devEnvChartInstance = null;
    }
    mount._devEnvSelected = null;
  }

  async function initDevEnvChart(root) {
    const mount = root.querySelector("#dev-env-chart-mount");
    if (!mount) return;

    disposeDevEnvChart(mount);
    mount.innerHTML = "";

    try {
      const echarts = await loadEchartsScript();
      const chart = echarts.init(mount, null, { renderer: "svg" });
      mount._devEnvChartInstance = chart;
      chart.setOption(getDevEnvChartOption());

      const clearSelection = () => {
        mount._devEnvSelected = null;
        applyDevEnvPathHighlight(chart, null);
      };

      chart.on("click", (params) => {
        if (params.dataType === "node") {
          const nodeId = params.data.id;
          const pathNodes = collectDevEnvPathNodes([nodeId]);
          mount._devEnvSelected = nodeId;
          applyDevEnvPathHighlight(chart, pathNodes);
          return;
        }

        if (params.dataType === "edge") {
          const { source, target } = params.data;
          const pathNodes = collectDevEnvPathNodes([source, target]);
          mount._devEnvSelected = `${source}|${target}`;
          applyDevEnvPathHighlight(chart, pathNodes);
          return;
        }

        clearSelection();
      });

      chart.getZr().on("click", (event) => {
        if (!event.target) {
          clearSelection();
        }
      });

      const resize = () => chart.resize();
      mount._devEnvChartResize = resize;
      window.addEventListener("resize", resize);
    } catch (error) {
      mount.innerHTML = `<p class="error-state">開發組環境圖載入失敗：${error.message}</p>`;
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
    const existingOrgMount = mainEl.querySelector("#org-chart-mount");
    if (existingOrgMount) {
      disposeOrgChart(existingOrgMount);
    }

    const existingDevMount = mainEl.querySelector("#dev-env-chart-mount");
    if (existingDevMount) {
      disposeDevEnvChart(existingDevMount);
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

    applySectionGroupLabel(sectionId, mainEl);

    await loadEmbeddedExamples(mainEl);
    await initOrgChart(mainEl);
    await initDevEnvChart(mainEl);
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
      hash === "phase-pp" ||
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
