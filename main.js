const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// Create recordings folder in the app directory
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools to see errors
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle transcription request from renderer
ipcMain.handle('transcribe-audio', async (event, audioBuffer) => {
  return new Promise((resolve, reject) => {
    // Save audio buffer to recordings folder (so you can see it)
    const timestamp = Date.now();
    const audioPath = path.join(recordingsDir, `recording_${timestamp}.webm`);
    
    console.log('Saving audio to:', audioPath);
    
    try {
      // Convert ArrayBuffer to Buffer and save
      const buffer = Buffer.from(audioBuffer);
      fs.writeFileSync(audioPath, buffer);
      console.log('Audio saved, size:', buffer.length, 'bytes');
      
      // Run Whisper transcription
      const whisperPath = 'C:\\Users\\likhi\\AppData\\Local\\Packages\\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\\LocalCache\\local-packages\\Python311\\Scripts\\whisper.exe';
      
      console.log('Starting Whisper with path:', whisperPath);
      
      const whisperProcess = spawn(whisperPath, [
        audioPath,
        '--model', 'tiny',
        '--output_format', 'txt',
        '--output_dir', recordingsDir,
        '--language', 'en'
      ]);

      let stdout = '';
      let stderr = '';

      whisperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Whisper stdout:', data.toString());
      });

      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('Whisper stderr:', data.toString());
      });

      whisperProcess.on('close', (code) => {
        console.log('Whisper process closed with code:', code);
        
        // Read the transcription result
        const outputPath = audioPath.replace('.webm', '.txt');
        console.log('Looking for output at:', outputPath);
        
        if (fs.existsSync(outputPath)) {
          const transcription = fs.readFileSync(outputPath, 'utf-8').trim();
          console.log('Transcription:', transcription);
          resolve({ success: true, text: transcription });
        } else {
          console.log('Output file not found. Stderr:', stderr);
          resolve({ success: false, error: `Transcription failed. Whisper output: ${stderr}` });
        }
      });

      whisperProcess.on('error', (error) => {
        console.error('Whisper process error:', error);
        resolve({ success: false, error: `Failed to start Whisper: ${error.message}` });
      });

    } catch (error) {
      console.error('Error in transcribe-audio:', error);
      resolve({ success: false, error: error.message });
    }
  });
});
