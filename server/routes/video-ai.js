/**
 * Video AI Routes
 * Handles video upload, analysis, and clip generation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Lazy initialization for serverless environment
let geminiService = null;
let videoProcessor = null;

// Initialize services on first use (lazy loading)
function getGeminiService() {
  if (!geminiService) {
    try {
      const GeminiService = require('../services/gemini-service');
      geminiService = new GeminiService();
      console.log('✅ Gemini service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error.message);
      throw error;
    }
  }
  return geminiService;
}

function getVideoProcessor() {
  if (!videoProcessor) {
    try {
      const VideoProcessor = require('../services/video-processor');
      videoProcessor = new VideoProcessor();
      console.log('✅ Video processor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Video processor:', error.message);
      throw error;
    }
  }
  return videoProcessor;
}

// Use console.log instead of logger for serverless
const logger = {
  info: (msg, data) => console.log(msg, data || ''),
  error: (msg, data) => console.error(msg, data || ''),
  warn: (msg, data) => console.warn(msg, data || '')
};

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp/uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (process.env.VIDEO_UPLOAD_LIMIT_MB || 500) * 1024 * 1024 // Default 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Middleware to verify authentication (assuming you have auth middleware)
const requireAuth = (req, res, next) => {
  // TODO: Implement proper authentication check
  // For now, we'll use a mock user ID
  // In production, this should check the JWT token or session

  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  req.userId = userId;
  next();
};

/**
 * POST /api/video-ai/upload
 * Upload a video file
 */
router.post('/upload', requireAuth, upload.single('video'), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    tempFilePath = req.file.path;
    const originalFilename = req.file.originalname;

    logger.info('Video upload started', {
      userId: req.userId,
      filename: originalFilename,
      size: req.file.size
    });

    // Validate video
    const maxSizeMB = parseInt(process.env.VIDEO_UPLOAD_LIMIT_MB || 500);
    const maxDuration = parseInt(process.env.VIDEO_MAX_DURATION_SECONDS || 3600);

    const validation = await getVideoProcessor().validateVideo(
      tempFilePath,
      maxSizeMB,
      maxDuration
    );

    if (!validation.isValid) {
      await fs.unlink(tempFilePath);
      return res.status(400).json({
        success: false,
        error: 'Video validation failed',
        details: validation.errors
      });
    }

    // TODO: Upload to Supabase Storage
    // For now, we'll keep it in temp and return metadata
    // In production, upload to Supabase Storage and save metadata to database

    const videoId = uuidv4();
    const metadata = validation.metadata;

    // Generate thumbnail
    const thumbnail = await getVideoProcessor().generateThumbnail(tempFilePath, 1);
    const thumbnailBase64 = thumbnail.toString('base64');

    res.json({
      success: true,
      videoId,
      filename: originalFilename,
      metadata: {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        codec: metadata.codec
      },
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`,
      tempPath: tempFilePath // Return temp path for next step
    });

  } catch (error) {
    logger.error('Video upload failed', {
      error: error.message,
      userId: req.userId
    });

    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file', { path: tempFilePath });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload video',
      message: error.message
    });
  }
});

/**
 * POST /api/video-ai/process-url
 * Process a video URL from Supabase Storage
 * This endpoint accepts video URLs instead of file uploads to bypass Vercel's 4.5MB limit
 */
router.post('/process-url', requireAuth, async (req, res) => {
  const { videoUrl, fileName, fileSize } = req.body;

  if (!videoUrl) {
    return res.status(400).json({
      success: false,
      error: 'videoUrl is required'
    });
  }

  let tempFilePath = null;

  try {
    logger.info('Processing video from URL', {
      userId: req.userId,
      url: videoUrl,
      fileName
    });

    const tempDir = path.join(__dirname, '../../temp/uploads');
    await fs.mkdir(tempDir, { recursive: true });

    const videoId = uuidv4();
    const fileExt = fileName ? path.extname(fileName) : '.mp4';
    tempFilePath = path.join(tempDir, `${videoId}${fileExt}`);

    // Check if URL is from YouTube/social media
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ||
                      videoUrl.includes('tiktok.com') || videoUrl.includes('instagram.com') ||
                      videoUrl.includes('twitter.com') || videoUrl.includes('x.com');

    if (isYouTube) {
      // Use ytdl-core for YouTube downloads (serverless-compatible)
      logger.info('Detected YouTube/social media URL, using ytdl-core...');

      try {
        const ytdl = require('@ybd-project/ytdl-core');

        // Download YouTube video
        const videoStream = ytdl(videoUrl, {
          quality: 'highest',
          filter: 'videoandaudio'
        });

        const writer = require('fs').createWriteStream(tempFilePath);
        videoStream.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          videoStream.on('error', reject);
        });

        logger.info('Video downloaded via ytdl-core');
      } catch (ytdlError) {
        logger.error('YouTube download failed:', { error: ytdlError.message });

        // Return helpful error message
        return res.status(400).json({
          success: false,
          error: 'Failed to download YouTube video',
          suggestion: 'YouTube URL may be invalid, age-restricted, or unavailable. Try downloading the video to your computer first, then upload it using the File Upload tab.',
          details: ytdlError.message
        });
      }
    } else {
      // Direct download for Supabase/direct URLs
      logger.info('Downloading video from direct URL...', { tempPath: tempFilePath });
      const axios = require('axios');

      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream'
      });

      const writer = require('fs').createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      logger.info('Video downloaded successfully');
    }

    // Validate and get metadata
    const maxSizeMB = parseInt(process.env.VIDEO_UPLOAD_LIMIT_MB || 500);
    const maxDuration = parseInt(process.env.VIDEO_MAX_DURATION_SECONDS || 3600);

    const validation = await getVideoProcessor().validateVideo(
      tempFilePath,
      maxSizeMB,
      maxDuration
    );

    if (!validation.isValid) {
      await fs.unlink(tempFilePath);
      return res.status(400).json({
        success: false,
        error: 'Video validation failed',
        details: validation.errors
      });
    }

    const metadata = validation.metadata;

    // Generate thumbnail
    const thumbnail = await getVideoProcessor().generateThumbnail(tempFilePath, 1);
    const thumbnailBase64 = thumbnail.toString('base64');

    res.json({
      success: true,
      videoId,
      videoUrl,
      filename: fileName || 'video' + fileExt,
      metadata: {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        codec: metadata.codec
      },
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`,
      tempPath: tempFilePath // Return temp path for analysis
    });

  } catch (error) {
    logger.error('Video URL processing failed', {
      error: error.message,
      userId: req.userId,
      url: videoUrl
    });

    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file', { path: tempFilePath });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process video URL',
      message: error.message
    });
  }
});

