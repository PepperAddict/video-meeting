
const {app, BrowserWindow, Tray, Menu} = require('electron');
const fs = require('fs')

let mainWindow = null;
require('electron-reload')(__dirname + '../src/')
app.on('ready', function() {

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      autoHideMenuBar: true,
      useContentSize: true,
      resizable: false,
    });

    mainWindow.loadURL(`http://localhost:8080`)

    mainWindow.focus();
  
  });

  app.on('window-all-closed', function() {
      app.quit();
  })
