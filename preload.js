window.Store = require("electron-store");
window.path = require("path");
window.fs = require("fs");
window.nodeCrypto = require("crypto");
window.store = new Store();
window.comicDir = store.get("comicDir");
window.pwd = store.get("pwd");
window.fileFormats = [".cbr", ".rar", ".cbz", ".zip"];

const { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;

const { fork } = require("child_process");
window.fork = fork;

window.addEventListener("load", () => {
	window.$ = window.jQuery = require("jquery");
});