/**
 * POST /api/video-ai/analyze
 * Analyze video and generate clips
 */
router.post('/analyze', requireAuth, async (req, res) => {
  const { videoPath, duration } = req.body;

  if (!videoPath || !duration) {
    return res.status(400).json({
      success: false,
      error: 'videoPath and duration are required'
    });
  }

  try {
    logger.info('Starting video analysis', {
      userId: req.userId,
      duration
    });

    // Extract frames
    const frames = await getVideoProcessor().extractFrames(videoPath, duration);

    logger.info('Frames extracted, sending to Gemini', {
      frameCount: frames.length
    });

    // Analyze with Gemini AI
    const clips = await getGeminiService().analyzeVideoFrames(frames, duration);

    logger.info('Video analysis complete', {
      userId: req.userId,
      clipsFound: clips.length
    });

    res.json({
      success: true,
      clips,
      frameCount: frames.length
    });

  } catch (error) {
    logger.error('Video analysis failed', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to analyze video',
      message: error.message
    });
  }
});

/**
 * POST /api/video-ai/generate-clip
 * Generate a specific clip from video
 */
router.post('/generate-clip', requireAuth, async (req, res) => {
  const { videoPath, startTime, endTime, clipId } = req.body;

  if (!videoPath || startTime === undefined || endTime === undefined) {
    return res.status(400).json({
      success: false,
      error: 'videoPath, startTime, and endTime are required'
    });
  }

  try {
    const outputDir = path.join(__dirname, '../../temp/clips');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `clip_${clipId || uuidv4()}.mp4`);

    logger.info('Generating clip', {
      userId: req.userId,
      startTime,
      endTime
    });

    await getVideoProcessor().trimVideo(videoPath, startTime, endTime, outputPath);

    // Generate thumbnail for clip
    const thumbnail = await getVideoProcessor().generateThumbnail(outputPath, 0);

    res.json({
      success: true,
      clipPath: outputPath,
      thumbnail: `data:image/jpeg;base64,${thumbnail.toString('base64')}`
    });

  } catch (error) {
    logger.error('Clip generation failed', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate clip',
      message: error.message
    });
  }
});

/**
 * POST /api/video-ai/analyze-comments
 * Analyze video comments
 */
router.post('/analyze-comments', requireAuth, async (req, res) => {
  const { comments } = req.body;

  if (!comments || !Array.isArray(comments)) {
    return res.status(400).json({
      success: false,
      error: 'comments array is required'
    });
  }

  try {
    logger.info('Analyzing comments', {
      userId: req.userId,
      commentCount: comments.length
    });

    const analysis = await getGeminiService().analyzeComments(comments);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error('Comment analysis failed', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to analyze comments',
      message: error.message
    });
  }
});

/**
 * POST /api/video-ai/generate-transcript
 * Generate video transcript
 */
router.post('/generate-transcript', requireAuth, async (req, res) => {
  const { videoPath, duration } = req.body;

  if (!videoPath || !duration) {
    return res.status(400).json({
      success: false,
      error: 'videoPath and duration are required'
    });
  }

  try {
    logger.info('Generating transcript', {
      userId: req.userId,
      duration
    });

    // Extract frames
    const frames = await getVideoProcessor().extractFrames(videoPath, duration);

    // Generate transcript
    const transcript = await getGeminiService().generateTranscript(frames, duration);

    res.json({
      success: true,
      transcript
    });

  } catch (error) {
    logger.error('Transcript generation failed', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate transcript',
      message: error.message
    });
  }
});

/**
 * GET /api/video-ai/health
 * Health check for video AI services
 */
router.get('/health', async (req, res) => {
  try {
    let geminiHealth = false;
    let geminiError = null;

    // Try to initialize and check Gemini service
    try {
      console.log('Health check: Attempting to get Gemini service...');
      const service = getGeminiService();
      console.log('Health check: Service initialized, calling healthCheck()...');
      geminiHealth = await service.healthCheck();
      console.log('Health check: Result =', geminiHealth);
    } catch (error) {
      console.error('Gemini health check error:', error.message);
      console.error('Full error:', error);
      geminiError = error.message;
    }

    res.json({
      success: true,
      services: {
        gemini: geminiHealth ? 'healthy' : 'unhealthy',
        videoProcessor: 'available',
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        geminiError: geminiError
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/video-ai/cleanup
 * Clean up temporary files
 */
router.delete('/cleanup', requireAuth, async (req, res) => {
  const { filePaths } = req.body;

  if (!filePaths || !Array.isArray(filePaths)) {
    return res.status(400).json({
      success: false,
      error: 'filePaths array is required'
    });
  }

  try {
    await getVideoProcessor().cleanup(filePaths);

    res.json({
      success: true,
      message: 'Files cleaned up successfully'
    });

  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

module.exports = router;
