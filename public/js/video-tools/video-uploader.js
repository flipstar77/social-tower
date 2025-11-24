/**
 * Video Uploader Component
 * Handles video file upload and validation
 * Uses direct Supabase Storage upload to bypass Vercel 4.5MB limit
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
    this.supabase = null;

    this.initSupabase();
    this.init();
  }

  async initSupabase() {
    try {
      // Import Supabase client
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

      const supabaseUrl = 'https://kktvmpwxfyevkgotppah.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdHZtcHd4Znlldmtnb3RwcGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTI4MTAsImV4cCI6MjA1MjE4ODgxMH0.hLl4Oizwf47R35Kq18-D_jfL0P96gkm6YEzpnVFa_jU';

      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase initialized for video upload');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
    }
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.upload-tab');
    const fileTab = document.getElementById('file-upload-tab');
    const urlTab = document.getElementById('url-upload-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));

        // Add active to clicked tab
        tab.classList.add('active');

        // Switch content
        const tabType = tab.getAttribute('data-tab');
        if (tabType === 'file') {
          fileTab.classList.add('active');
          urlTab.classList.remove('active');
          fileTab.style.display = 'block';
          urlTab.style.display = 'none';
        } else {
          fileTab.classList.remove('active');
          urlTab.classList.add('active');
          fileTab.style.display = 'none';
          urlTab.style.display = 'block';
        }
      });
    });
  }

  async handleUrl() {
    const urlInput = document.getElementById('video-url-input');
    const videoUrl = urlInput.value.trim();

    if (!videoUrl) {
      alert('Please enter a video URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
    } catch (error) {
      alert('Please enter a valid URL');
      return;
    }

    // Show progress
    this.showProgress(10);

    try {
      console.log('📥 Processing video URL:', videoUrl);

      // Determine filename from URL
      const urlObj = new URL(videoUrl);
      const fileName = urlObj.pathname.split('/').pop() || 'video.mp4';

      // Call backend to process URL
      const response = await fetch(`${API_BASE_URL}/process-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-' + Date.now()
        },
        body: JSON.stringify({
          videoUrl: videoUrl,
          fileName: fileName,
          fileSize: 0 // Unknown for URLs
        })
      });

      this.showProgress(70);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('URL processing error:', errorText);
        throw new Error(`Processing failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Video URL processed:', data);
      this.videoData = data;

      // Show video info
      this.showVideoInfo(data);

      // Hide progress
      this.showProgress(100);
      this.hideProgress();

      // Clear input
      urlInput.value = '';

      console.log('🎉 URL processing complete:', data);

    } catch (error) {
      console.error('URL processing error:', error);
      alert('Failed to process video URL: ' + error.message);
      this.hideProgress();
    }
  }

  init() {
    // Setup tab switching
    this.setupTabs();

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

    // URL processing
    const processUrlBtn = document.getElementById('process-url-btn');
    if (processUrlBtn) {
      processUrlBtn.addEventListener('click', () => this.handleUrl());
    }

    const urlInput = document.getElementById('video-url-input');
    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleUrl();
        }
      });
    }

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
      if (!this.supabase) {
        throw new Error('Supabase not initialized. Please refresh the page.');
      }

      // Generate unique filename
      const userId = 'user-' + Date.now();
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}.${fileExt}`;

      console.log('📤 Uploading directly to Supabase Storage:', fileName);
      this.showProgress(10);

      // Upload directly to Supabase Storage (bypasses Vercel 4.5MB limit!)
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('tower-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('✅ File uploaded to Supabase:', uploadData.path);
      this.showProgress(50);

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('tower-videos')
        .getPublicUrl(uploadData.path);

      const videoUrl = urlData.publicUrl;
      console.log('📹 Video URL:', videoUrl);

      this.showProgress(70);

      // Now call backend to process the video URL
      console.log('🔍 Requesting video metadata from backend...');
      const response = await fetch(`${API_BASE_URL}/process-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          videoUrl: videoUrl,
          fileName: file.name,
          fileSize: file.size
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend processing error:', errorText);
        throw new Error(`Processing failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Video processed:', data);
      this.videoData = data;

      // Show video info
      this.showVideoInfo(data);

      // Hide progress
      this.hideProgress();
      this.showProgress(100);

      console.log('🎉 Upload complete:', data);

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
