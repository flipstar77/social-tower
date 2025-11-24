/**
 * Gemini AI Service
 * Handles video analysis, clip generation, and AI-powered insights
 * Converted from TypeScript to vanilla JavaScript for social-tower
 */

const { GoogleGenAI, Type } = require('@google/genai');
const logger = require('../core/logger');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    this.ai = new GoogleGenAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    logger.info('Gemini AI Service initialized', { model: this.modelName });
  }

  /**
   * Analyze video frames to identify viral clips
   * @param {Array<{timestamp: number, data: string}>} frames - Array of video frames (base64)
   * @param {number} videoDuration - Total video duration in seconds
   * @returns {Promise<Array>} Array of detected video clips
   */
  async analyzeVideoFrames(frames, videoDuration) {
    try {
      logger.info('Analyzing video frames', {
        frameCount: frames.length,
        duration: videoDuration
      });

      // Construct the prompt
      const parts = [];

      parts.push({
        text: `You are an expert video editor and social media strategist analyzing Tower game content.
        Analyze the following sequence of video frames (extracted every few seconds).
        Your goal is to identify the top 3-5 most "viral" or engaging segments suitable for YouTube Shorts or TikTok.

        Focus on:
        - Exciting gameplay moments (boss fights, close calls, big wins)
        - Impressive tower runs or strategies
        - Funny or unexpected moments
        - High-skill plays or clutch saves

        For each segment:
        1. Identify exact start and end times (based on frame timestamps provided).
        2. Create a catchy Title that would work for Tower game content.
        3. Provide a 'Virality Score' (0-100) based on visual interest, action, or emotion.
        4. Write a brief summary of what happens in the gameplay.
        5. Generate 3-5 relevant hashtags/keywords for Tower game content.
        6. Generate a short 'Transcript Stub' - describe the action or add hypothetical commentary.

        Total Video Duration: ${videoDuration.toFixed(0)} seconds.
        Game Context: This is from "The Tower" mobile game - an idle tower defense/RPG hybrid.
        `
      });

      // Add frames to the payload
      frames.forEach(frame => {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: frame.data
          }
        });
        parts.push({
          text: `[Timestamp: ${frame.timestamp.toFixed(1)}s]`
        });
      });

      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.NUMBER, description: 'Start time in seconds' },
            endTime: { type: Type.NUMBER, description: 'End time in seconds' },
            title: { type: Type.STRING, description: 'Catchy title for the clip' },
            summary: { type: Type.STRING, description: 'Description of the clip content' },
            viralityScore: { type: Type.NUMBER, description: 'Predicted virality score 0-100' },
            reasoning: { type: Type.STRING, description: 'Why this clip is viral' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Relevant tags' },
            transcriptStub: { type: Type.STRING, description: 'Estimated spoken text or caption' }
          },
          required: ['startTime', 'endTime', 'title', 'summary', 'viralityScore', 'tags']
        }
      };

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          systemInstruction: 'You are a professional video clipper bot specialized in Tower game content. You are precise with timestamps and understand Tower game mechanics.'
        }
      });

      const text = result.text;
      if (!text) {
        throw new Error('No response from Gemini');
      }

      const rawClips = JSON.parse(text);

      // Add unique IDs and embeddings to clips
      const clips = rawClips.map((clip, index) => ({
        id: `clip_${Date.now()}_${index}`,
        ...clip,
        reasoning: clip.reasoning || 'AI-detected viral moment',
        transcriptStub: clip.transcriptStub || ''
      }));

      logger.info('Video analysis complete', {
        clipsFound: clips.length,
        avgViralityScore: clips.reduce((sum, c) => sum + c.viralityScore, 0) / clips.length
      });

      return clips;

    } catch (error) {
      logger.error('Error analyzing video frames', { error: error.message });
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for semantic search
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const result = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        content: text
      });

      return result.embedding.values;

    } catch (error) {
      logger.error('Error generating embedding', { error: error.message });
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Analyze video comments for sentiment and insights
   * @param {Array<string>} comments - Array of comment strings
   * @returns {Promise<Object>} Comment analysis results
   */
  async analyzeComments(comments) {
    try {
      logger.info('Analyzing comments', { commentCount: comments.length });

      const prompt = `Analyze the following viewer comments for this Tower game video.

      Provide:
      1. Overall sentiment (Positive, Negative, Neutral, or Mixed)
      2. A brief summary of common themes
      3. Key topics mentioned (3-5 topics)
      4. Specific viewer requests or questions
      5. Content suggestions based on feedback

      Comments:
      ${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.STRING,
            description: 'Overall sentiment',
            enum: ['Positive', 'Negative', 'Neutral', 'Mixed']
          },
          summary: { type: Type.STRING, description: 'Summary of comments' },
          keyTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Main topics discussed'
          },
          viewerRequests: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific requests from viewers'
          },
          contentSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Suggested content ideas'
          }
        },
        required: ['sentiment', 'summary', 'keyTopics']
      };

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });

      const analysis = JSON.parse(result.text);

      logger.info('Comment analysis complete', {
        sentiment: analysis.sentiment,
        topicsFound: analysis.keyTopics.length
      });

      return analysis;

    } catch (error) {
      logger.error('Error analyzing comments', { error: error.message });
      throw new Error(`Failed to analyze comments: ${error.message}`);
    }
  }

  /**
   * Generate video transcript from frames
   * @param {Array<{timestamp: number, data: string}>} frames - Video frames
   * @param {number} videoDuration - Total duration
   * @returns {Promise<Array>} Transcript segments
   */
  async generateTranscript(frames, videoDuration) {
    try {
      logger.info('Generating transcript', {
        frameCount: frames.length,
        duration: videoDuration
      });

      const parts = [{
        text: `Generate a transcript for this Tower game video based on the visual frames.

        For each segment, provide:
        - startTime: When the segment starts (seconds)
        - endTime: When the segment ends (seconds)
        - text: Descriptive commentary of what's happening in the gameplay

        Make the commentary engaging and suitable for tutorial or gameplay videos.
        Duration: ${videoDuration}s`
      }];

      // Add frames
      frames.forEach(frame => {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: frame.data
          }
        });
        parts.push({
          text: `[${frame.timestamp.toFixed(1)}s]`
        });
      });

      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
            text: { type: Type.STRING }
          },
          required: ['startTime', 'endTime', 'text']
        }
      };

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });

      const transcript = JSON.parse(result.text);

      logger.info('Transcript generation complete', {
        segmentCount: transcript.length
      });

      return transcript;

    } catch (error) {
      logger.error('Error generating transcript', { error: error.message });
      throw new Error(`Failed to generate transcript: ${error.message}`);
    }
  }

  /**
   * Health check for Gemini API
   * @returns {Promise<boolean>} True if API is accessible
   */
  async healthCheck() {
    try {
      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: { parts: [{ text: 'Hello' }] }
      });

      return !!result.text;
    } catch (error) {
      logger.error('Gemini health check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = GeminiService;
