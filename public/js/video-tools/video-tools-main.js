/**
 * Video Tools Main Controller
 * Coordinates all video tool components
 */

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:6078/api/video-ai'
  : '/api/video-ai';

class VideoToolsApp {
  constructor() {
    this.uploader = null;
    this.player = null;
    this.clipManager = null;
    this.currentVideo = null;
    this.currentClips = [];

    this.init();
  }

  init() {
    // Initialize components
    this.uploader = new VideoUploader('upload-area', this.handleVideoUploaded.bind(this));
    this.player = new VideoPlayer('video-player-container');
    this.clipManager = new ClipManager('clips-list', this.handleClipSelected.bind(this));

    // Check AI service health
    this.checkHealthStatus();

    console.log('🎬 Video Tools initialized');
  }

  async checkHealthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      const statusEl = document.getElementById('ai-status');
      if (data.success && data.services.gemini === 'healthy') {
        statusEl.textContent = 'AI Ready';
        statusEl.previousElementSibling.style.background = '#10b981';
      } else {
        statusEl.textContent = 'AI Unavailable';
        statusEl.previousElementSibling.style.background = '#ef4444';
      }
    } catch (error) {
      console.error('Health check failed:', error);
      document.getElementById('ai-status').textContent = 'AI Offline';
    }
  }

  async handleVideoUploaded(videoData) {
    console.log('Video uploaded:', videoData);
    this.currentVideo = videoData;

    // Show loading overlay
    this.showLoading('Analyzing Video...', 'Finding viral moments with AI');

    try {
      // Call analyze API
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        },
        body: JSON.stringify({
          videoPath: videoData.tempPath,
          duration: videoData.metadata.duration
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      this.currentClips = result.clips;

      // Load video in player
      this.player.loadVideoFromPath(videoData.tempPath);

      // Display clips
      this.clipManager.displayClips(result.clips);

      // Hide loading
      this.hideLoading();

      // Show success message
      this.showNotification(`✨ Found ${result.clips.length} viral moments!`, 'success');

    } catch (error) {
      console.error('Analysis error:', error);
      this.hideLoading();
      this.showNotification('❌ Failed to analyze video', 'error');
    }
  }

  handleClipSelected(clip) {
    console.log('Clip selected:', clip);

    // Update player to show clip timeframe
    this.player.seekTo(clip.startTime);

    // Display clip details
    this.displayClipDetails(clip);
  }

  displayClipDetails(clip) {
    // Show clip details section
    const detailsEl = document.getElementById('clip-details');
    const emptyState = document.querySelector('.analysis-results .empty-state');

    if (emptyState) emptyState.style.display = 'none';
    detailsEl.style.display = 'block';

    // Update clip info
    document.getElementById('clip-title').textContent = clip.title;
    document.getElementById('clip-virality').textContent = clip.viralityScore;
    document.getElementById('clip-summary').textContent = clip.summary;
    document.getElementById('clip-reasoning').textContent = clip.reasoning;
    document.getElementById('clip-timing').textContent =
      `${this.formatTime(clip.startTime)} - ${this.formatTime(clip.endTime)}`;

    // Update virality badge color
    const viralityBadge = document.getElementById('clip-virality');
    if (clip.viralityScore >= 75) {
      viralityBadge.className = 'virality-badge high';
    } else if (clip.viralityScore >= 50) {
      viralityBadge.className = 'virality-badge medium';
    } else {
      viralityBadge.className = 'virality-badge low';
    }

    // Update tags
    const tagsContainer = document.getElementById('clip-tags');
    tagsContainer.innerHTML = '';
    clip.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });

    // Show player controls
    document.getElementById('player-controls').style.display = 'block';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getUserId() {
    // TODO: Get actual user ID from authentication
    // For now, use a temporary ID
    return 'test-user-' + Date.now();
  }

  showLoading(title, message) {
    const overlay = document.getElementById('loading-overlay');
    document.getElementById('loading-title').textContent = title;
    document.getElementById('loading-message').textContent = message;
    overlay.style.display = 'flex';
  }

  hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
      color: white;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 2000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.videoToolsApp = new VideoToolsApp();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
