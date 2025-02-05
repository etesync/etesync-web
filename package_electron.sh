mkdir build-electron
echo "/*" > build-electron/.gitignore

cp -r build/* build-electron/

cd build-electron

cat <<EOF > package.json
{
  "name": "etesync-electron",
  "homepage": "https://www.etesync.com/",
  "description": "EteSync - Encrypt Everything",
  "version": "0.6.0",
  "main": "main.js",
  "devDependencies": {
    "electron": "^13.1.9",
    "electron-builder": "^22.11.7",
    "electron-packager": "^15.3.0"
  },
  "scripts": {
    "postinstall": "./node_modules/.bin/electron-builder install-app-deps",
    "start": "./node_modules/.bin/electron .",
    "build": "./node_modules/.bin/electron-builder build",
    "build-mac": "./node_modules/.bin/electron-builder build --mac",
    "build-win": "./node_modules/.bin/electron-builder build --win",
    "build-linux": "./node_modules/.bin/electron-builder build --linux"
  },
  "build": {
    "appId": "com.etesync.electron",
    "productName": "EteSync Electron",
    "mac": {
      "icon": "icon512.png"
    },
    "dmg": {},
    "mas": {},
    "win": {
      "icon": "icon512.png",
      "publisherName": "EteSync Ltd"
    },
    "appx": {},
    "portable": {},
    "linux": {}
  },
  "files": [
    "static/**/*",
    "!**/node_modules/*",
    "!**/dist/*",
    "!**/src/*",
    "asset-manifest.json",
    "favicon.ico",
    "index.html",
    "manifest.json",
    "precache-manifest.*.js",
    "service-worker.js"
  ]
}
EOF

cat <<'EOF' > main.js
const { app, BrowserWindow, Menu, globalShortcut, protocol } = require('electron');
const path = require('path');
Menu.setApplicationMenu(null);
app.on('ready', () => {
  protocol.interceptFileProtocol('http', (request, callback) => {
    var url = request.url.substr('http://127.0.0.1/'.length)
    const rmparam = new RegExp("\\?([a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+[&]{0,1})+");
    url = url.replace(rmparam, '')
    if( url === 'pim/events' ) url = 'index.html'
    callback({path: path.normalize(`${__dirname}/${url}`)})
  })
  let mainWindow = new BrowserWindow({
    frame: true, resizable: true, transparent: false,
    width: 1600, height: 900,
    webPreferences: { nodeIntegration: true }
  });
  mainWindow.center();
  mainWindow.setMenu(null);
  mainWindow.setFullScreen(false);
  mainWindow.loadURL('http://127.0.0.1/pim/events')
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // mainWindow.webContents.openDevTools()
})
EOF

yarn install
yarn build-linux

echo "You can now try to run ./build-electron/dist/EteSync\ Electron-0.6.0.AppImage"
echo "If you get an empty window and a console message like:"
echo "Failed to load URL: http://127.0.0.1/pim/events with error: ERR_FILE_NOT_FOUND"
echo "then make sure you successfully ran yarn build before running this script."
echo "And feel free to delete ./build-electron. It will get re-generated when you re-run this script."
