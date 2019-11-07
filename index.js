const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const Store = require("electron-store");
const store = new Store();

const isMac = process.platform === "darwin";
let win;

function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: true
		},
		show: false
	});

	var comicDir = store.get("comicDir");
	if (comicDir === undefined || comicDir === "") {
		win.loadFile("index.html");
	} else {
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
