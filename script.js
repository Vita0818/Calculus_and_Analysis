const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1onVR2v7-_WzvPypCS8r8NX8wMphymSpb?usp=drive_link";
const DRIVE_INDEX_PATH = "data/drive-index.json";

const fallbackTree = {
  title: "root",
  type: "folder",
  url: DRIVE_FOLDER_URL,
  updatedAt: "2026-04-30",
  children: [
    {
      title: "MATH1135G-微积分（甲）",
      type: "folder",
      url: "https://drive.google.com/drive/folders/1Qs_FlwJ5Ngf6Zs_RW20VCpC5OGkBW8Be?usp=drive_link",
      updatedAt: "2026-04-30",
      children: [
        {
          title: "笔记",
          type: "folder",
          url: "https://drive.google.com/drive/folders/1example-note-folder",
          updatedAt: "2026-04-30",
          children: [
            {
              title: "第01讲 极限与连续.pdf",
              type: "file",
              url: "https://drive.google.com/file/d/1-example-note/view",
              updatedAt: "2026-04-30"
            }
          ]
        }
      ]
    }
  ]
};

let rootTree = fallbackTree;
let currentFolder = fallbackTree;
let currentPath = [fallbackTree];
let activeSearch = "";

const searchInput = document.getElementById("searchInput");
const backBtn = document.getElementById("backBtn");
const breadcrumb = document.getElementById("breadcrumb");
const folderTree = document.getElementById("folderTree");
const contentList = document.getElementById("contentList");
const viewTitle = document.getElementById("viewTitle");
const resultCount = document.getElementById("resultCount");
const openAllBtn = document.getElementById("openAllBtn");

function safeNode(node) {
  const title = node?.title || "未命名";
  const type = node?.type === "file" ? "file" : "folder";
  const children = type === "folder" ? (Array.isArray(node?.children) ? node.children : []) : undefined;
  return { title, type, url: node?.url || DRIVE_FOLDER_URL, updatedAt: node?.updatedAt || "-", children };
}

function normalizeTree(node) {
  const root = safeNode(node);
  if (root.type !== "folder") return safeNode(fallbackTree);
  root.children = root.children.map((child) => normalizeTree(child));
  return root;
}

function listFolders(node, path = [], acc = []) {
  const nextPath = [...path, node];
  acc.push({ node, path: nextPath });
  (node.children || []).forEach((child) => {
    if (child.type === "folder") listFolders(child, nextPath, acc);
  });
  return acc;
}

function setCurrentFolder(path) {
  currentPath = path;
  currentFolder = path[path.length - 1];
  render();
}

function renderFolderTree() {
  folderTree.innerHTML = "";
  const folders = listFolders(rootTree);
  folders.forEach(({ node, path }) => {
    const item = document.createElement("div");
    item.className = "tree-item";
    item.style.paddingLeft = `${(path.length - 1) * 14 + 6}px`;
    item.textContent = `📁 ${node.title}`;
    if (node === currentFolder) item.classList.add("active");
    item.addEventListener("click", () => setCurrentFolder(path));
    folderTree.appendChild(item);
  });
}

function renderBreadcrumb() {
  breadcrumb.innerHTML = "";
  currentPath.forEach((node, idx) => {
    if (idx > 0) breadcrumb.append(" / ");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = idx === 0 ? "全部资料" : node.title;
    button.addEventListener("click", () => setCurrentFolder(currentPath.slice(0, idx + 1)));
    breadcrumb.appendChild(button);
  });
}

function sortChildren(children) {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.title.localeCompare(b.title, "zh-Hans-CN");
  });
}

