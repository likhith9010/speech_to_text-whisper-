# Speech to Text - Whisper

A simple Electron desktop application that converts speech to text using OpenAI's Whisper model.

![App Screenshot](screenshot.png)

## Features

- 🎤 Record audio directly from your microphone
- 🤖 Transcribe speech using OpenAI Whisper (locally)
- 📋 Copy transcription to clipboard
- 🎨 Modern, beautiful UI
- 🔒 All processing done locally - your audio never leaves your computer

## Prerequisites

Before running this app, you need to install:

### 1. Node.js
Download and install from [nodejs.org](https://nodejs.org/)

### 2. Python 3.8+
Download and install from [python.org](https://www.python.org/)

### 3. FFmpeg
FFmpeg is required by Whisper for audio processing.

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or using Scoop
scoop install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 4. OpenAI Whisper
Install Whisper using pip:

```bash
pip install openai-whisper
```

Or with CUDA support for GPU acceleration:
```bash
pip install openai-whisper[cuda]
```

## Installation

1. Clone or download this repository

2. Navigate to the project directory:
```bash
cd speech_to_text(whisper)
```

3. Install Node.js dependencies:
```bash
npm install
```

## Usage

1. Start the application:
```bash
npm start
```

2. Click the **Start Recording** button and speak into your microphone

3. Click **Stop Recording** when finished

4. Wait for Whisper to transcribe your audio

5. Your transcription will appear in the text area

6. Use the **Copy** button to copy the text to your clipboard

## Whisper Models

By default, this app uses the `base` model. You can modify `main.js` to use different models:

| Model | Parameters | English-only | Multilingual | Required VRAM |
|-------|------------|--------------|--------------|---------------|
| tiny | 39 M | ✓ | ✓ | ~1 GB |
| base | 74 M | ✓ | ✓ | ~1 GB |
| small | 244 M | ✓ | ✓ | ~2 GB |
| medium | 769 M | ✓ | ✓ | ~5 GB |
| large | 1550 M | ✗ | ✓ | ~10 GB |

To change the model, edit the `--model` parameter in `main.js`:
```javascript
const whisperProcess = spawn('whisper', [
  tempAudioPath,
  '--model', 'small',  // Change this to: tiny, base, small, medium, or large
  '--output_format', 'txt',
  '--output_dir', tempDir,
  '--language', 'en'
]);
```

## Troubleshooting

### "Whisper not found" error
Make sure Whisper is installed and accessible from the command line:
```bash
whisper --help
```

### Microphone not working
- Make sure your browser/Electron has microphone permissions
- Check your system's microphone settings

### Slow transcription
- Use a smaller model (tiny or base)
- If you have an NVIDIA GPU, install CUDA support for faster processing

## Building for Distribution

To build the app for distribution:

```bash
npm run build
```

This will create distributable packages in the `dist` folder.

## License

MIT License

## Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - The speech recognition model
- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
