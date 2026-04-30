/**
 * Google Apps Script for exporting a Google Drive folder tree as JSON.
 *
 * Usage:
 * 1) Create a new Apps Script project.
 * 2) Paste this file content into Code.gs.
 * 3) Deploy as Web App (Execute as: Me, Who has access: Anyone).
 */
const ROOT_FOLDER_ID = "1onVR2v7-_WzvPypCS8r8NX8wMphymSpb";

function doGet() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const data = buildFolderNode(root, true);

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function buildFolderNode(folder, isRoot) {
  const node = {
    title: folder.getName(),
    type: "folder",
    url: folder.getUrl(),
    category: isRoot ? "根目录" : getCategoryFromPath(folder),
    updatedAt: toDateString(folder.getLastUpdated()),
    children: []
  };

  const childFolders = folder.getFolders();
  while (childFolders.hasNext()) {
    const subFolder = childFolders.next();
    node.children.push(buildFolderNode(subFolder, false));
  }

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() !== MimeType.PDF) continue;

    node.children.push({
      title: file.getName(),
      type: "file",
      url: file.getUrl(),
      category: getCategoryFromPath(folder),
      updatedAt: toDateString(file.getLastUpdated()),
      children: []
    });
  }

  // Keep only folders and PDF files. Remove empty folders to avoid visual noise.
  node.children = node.children.filter((child) => {
    if (child.type === "file") return true;
    return child.children && child.children.length > 0;
  });

  return node;
}

function getCategoryFromPath(folder) {
  const names = [];
  let current = folder;
  while (current && current.getId() !== ROOT_FOLDER_ID) {
    names.push(current.getName());
    const parents = current.getParents();
    current = parents.hasNext() ? parents.next() : null;
  }

  if (names.length === 0) return "未分类";
  return names[names.length - 1];
}

function toDateString(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