function renderFolderView() {
  viewTitle.textContent = currentFolder === rootTree ? "全部资料" : currentFolder.title;
  const children = sortChildren(currentFolder.children || []);
  resultCount.textContent = `共 ${children.length} 项`;

  contentList.innerHTML = "";
  if (children.length === 0) {
    contentList.innerHTML = '<div class="row"><span class="muted">该文件夹为空。</span></div>';
    return;
  }

  children.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    const nameCell = document.createElement(item.type === "folder" ? "button" : "span");
    nameCell.className = item.type === "folder" ? "name-btn" : "";
    nameCell.textContent = `${item.type === "folder" ? "📁" : "📄"} ${item.title}`;
    if (item.type === "folder") {
      nameCell.type = "button";
      nameCell.addEventListener("click", () => setCurrentFolder([...currentPath, item]));
    }

    const typeCell = document.createElement("span");
    typeCell.className = "type-pill";
    typeCell.textContent = item.type === "folder" ? "文件夹" : "PDF";

    const updatedCell = document.createElement("span");
    updatedCell.className = "muted";
    updatedCell.textContent = item.updatedAt || "-";

    const action = document.createElement("a");
    action.className = "btn ghost";
    action.href = item.url || DRIVE_FOLDER_URL;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = item.type === "folder" ? "打开" : "打开";

    row.append(nameCell, typeCell, updatedCell, action);
    contentList.appendChild(row);
  });
}

function searchTree(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  function walk(node, path) {
    const current = [...path, node];
    const isMatch = node.title.toLowerCase().includes(normalized) && (node.type === "folder" || node.type === "file");
    if (isMatch) {
      results.push({ node, path: current });
    }
    (node.children || []).forEach((child) => walk(child, current));
  }
  walk(rootTree, []);
  return results.filter((item) => item.node !== rootTree);
}

function renderSearchResults() {
  const results = searchTree(activeSearch);
  viewTitle.textContent = `搜索：${activeSearch}`;
  resultCount.textContent = `共 ${results.length} 项`;
  contentList.innerHTML = "";

  if (results.length === 0) {
    contentList.innerHTML = '<div class="row"><span class="muted">没有匹配结果。</span></div>';
    return;
  }

  results.forEach(({ node, path }) => {
    const row = document.createElement("div");
    row.className = "row";

    const name = document.createElement("span");
    name.textContent = `${node.type === "folder" ? "📁" : "📄"} ${node.title}`;

    const type = document.createElement("span");
    type.className = "type-pill";
    type.textContent = node.type === "folder" ? "文件夹" : "PDF";

    const pathNode = document.createElement("span");
    pathNode.className = "muted";
    pathNode.textContent = path.slice(1, -1).map((item) => item.title).join(" / ") || "全部资料";

    const action = document.createElement(node.type === "folder" ? "button" : "a");
    action.className = "btn ghost";
    if (node.type === "folder") {
      action.type = "button";
      action.textContent = "进入";
      action.addEventListener("click", () => {
        activeSearch = "";
        searchInput.value = "";
        setCurrentFolder(path);
      });
    } else {
      action.href = node.url || DRIVE_FOLDER_URL;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = "打开";
    }

    row.append(name, type, pathNode, action);
    contentList.appendChild(row);
  });
}

function render() {
  backBtn.disabled = currentPath.length <= 1;
  renderFolderTree();
  renderBreadcrumb();
  if (activeSearch.trim()) {
    renderSearchResults();
  } else {
    renderFolderView();
  }
}

async function loadTree() {
  try {
    const res = await fetch(DRIVE_INDEX_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rootTree = normalizeTree(data);
  } catch (error) {
    console.warn("读取 drive-index.json 失败，使用 fallbackTree", error);
    rootTree = normalizeTree(fallbackTree);
  }

  openAllBtn.href = rootTree.url || DRIVE_FOLDER_URL;
  currentFolder = rootTree;
  currentPath = [rootTree];
  render();
}

searchInput.addEventListener("input", (event) => {
  activeSearch = event.target.value.trim();
  render();
});

backBtn.addEventListener("click", () => {
  if (currentPath.length <= 1) return;
  setCurrentFolder(currentPath.slice(0, -1));
});

loadTree();
