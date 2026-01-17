/**
 * PayloadCMS Server Entry Point
 * 
 * Initializes and starts the PayloadCMS backend server with Express.
 * Handles admin UI, REST API, and custom routes.
 */

import dotenv from 'dotenv'
import express from 'express'
import payload from 'payload'
import { logger } from './utils/logger.js'
import config from './payload.config.js'

// Load environment variables FIRST
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Initialize Payload
const start = async () => {
  try {
    logger.info('Starting PayloadCMS server...', {port: PORT, secret: process.env.PAYLOAD_SECRET ? 'present' : 'missing' })

    // Initialize PayloadCMS
    await payload.init({
      config,
      express: app,
      onInit: async () => {
        logger.info('PayloadCMS initialized successfully', {
          adminURL: payload.getAdminURL(),
          apiURL: `${payload.getAdminURL()}/api`,
        })
      },
    })

    // Add custom health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'curatekids-payloadcms',
      })
    })

    // Add custom status endpoint
    app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        version: '1.0.0',
        collections: payload.config.collections.length,
      })
    })

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Server error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      })
      
      res.status(err.statusCode || 500).json({
        error: err.message || 'Internal Server Error',
      })
    })

    // Start Express server
    app.listen(PORT, () => {
      logger.info('Server started successfully', {
        url: `http://localhost:${PORT}`,
        adminURL: payload.getAdminURL(),
        apiURL: `${payload.getAdminURL()}/api`,
      })
    })
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Start the server
start()
