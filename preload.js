window.Store = require("electron-store");
window.path = require("path");
window.fs = require("fs");
window.store = new Store();
window.comicDir = store.get("comicDir");
window.pwd = store.get("pwd");
window.fileFormats = [".cbr", ".rar", ".cbz", ".zip", ".pdf"];

const { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;

window.addEventListener("load", () => {
	window.$ = window.jQuery = require("jquery");
});
