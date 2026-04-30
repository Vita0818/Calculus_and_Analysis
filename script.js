const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1onVR2v7-_WzvPypCS8r8NX8wMphymSpb?usp=drive_link";

const DRIVE_INDEX_PATH = "data/drive-index.json";

const categories = [
  "全部",
  "课程笔记",
  "历年真题",
  "微积分研讨班",
  "高等数学竞赛",
  "其他资料"
];

const fallbackData = [
  {
    title: "MATH1135G-微积分（甲）I 课程笔记",
    category: "课程笔记",
    description: "课堂笔记、重点整理与阶段复习资料，持续更新。",
    status: "更新中",
    url: "https://drive.google.com/drive/folders/1Qs_FlwJ5Ngf6Zs_RW20VCpC5OGkBW8Be?usp=drive_link",
    updatedAt: "2026-04-30"
  },
  {
    title: "MATH1135G-微积分（甲）I 历年真题",
    category: "历年真题",
    description: "微积分（甲）相关历年试题与复习资料。",
    status: "已上传",
    url: "https://drive.google.com/drive/folders/1NVZ7tLd_ot-tXv2bRvLUI4rpunx0rZ03?usp=drive_link",
    updatedAt: "2026-04-28"
  },
  {
    title: "25秋冬微积分研讨班题目",
    category: "微积分研讨班",
    description: "研讨班题目、讨论材料与问题汇总。",
    status: "更新中",
    url: "https://drive.google.com/drive/folders/1adRcmbelXbUOYfcwv87aWdag2qKqYRY7?usp=drive_link",
    updatedAt: "2026-04-29"
  },
  {
    title: "一元微积分核心性质梳理",
    category: "其他资料",
    description: "一元微积分中常用性质、定理与证明思路整理。",
    status: "制作中",
    url: DRIVE_FOLDER_URL,
    updatedAt: "2026-04-27"
  },
  {
    title: "历年浙江省高等数学竞赛真题",
    category: "高等数学竞赛",
    description: "浙江省高等数学竞赛相关真题、训练资料与整理。",
    status: "制作中",
    url: DRIVE_FOLDER_URL,
    updatedAt: "2026-04-26"
  }
];

let notes = fallbackData.slice();
let currentCategory = "全部";
let currentKeyword = "";

const notesContainer = document.getElementById("notesContainer");
const recentUpdates = document.getElementById("recentUpdates");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const sidebarCategories = document.getElementById("sidebarCategories");
const resultCount = document.getElementById("resultCount");

function createCategoryButton(name, onClick) {
  const btn = document.createElement("button");
  btn.className = "category-btn";
  btn.textContent = name;
  btn.addEventListener("click", () => onClick(name));
  return btn;
}

function matchesFilters(note) {
  const inCategory = currentCategory === "全部" || note.category === currentCategory;
  const keyword = currentKeyword.trim().toLowerCase();
  const pathText = (note.path || []).join(" ").toLowerCase();
  const inKeyword =
    !keyword ||
    note.title.toLowerCase().includes(keyword) ||
    note.category.toLowerCase().includes(keyword) ||
    pathText.includes(keyword) ||
    note.description.toLowerCase().includes(keyword);
  return inCategory && inKeyword;
}

function getActiveCategories() {
  const dynamicCategories = [...new Set(notes.map((note) => note.category))];
  return ["全部", ...dynamicCategories];
}

function renderCategories() {
  filterButtons.innerHTML = "";
  sidebarCategories.innerHTML = "";

  getActiveCategories().forEach((name) => {
    const clickHandler = (selected) => {
      currentCategory = selected;
      renderAll();
    };

    const topBtn = createCategoryButton(name, clickHandler);
    const sideBtn = createCategoryButton(name, clickHandler);

    if (name === currentCategory) {
      topBtn.classList.add("active");
      sideBtn.classList.add("active");
    }

    filterButtons.appendChild(topBtn);
    sidebarCategories.appendChild(sideBtn);
  });
}

