
const {app, BrowserWindow, Tray, Menu} = require('electron');
const fs = require('fs')
const path = require('path')

let mainWindow = null;
require('electron-reload')(__dirname)
app.on('ready', function() {

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      autoHideMenuBar: true,
    });

    mainWindow.loadFile( "http://localhost:8080")

  
  });

  app.on('window-all-closed', function() {
      app.quit();
  })
