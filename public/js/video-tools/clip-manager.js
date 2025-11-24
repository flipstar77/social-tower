/**
 * Clip Manager Component
 * Handles display and selection of video clips
 */

class ClipManager {
  constructor(containerId, onClipSelected) {
    this.container = document.getElementById(containerId);
    this.sortSelect = document.getElementById('sort-clips');
    this.onClipSelected = onClipSelected;
    this.clips = [];
    this.selectedClipId = null;

    this.init();
  }

  init() {
    // Sort selection
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => {
        this.sortClips(this.sortSelect.value);
        this.render();
      });
    }
  }

  displayClips(clips) {
    console.log('Displaying clips:', clips.length);
    this.clips = clips;
    this.sortClips('virality'); // Default sort by virality
    this.render();
  }

  sortClips(sortBy) {
    if (sortBy === 'virality') {
      this.clips.sort((a, b) => b.viralityScore - a.viralityScore);
    } else if (sortBy === 'time') {
      this.clips.sort((a, b) => a.startTime - b.startTime);
    }
  }

  render() {
    // Clear container
    this.container.innerHTML = '';

    if (this.clips.length === 0) {
      this.showEmptyState();
      return;
    }

    // Render clips
    this.clips.forEach((clip, index) => {
      const clipCard = this.createClipCard(clip, index);
      this.container.appendChild(clipCard);
    });
  }

  createClipCard(clip, index) {
    const card = document.createElement('div');
    card.className = 'clip-card';
    card.dataset.clipId = clip.id;

    if (clip.id === this.selectedClipId) {
      card.classList.add('active');
    }

    // Virality badge class
    let viralityClass = 'low';
    if (clip.viralityScore >= 75) {
      viralityClass = 'high';
    } else if (clip.viralityScore >= 50) {
      viralityClass = 'medium';
    }

    card.innerHTML = `
      <div class="clip-card-header">
        <h4 class="clip-card-title">${clip.title}</h4>
        <span class="virality-badge ${viralityClass}">${clip.viralityScore}</span>
      </div>
      <div class="clip-card-body">
        ${this.truncateText(clip.summary, 100)}
      </div>
      <div class="clip-card-footer">
        <span class="clip-duration">
          ${this.formatTime(clip.startTime)} - ${this.formatTime(clip.endTime)}
        </span>
        <span class="clip-length">
          ${this.formatDuration(clip.endTime - clip.startTime)}
        </span>
      </div>
    `;

    // Click handler
    card.addEventListener('click', () => {
      this.selectClip(clip);
    });

    return card;
  }

  selectClip(clip) {
    console.log('Clip selected:', clip.title);

    // Update selected state
    this.selectedClipId = clip.id;

    // Update UI
    this.container.querySelectorAll('.clip-card').forEach(card => {
      if (card.dataset.clipId === clip.id) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Call callback
    if (this.onClipSelected) {
      this.onClipSelected(clip);
    }
  }

  showEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <p>No clips yet</p>
        <p class="empty-hint">Upload and analyze a video to see AI-detected viral moments</p>
      </div>
    `;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDuration(seconds) {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getClipById(clipId) {
    return this.clips.find(c => c.id === clipId);
  }

  clear() {
    this.clips = [];
    this.selectedClipId = null;
    this.render();
  }
}
