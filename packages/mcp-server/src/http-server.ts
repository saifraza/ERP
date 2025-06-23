import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MCP Gmail Server HTTP Bridge',
    timestamp: new Date().toISOString(),
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN ? 'configured' : 'missing'
    },
    environment: process.env.RAILWAY_ENVIRONMENT || 'development'
  });
});

// Test Gmail connection
app.get('/test', async (req, res) => {
  try {
    const mcpPath = path.join(__dirname, '../build/index.js');
    
    // Spawn MCP server process
    const mcp = spawn('node', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let output = '';
    let error = '';

    mcp.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcp.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Send a test request
    const testRequest = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }) + '\n';

    mcp.stdin.write(testRequest);

    // Wait for response
    setTimeout(() => {
      mcp.kill();
      res.json({
        success: true,
        output,
        error,
        message: 'MCP server test completed'
      });
    }, 2000);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute MCP tool via HTTP
app.post('/execute', async (req, res) => {
  try {
    const { tool, args } = req.body;
    
    // For now, return a message about MCP protocol
    res.json({
      success: false,
      message: 'Direct MCP execution not available via HTTP',
      suggestion: 'Use the AI chat interface which can call MCP tools',
      tool,
      args
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP HTTP Bridge running on port ${PORT}`);
  console.log('OAuth configured:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('Environment:', process.env.RAILWAY_ENVIRONMENT || 'development');
});