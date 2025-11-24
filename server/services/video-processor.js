/**
 * Video Processor Service
 * Handles video file processing, frame extraction, and clip generation
 * Uses fluent-ffmpeg for video manipulation
 */

const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../core/logger');

class VideoProcessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.framesPerSecond = 0.5; // Extract 1 frame every 2 seconds
    this.maxFrames = 50; // Maximum frames to extract
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info('Temp directory ready', { path: this.tempDir });
    } catch (error) {
      logger.error('Failed to create temp directory', { error: error.message });
    }
  }

  /**
   * Get video metadata (duration, resolution, etc.)
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Object>} Video metadata
   */
  getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error('Failed to get video metadata', { error: err.message });
          reject(new Error(`Failed to read video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const result = {
          duration: metadata.format.duration,
          width: videoStream.width,
          height: videoStream.height,
          fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
          codec: videoStream.codec_name,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate
        };

        logger.info('Video metadata extracted', result);
        resolve(result);
      });
    });
  }

  /**
   * Extract frames from video at regular intervals
   * @param {string} videoPath - Path to video file
   * @param {number} videoDuration - Duration in seconds
   * @returns {Promise<Array>} Array of frames with timestamps and base64 data
   */
  async extractFrames(videoPath, videoDuration) {
    try {
      const sessionId = uuidv4();
      const framesDir = path.join(this.tempDir, `frames_${sessionId}`);
      await fs.mkdir(framesDir, { recursive: true });

      // Calculate frame extraction interval
      const totalFramesToExtract = Math.min(
        Math.floor(videoDuration * this.framesPerSecond),
        this.maxFrames
      );
      const interval = videoDuration / totalFramesToExtract;

      logger.info('Starting frame extraction', {
        duration: videoDuration,
        totalFrames: totalFramesToExtract,
        interval
      });

      // Extract frames using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .on('end', () => {
            logger.info('Frame extraction complete');
            resolve();
          })
          .on('error', (err) => {
            logger.error('Frame extraction failed', { error: err.message });
            reject(err);
          })
          .outputOptions([
            `-vf fps=1/${interval}`, // Extract 1 frame every interval seconds
            '-frames:v', totalFramesToExtract.toString()
          ])
          .output(path.join(framesDir, 'frame_%04d.jpg'))
          .run();
      });

      // Read extracted frames
      const frameFiles = await fs.readdir(framesDir);
      const frames = [];

      for (let i = 0; i < frameFiles.length; i++) {
        const framePath = path.join(framesDir, frameFiles[i]);
        const timestamp = i * interval;

        // Resize and compress frame
        const buffer = await sharp(framePath)
          .resize(640, 360, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const base64 = buffer.toString('base64');

        frames.push({
          timestamp,
          data: base64
        });

        // Clean up frame file
        await fs.unlink(framePath);
      }

      // Clean up frames directory
      await fs.rmdir(framesDir);

      logger.info('Frames processed', { count: frames.length });
      return frames;

    } catch (error) {
      logger.error('Error extracting frames', { error: error.message });
      throw new Error(`Failed to extract frames: ${error.message}`);
    }
  }

  /**
   * Trim video to create a clip
   * @param {string} videoPath - Path to source video
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @param {string} outputPath - Path for output clip
   * @returns {Promise<string>} Path to created clip
   */
  async trimVideo(videoPath, startTime, endTime, outputPath) {
    try {
      logger.info('Trimming video', { startTime, endTime, outputPath });

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(startTime)
          .setDuration(endTime - startTime)
          .output(outputPath)
          .on('end', () => {
            logger.info('Video trim complete', { outputPath });
            resolve();
          })
          .on('error', (err) => {
            logger.error('Video trim failed', { error: err.message });
            reject(err);
          })
          .run();
      });

      return outputPath;

    } catch (error) {
      logger.error('Error trimming video', { error: error.message });
      throw new Error(`Failed to trim video: ${error.message}`);
    }
  }

  /**
   * Extract audio from video
   * @param {string} videoPath - Path to video file
   * @param {string} outputPath - Path for output audio file
   * @returns {Promise<string>} Path to extracted audio
   */
  async extractAudio(videoPath, outputPath) {
    try {
      logger.info('Extracting audio', { videoPath, outputPath });

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .output(outputPath)
          .on('end', () => {
            logger.info('Audio extraction complete', { outputPath });
            resolve();
          })
          .on('error', (err) => {
            logger.error('Audio extraction failed', { error: err.message });
            reject(err);
          })
          .run();
      });

      return outputPath;

    } catch (error) {
      logger.error('Error extracting audio', { error: error.message });
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }

  /**
   * Generate video thumbnail
   * @param {string} videoPath - Path to video file
   * @param {number} timestamp - Time in seconds to capture thumbnail
   * @returns {Promise<Buffer>} Thumbnail image buffer
   */
  async generateThumbnail(videoPath, timestamp = 0) {
    try {
      const sessionId = uuidv4();
      const thumbnailPath = path.join(this.tempDir, `thumb_${sessionId}.jpg`);

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .output(thumbnailPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Resize and compress
      const buffer = await sharp(thumbnailPath)
        .resize(320, 180, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Clean up
      await fs.unlink(thumbnailPath);

      logger.info('Thumbnail generated', { timestamp });
      return buffer;

    } catch (error) {
      logger.error('Error generating thumbnail', { error: error.message });
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  /**
   * Validate video file
   * @param {string} videoPath - Path to video file
   * @param {number} maxSizeMB - Maximum file size in MB
   * @param {number} maxDurationSeconds - Maximum duration in seconds
   * @returns {Promise<Object>} Validation result
   */
  async validateVideo(videoPath, maxSizeMB = 500, maxDurationSeconds = 3600) {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      const sizeMB = metadata.size / (1024 * 1024);

      const errors = [];

      if (sizeMB > maxSizeMB) {
        errors.push(`File size (${sizeMB.toFixed(2)}MB) exceeds limit (${maxSizeMB}MB)`);
      }

      if (metadata.duration > maxDurationSeconds) {
        errors.push(`Duration (${metadata.duration}s) exceeds limit (${maxDurationSeconds}s)`);
      }

      if (!metadata.width || !metadata.height) {
        errors.push('Invalid video dimensions');
      }

      const isValid = errors.length === 0;

      logger.info('Video validation', {
        isValid,
        sizeMB: sizeMB.toFixed(2),
        duration: metadata.duration,
        errors
      });

      return {
        isValid,
        errors,
        metadata
      };

    } catch (error) {
      logger.error('Video validation failed', { error: error.message });
      return {
        isValid: false,
        errors: [error.message],
        metadata: null
      };
    }
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} filePaths - Paths to files to delete
   */
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        logger.info('Cleaned up temp file', { filePath });
      } catch (error) {
        logger.warn('Failed to clean up file', { filePath, error: error.message });
      }
    }
  }
}

module.exports = VideoProcessor;
