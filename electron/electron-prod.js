
const {app, BrowserWindow, Tray, Menu} = require('electron');

let mainWindow = null;

app.on('ready', function() {

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      autoHideMenuBar: true,
    });

    mainWindow.loadURL(`file://${__dirname}/dist/index.html`)
  
  });

  app.on('window-all-closed', function() {
      app.quit();
  })
