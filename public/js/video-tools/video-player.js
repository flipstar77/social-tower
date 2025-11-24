/**
 * Video Player Component
 * Handles video playback and controls
 */

class VideoPlayer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.player = document.getElementById('video-player');
    this.placeholder = this.container.querySelector('.player-placeholder');
    this.currentVideoUrl = null;

    this.init();
  }

  init() {
    // Video player event listeners
    if (this.player) {
      this.player.addEventListener('loadeddata', () => {
        console.log('Video loaded');
      });

      this.player.addEventListener('error', (e) => {
        console.error('Video playback error:', e);
        alert('Failed to load video');
      });
    }

    // Download clip button
    const downloadBtn = document.getElementById('download-clip-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadCurrentClip());
    }

    // Share clip button
    const shareBtn = document.getElementById('share-clip-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareClip());
    }
  }

  loadVideoFromPath(videoPath) {
    console.log('Loading video from path:', videoPath);

    // For now, we'll show a message since we can't directly load local files
    // In production, this would load from Supabase Storage
    this.hidePlaceholder();

    // Create a temporary message
    const message = document.createElement('div');
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      background: rgba(0, 0, 0, 0.8);
      padding: 2rem;
      border-radius: 12px;
      max-width: 400px;
    `;
    message.innerHTML = `
      <h3>✅ Video Uploaded</h3>
      <p>Video is being processed for playback</p>
      <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 1rem;">
        In production, the video would be loaded from Supabase Storage here
      </p>
    `;

    this.container.appendChild(message);
  }

  loadVideoFromUrl(url) {
    console.log('Loading video from URL:', url);

    this.currentVideoUrl = url;
    this.hidePlaceholder();

    this.player.src = url;
    this.player.style.display = 'block';
    this.player.load();
  }

  loadVideoFromBlob(blob) {
    const url = URL.createObjectURL(blob);
    this.loadVideoFromUrl(url);
  }

  hidePlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.display = 'none';
    }
  }

  showPlaceholder() {
    if (this.placeholder) {
      this.placeholder.style.display = 'flex';
    }
    this.player.style.display = 'none';
  }

  seekTo(timeInSeconds) {
    if (this.player && !this.player.paused) {
      this.player.currentTime = timeInSeconds;
      this.player.play();
    }
  }

  play() {
    if (this.player) {
      this.player.play();
    }
  }

  pause() {
    if (this.player) {
      this.player.pause();
    }
  }

  setVolume(volume) {
    if (this.player) {
      this.player.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getCurrentTime() {
    return this.player ? this.player.currentTime : 0;
  }

  getDuration() {
    return this.player ? this.player.duration : 0;
  }

  downloadCurrentClip() {
    // TODO: Implement clip download
    // This would call the /generate-clip endpoint
    alert('Clip download coming soon!');
  }

  shareClip() {
    // TODO: Implement clip sharing
    // This would generate a shareable link
    if (navigator.clipboard) {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
    } else {
      alert('Sharing coming soon!');
    }
  }

  reset() {
    this.player.src = '';
    this.player.style.display = 'none';
    this.showPlaceholder();
    this.currentVideoUrl = null;
  }
}
