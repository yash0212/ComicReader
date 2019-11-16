const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const Store = require("electron-store");
const store = new Store();
var $ = require("jquery");
const path = require("path");
const sharp = require("sharp");

const imageFormats = [".jpg", ".png", ".webp"];
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
	for (let file of comics) {
		if (
			path.extname(file.path) === ".cbz" ||
			path.extname(file.path) === ".zip"
		) {
			let imgFound = 0;
			fs.createReadStream(file.path)
				.pipe(unzipper.Parse())
				.on("entry", async function(entry) {
					const fileName = entry.path;
					const type = entry.type; // 'Directory' or 'File'
					let fileExt = path.extname(fileName);
					let obj;
					if (
						!imgFound &&
						type == "File" &&
						imageFormats.includes(fileExt)
					) {
						imgFound = 1;
						obj = await entry.buffer();
						imgData = obj.toString("base64");
						// process.send({
						// 	imgData: imgData,
						// 	imgExt: fileExt,
						// 	file: file
						// });
						e.reply("thumbnailGenerator", {
							imgData: imgData,
							imgExt: fileExt,
							file: file
						});
					} else {
						entry.autodrain();
					}
				});
		} else if (
			path.extname(file.path) === ".cbr" ||
			path.extname(file.path) === ".rar"
		) {
			// Read the archive file into a typedArray
			var buf = Uint8Array.from(fs.readFileSync(file.path)).buffer;
			var extractor = unrar.createExtractorFromData(buf);

			var fileList = extractor.getFileList();
			if (fileList[0].state === "SUCCESS") {
				let found = 0;
				var thumbnailFileName = fileList[1].fileHeaders
					.sort((a, b) =>
						a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0
					)
					.filter(x => {
						if (
							!found &&
							imageFormats.includes(path.extname(x.name))
						) {
							found = 1;
							return true;
						}
					})
					.map(x => x.name);

				var extracted = extractor.extractFiles([thumbnailFileName[0]]);

				if (extracted[0].state === "SUCCESS") {
					if (extracted[1].files[0].extract[0].state === "SUCCESS") {
						var imgData = extracted[1].files[0].extract[1];
						imgData = Uint8ToString(imgData);
						fileExt = path.extname(thumbnailFileName[0]);

						// process.send({
						// 	imgData: imgData,
						// 	imgExt: fileExt,
						// 	file: file
						// });
						e.reply("thumbnailGenerator", {
							imgData: imgData,
							imgExt: fileExt,
							file: file
						});
					}
				}
			}
		}
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
