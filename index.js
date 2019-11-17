const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const Store = require("electron-store");
const store = new Store();
var $ = require("jquery");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const unrar = require("electron-unrar-js");
const Uint8ToString = require("./Uint8ToString.js");
const { fork } = require("child_process");

const imageFormats = [".jpg", ".png", ".webp"];
const isMac = process.platform === "darwin";
let win;

function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			// nodeIntegration: true
			preload: path.join(__dirname, "preload.js")
		},
		show: false
	});

	var comicDir = store.get("comicDir");
	if (comicDir === undefined || comicDir === "") {
		win.loadFile("index.html");
	} else {
		store.set("pwd", comicDir);
		win.loadFile("comicdir.html");
	}
	win.webContents.openDevTools();

	win.on("ready-to-show", () => {
		win.show();
		win.maximize();
	});
	win.on("closed", function() {
		win = null;
	});
}

ipcMain.on("index", (e, data) => {
	if (data.msg == "dirSet") {
		win.loadFile("comicdir.html");
	}
});

ipcMain.on("thumbnailGenerator", (e, comics) => {
	thumbnailQueue = [...comics];
	let thumbnailFork = fork("./fileThumbnail.js");

	thumbnailFork.on("message", data => {
		imgData = data.imgData;
		id = data.file.name;
		fileExt = data.imgExt.slice(1);

		if (store.get("pwd") === path.dirname(data.file.path)) {
			e.reply("thumbnailGenerator", {
				imgData: imgData,
				imgExt: fileExt,
				file: data.file
			});
			if (thumbnailQueue.length > 0) {
				thumbnailFork.send(thumbnailQueue.shift());
			} else {
				thumbnailFork.kill();
			}
		} else {
			thumbnailFork.kill();
		}
	});

	if (thumbnailQueue.length > 0) {
		thumbnailFork.send(thumbnailQueue.shift());
	}
});
const template = [
	{
		label: "Edit",
		submenu: [
			{
				label: "Change comic directory",
				click() {
					win.loadFile("index.html");
				}
			},
			{
				role: "undo"
			},
			{
				role: "redo"
			},
			{
				type: "separator"
			},
			{
				role: "cut"
			},
			{
				role: "copy"
			},
			{
				role: "paste"
			}
		]
	},

	{
		label: "View",
		submenu: [
			{
				role: "reload"
			},
			{
				role: "toggledevtools"
			},
			{
				type: "separator"
			},
			{
				role: "resetzoom"
			},
			{
				role: "zoomin"
			},
			{
				role: "zoomout"
			},
			{
				type: "separator"
			},
			{
				role: "togglefullscreen"
			}
		]
	},

	{
		role: "window",
		submenu: [
			{
				role: "minimize"
			},
			{
				role: "close"
			}
		]
	},

	{
		role: "help",
		submenu: [
			{
				label: "Learn More"
			}
		]
	}
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.on("ready", createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (win == null) {
		createWindow();
	}
});
