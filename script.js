const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1onVR2v7-_WzvPypCS8r8NX8wMphymSpb?usp=drive_link";
const DRIVE_INDEX_PATH = "data/drive-index.json";

const fallbackTree = {
  title: "全部资料",
  type: "folder",
  url: DRIVE_FOLDER_URL,
  updatedAt: "",
  children: []
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

function normalizeNode(node) {
  const type = node?.type === "file" ? "file" : "folder";
  const normalized = {
    title: node?.title || "未命名",
    type,
    url: node?.url || DRIVE_FOLDER_URL,
    updatedAt: node?.updatedAt || ""
  };

  if (type === "folder") {
    normalized.children = Array.isArray(node?.children)
      ? node.children.map((child) => normalizeNode(child))
      : [];
  }

  return normalized;
}

function normalizeRootTree(rawTree) {
  const normalized = normalizeNode(rawTree);
  if (normalized.type !== "folder") return { ...fallbackTree };
  normalized.title = "全部资料";
  if (!Array.isArray(normalized.children)) normalized.children = [];
  return normalized;
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
  listFolders(rootTree).forEach(({ node, path }) => {
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
    button.textContent = node.title;
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
  viewTitle.textContent = currentFolder.title;
  const children = sortChildren(currentFolder.children || []);
  resultCount.textContent = `共 ${children.length} 项`;
  contentList.innerHTML = "";

  if (rootTree.children.length === 0 && currentFolder === rootTree) {
    contentList.innerHTML = '<div class="row"><span class="muted">目录尚未同步。</span></div>';
    return;
  }

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
    action.textContent = "打开";

    row.append(nameCell, typeCell, updatedCell, action);
    contentList.appendChild(row);
  });
}

function searchTree(keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return [];

  const results = [];
  function walk(node, path) {
    const currentPathNodes = [...path, node];
    if (node !== rootTree && node.title.toLowerCase().includes(normalizedKeyword)) {
      results.push({ node, path: currentPathNodes });
    }
    (node.children || []).forEach((child) => walk(child, currentPathNodes));
  }

  walk(rootTree, []);
  return results;
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
    pathNode.textContent = path.slice(1, -1).map((item) => item.title).join(" / ") || "-";

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
  if (activeSearch) {
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
    rootTree = normalizeRootTree(data);
  } catch (error) {
    console.warn("读取 drive-index.json 失败，使用空目录 fallbackTree", error);
    rootTree = { ...fallbackTree, children: [] };
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
