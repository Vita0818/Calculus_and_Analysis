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
let nodeMap = new Map();

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
  const normalized = safeNode(node);
  if (normalized.type === "file") return normalized;

  normalized.children = (normalized.children || [])
    .map((child) => normalizeTree(child))
    .filter(Boolean);
  return normalized;
}

function buildVisibleRoot(rawRoot) {
  const normalizedRoot = normalizeTree(rawRoot);
  if (!normalizedRoot) return safeNode(fallbackTree);
  return {
    title: "全部资料",
    type: "folder",
    url: normalizedRoot.url || DRIVE_FOLDER_URL,
    updatedAt: normalizedRoot.updatedAt || "",
    children: normalizedRoot.children || []
  };
}

function buildRuntimeTree(node, parent = null, parentPath = [], parentPathKey = "") {
  const currentPath = [...parentPath, node.title];
  const currentPathKey = parent ? `${parentPathKey}/${node.title}` : "";

  node.parent = parent;
  node.path = currentPath;
  node.pathKey = currentPathKey;
  node.depth = parent ? parent.depth + 1 : 0;

  nodeMap.set(node.pathKey, node);

  if (node.type === "folder") {
    node.children = (node.children || []).map((child) => buildRuntimeTree(child, node, currentPath, currentPathKey));
  }

  return node;
}

function buildPathFromNode(node) {
  const path = [];
  let cursor = node;
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parent || null;
  }
  return path;
}

function listFolders(node, acc = []) {
  acc.push(node);
  (node.children || []).forEach((child) => {
    if (child.type === "folder") listFolders(child, acc);
  });
  return acc;
}

function setCurrentFolderByPathKey(pathKey) {
  const target = nodeMap.get(pathKey);
  if (!target || target.type !== "folder") return;
  currentFolder = target;
  currentPath = buildPathFromNode(target);
  render();
}

function renderFolderTree() {
  folderTree.innerHTML = "";
  const folders = listFolders(rootTree);
  folders.forEach((node) => {
    const item = document.createElement("div");
    item.className = "tree-item";
    item.style.paddingLeft = `${node.depth * 14 + 6}px`;
    item.textContent = `📁 ${node.title}`;
    if (node.pathKey === currentFolder.pathKey) item.classList.add("active");
    item.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
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
    button.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
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
  console.log("Current folder selected:", {
    title: currentFolder.title,
    pathKey: currentFolder.pathKey,
    childrenCount: currentFolder.children?.length,
    children: currentFolder.children
  });

  const folderChildren = currentFolder.children || [];
  resultCount.textContent = `共 ${folderChildren.length} 项`;

  contentList.innerHTML = "";
  if (folderChildren.length === 0) {
    const emptyMessage =
      currentFolder === rootTree
        ? "目录尚未同步。请先运行 GitHub Actions 更新 Google Drive 目录。"
        : "该文件夹为空。";
    contentList.innerHTML = `<div class="row"><span class="muted">${emptyMessage}</span></div>`;
    return;
  }

  const children = sortChildren(folderChildren);
  children.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    const nameCell = document.createElement(item.type === "folder" ? "button" : "span");
    nameCell.className = item.type === "folder" ? "name-btn" : "";
    nameCell.textContent = `${item.type === "folder" ? "📁" : "📄"} ${item.title}`;
    if (item.type === "folder") {
      nameCell.type = "button";
      nameCell.addEventListener("click", () => setCurrentFolderByPathKey(item.pathKey));
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
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  function walk(node) {
    const isMatch = node.title.toLowerCase().includes(normalized) && (node.type === "folder" || node.type === "file");
    if (isMatch) {
      results.push({ node, path: buildPathFromNode(node) });
    }
    (node.children || []).forEach((child) => walk(child));
  }
  walk(rootTree);
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
        setCurrentFolderByPathKey(node.pathKey);
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
    rootTree = buildVisibleRoot(data);
  } catch (error) {
    console.warn("读取 drive-index.json 失败，使用 fallbackTree", error);
    rootTree = safeNode(fallbackTree);
  }

  nodeMap = new Map();
  rootTree = buildRuntimeTree(rootTree);

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
  if (!currentFolder.parent) return;
  setCurrentFolderByPathKey(currentFolder.parent.pathKey);
});

loadTree();
