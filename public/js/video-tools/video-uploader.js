/**
 * Video Uploader Component
 * Handles video file upload and validation
 */

class VideoUploader {
  constructor(containerId, onUploadComplete) {
    this.container = document.getElementById(containerId);
    this.fileInput = document.getElementById('video-file-input');
    this.browseBtn = document.getElementById('browse-btn');
    this.analyzeBtn = document.getElementById('analyze-btn');
    this.onUploadComplete = onUploadComplete;
    this.currentFile = null;
    this.videoData = null;

    this.init();
  }

  init() {
    // Click to browse
    this.container.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });

    // File selected
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file);
      }
    });

    // Drag and drop
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.container.classList.add('dragging');
    });

    this.container.addEventListener('dragleave', () => {
      this.container.classList.remove('dragging');
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      this.container.classList.remove('dragging');

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        this.handleFile(file);
      } else {
        alert('Please drop a video file');
      }
    });

    // Analyze button
    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener('click', () => {
        if (this.videoData) {
          this.onUploadComplete(this.videoData);
        }
      });
    }
  }

  async handleFile(file) {
    console.log('File selected:', file.name, file.size);

    // Validate file
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 500MB');
      return;
    }

    this.currentFile = file;

    // Show progress
    this.showProgress(0);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'x-user-id': 'test-user-' + Date.now()
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      this.videoData = data;

      // Show video info
      this.showVideoInfo(data);

      // Hide progress
      this.hideProgress();

      console.log('Upload complete:', data);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video: ' + error.message);
      this.hideProgress();
    }
  }

  showProgress(percent) {
    const progressSection = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    this.container.style.display = 'none';
    progressSection.style.display = 'block';

    progressBar.style.width = percent + '%';
    progressText.textContent = `Uploading... ${percent}%`;
  }

  hideProgress() {
    document.getElementById('upload-progress').style.display = 'none';
  }

  showVideoInfo(data) {
    const infoSection = document.getElementById('video-info');
    const metadata = data.metadata;

    // Update info
    document.getElementById('video-duration').textContent =
      this.formatDuration(metadata.duration);
    document.getElementById('video-size').textContent =
      this.formatFileSize(metadata.size);
    document.getElementById('video-resolution').textContent =
      `${metadata.width}x${metadata.height}`;

    // Show info section
    infoSection.style.display = 'block';

    // Enable analyze button
    if (this.analyzeBtn) {
      this.analyzeBtn.disabled = false;
    }
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes) {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return mb.toFixed(1) + ' MB';
  }

  reset() {
    this.currentFile = null;
    this.videoData = null;
    this.fileInput.value = '';
    this.container.style.display = 'block';
    document.getElementById('video-info').style.display = 'none';
    if (this.analyzeBtn) {
      this.analyzeBtn.disabled = true;
    }
  }
}
