const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const devServerUrl = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: '几何探索实验室',
    backgroundColor: '#08060d',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Keep the renderer inside the packaged application. The current web UI may
  // contain ordinary links, but it never needs them to start or render offline.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
