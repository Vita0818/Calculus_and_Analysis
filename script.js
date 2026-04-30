const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1onVR2v7-_WzvPypCS8r8NX8wMphymSpb?usp=drive_link";

const categories = [
  "全部",
  "课程笔记",
  "历年真题",
  "微积分研讨班",
  "高等数学竞赛",
  "其他资料"
];

/**
 * 资料条目统一在这里维护。
 * 你后续新增 PDF 时：
 * 1) 复制一个对象并修改 title/category/description/status/updatedAt。
 * 2) 把 url 替换成对应 PDF 的 Google Drive 单文件链接。
 * 3) category 请使用 categories 里的值，便于筛选。
 */
const notes = [
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
  const inKeyword =
    !keyword ||
    note.title.toLowerCase().includes(keyword) ||
    note.category.toLowerCase().includes(keyword) ||
    note.description.toLowerCase().includes(keyword);
  return inCategory && inKeyword;
}

function renderCategories() {
  filterButtons.innerHTML = "";
  sidebarCategories.innerHTML = "";

  categories.forEach((name) => {
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

  filtered.forEach((note) => {
    const article = document.createElement("article");
    article.className = "note-item";
    article.innerHTML = `
      <h4>${note.title}</h4>
      <p class="meta">分类：${note.category}</p>
      <p class="desc">${note.description}</p>
      <span class="tag">${note.status}</span>
      <p class="meta">更新：${note.updatedAt}</p>
      <a class="btn" href="${note.url}" target="_blank" rel="noopener noreferrer">打开资料</a>
    `;
    notesContainer.appendChild(article);
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
      li.innerHTML = `<strong>${item.updatedAt}</strong> · ${item.title}`;
      recentUpdates.appendChild(li);
    });
}

function renderAll() {
  renderCategories();
  renderNotes();
  renderRecentUpdates();
}

searchInput.addEventListener("input", (event) => {
  currentKeyword = event.target.value;
  renderNotes();
});

renderAll();