function renderNotes() {
  notesContainer.innerHTML = "";
  const filtered = notes.filter(matchesFilters);

  resultCount.textContent = `共 ${filtered.length} 条资料`;

  if (filtered.length === 0) {
    notesContainer.innerHTML = "<p class='muted'>没有匹配的资料，请更换关键词或分类。</p>";
    return;
  }

  const grouped = new Map();
  filtered.forEach((note) => {
    const level1 = note.path?.[0] || note.category || "其他资料";
    const level2 = note.path?.[1] || "未分组";
    if (!grouped.has(level1)) grouped.set(level1, new Map());
    const level2Map = grouped.get(level1);
    if (!level2Map.has(level2)) level2Map.set(level2, []);
    level2Map.get(level2).push(note);
  });

  grouped.forEach((level2Map, level1) => {
    const group1Title = document.createElement("h3");
    group1Title.className = "group-title";
    group1Title.textContent = level1;
    notesContainer.appendChild(group1Title);

    level2Map.forEach((items, level2) => {
      const group2Title = document.createElement("h4");
      group2Title.className = "subgroup-title";
      group2Title.textContent = level2;
      notesContainer.appendChild(group2Title);

      items.forEach((note) => {
        const article = document.createElement("article");
        article.className = "note-item";
        article.innerHTML = `
          <h4>${note.title}</h4>
          <p class="meta">分类：${note.category}</p>
          <p class="meta">路径：${(note.path || []).join(" / ") || "未提供"}</p>
          <p class="desc">${note.description}</p>
          <span class="tag">${note.status}</span>
          <p class="meta">更新：${note.updatedAt}</p>
          <a class="btn" href="${note.url}" target="_blank" rel="noopener noreferrer">打开资料</a>
        `;
        notesContainer.appendChild(article);
      });
    });
  });
}

function renderRecentUpdates() {
  recentUpdates.innerHTML = "";
  notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)
    .forEach((item) => {
      const li = document.createElement("li");
      const pathText = (item.path || []).join(" / ");
      li.innerHTML = `<strong>${item.updatedAt}</strong> · ${item.title}${pathText ? `（${pathText}）` : ""}`;
      recentUpdates.appendChild(li);
    });
}

function renderAll() {
  renderCategories();
  renderNotes();
  renderRecentUpdates();
}

function normalizeDriveTree(rootNode) {
  const normalized = [];

  function walk(node, path) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, path));
      return;
    }

    const nodeType =
      node.type ||
      (Array.isArray(node.children) ? "folder" : node.url ? "file" : "");

    if (!nodeType) return;

    if (nodeType === "folder") {
      const nextPath = path.concat(node.title || "未命名文件夹");
      (node.children || []).forEach((child) => walk(child, nextPath));
      return;
    }

    if (nodeType === "file") {
      const category = node.category || path[0] || "其他资料";
      normalized.push({
        title: node.title || "未命名 PDF",
        category,
        description: `来源：${path.join(" / ")}`,
        status: "自动同步",
        url: node.url || DRIVE_FOLDER_URL,
        updatedAt: node.updatedAt || "1970-01-01",
        path: path.slice()
      });
    }
  }

  if (rootNode?.children) {
    walk(rootNode.children, []);
  } else {
    walk(rootNode, []);
  }
  return normalized;
}

async function loadNotesData() {
  if (!DRIVE_INDEX_PATH.trim()) {
    notes = fallbackData.slice();
    return;
  }

  try {
    const response = await fetch(DRIVE_INDEX_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const driveNotes = normalizeDriveTree(data);
    notes = driveNotes.length > 0 ? driveNotes : fallbackData.slice();
  } catch (error) {
    console.warn("读取静态缓存目录失败，使用备用目录：", error);
    notes = fallbackData.slice();
  }
}

searchInput.addEventListener("input", (event) => {
  currentKeyword = event.target.value;
  renderNotes();
});

loadNotesData().finally(() => {
  if (!getActiveCategories().includes(currentCategory)) {
    currentCategory = "全部";
  }
  renderAll();
});
