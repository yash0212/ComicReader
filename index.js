const { app, BrowserWindow, ipcMain } = require("electron");
const Store = require("electron-store");
const store = new Store();

const isMac = process.platform === "darwin";
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });

  var comicDir = store.get("comicDir");
  if (comicDir === undefined || comicDir === "") {
    win.loadFile("index.html");
  } else {
    win.loadFile("comicdir.html");
  }
  //   win.webContents.openDevTools();

  win.on("ready-to-show", () => {
    win.show();
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
