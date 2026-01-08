// DOM Elements
const recordBtn = document.getElementById('recordBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const timerDisplay = document.getElementById('timer');
const statusDiv = document.getElementById('status');
const transcriptionArea = document.getElementById('transcription');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

// State
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let timerInterval = null;
let recordingSeconds = 0;

// Initialize
async function init() {
  try {
    // Request microphone permission early
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
    showStatus('Ready to record', 'info');
  } catch (error) {
    showStatus('Microphone access denied. Please allow microphone access.', 'error');
    recordBtn.disabled = true;
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Format time for display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Start timer
function startTimer() {
  recordingSeconds = 0;
  timerDisplay.textContent = '00:00';
  timerInterval = setInterval(() => {
    recordingSeconds++;
    timerDisplay.textContent = formatTime(recordingSeconds);
  }, 1000);
}

// Stop timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Start recording
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      } 
    });

    audioChunks = [];
    
    // Use WAV format for better compatibility with Whisper
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Process the recording
      await processRecording();
    };

    mediaRecorder.start(100); // Collect data every 100ms
    isRecording = true;
    
    // Update UI
    recordBtn.classList.add('recording');
    recordBtn.querySelector('.btn-text').textContent = 'Stop Recording';
    recordBtn.querySelector('.btn-icon').textContent = '⏹️';
    recordingIndicator.classList.remove('hidden');
    showStatus('Recording...', 'info');
    startTimer();

  } catch (error) {
    console.error('Error starting recording:', error);
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// Stop recording
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    stopTimer();
    
    // Update UI
    recordBtn.classList.remove('recording');
    recordBtn.classList.add('processing');
    recordBtn.querySelector('.btn-text').textContent = 'Processing...';
    recordBtn.querySelector('.btn-icon').textContent = '⏳';
    recordBtn.disabled = true;
    recordingIndicator.classList.add('hidden');
  }
}

// Process the recording
async function processRecording() {
  showStatus('Processing audio...', 'info');

  try {
    // Create blob from chunks
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    // Convert to ArrayBuffer and send directly (Whisper can handle webm via ffmpeg)
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    showStatus('Transcribing with Whisper...', 'info');
    
    // Send to main process for transcription
    const result = await window.electronAPI.transcribeAudio(arrayBuffer);
    
    if (result.success) {
      transcriptionArea.value = result.text;
      showStatus('Transcription complete!', 'success');
      copyBtn.disabled = false;
      clearBtn.disabled = false;
    } else {
      showStatus(result.error || 'Transcription failed', 'error');
    }

  } catch (error) {
    console.error('Processing error:', error);
    showStatus(`Error: ${error.message || error.error || 'Unknown error'}`, 'error');
  } finally {
    // Reset button
    recordBtn.classList.remove('processing');
    recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
    recordBtn.querySelector('.btn-icon').textContent = '🎤';
    recordBtn.disabled = false;
  }
}

// Copy transcription to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(transcriptionArea.value);
    showStatus('Copied to clipboard!', 'success');
  } catch (error) {
    showStatus('Failed to copy', 'error');
  }
}

// Clear transcription
function clearTranscription() {
  transcriptionArea.value = '';
  copyBtn.disabled = true;
  clearBtn.disabled = true;
  showStatus('Cleared', 'info');
}

// Event listeners
recordBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearTranscription);

// Initialize on load
init();
