# Document Storage & AI Analysis Guide

## Storage Architecture

### Option 1: PostgreSQL + Railway Volume (Recommended)
Store documents in PostgreSQL with a Railway volume for file storage.

**Advantages:**
- Fast queries for AI analysis
- Structured metadata storage
- Easy backup and recovery
- Direct SQL queries for insights

**Implementation:**
```sql
-- Documents table (already in your schema)
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  fileName TEXT,
  fileType TEXT,
  content TEXT, -- Base64 or file path
  extractedData JSONB, -- AI extracted data
  metadata JSONB, -- Additional metadata
  analysis JSONB, -- AI analysis results
  createdAt TIMESTAMP
);

-- Document insights table
CREATE TABLE document_insights (
  id UUID PRIMARY KEY,
  documentId UUID REFERENCES documents(id),
  insightType TEXT, -- 'anomaly', 'trend', 'recommendation'
  insight JSONB,
  confidence FLOAT,
  createdAt TIMESTAMP
);
```

### Option 2: Hybrid Approach
- Metadata in PostgreSQL
- Files in Railway Volume
- Best for large documents

## AI Analysis Pipeline

### 1. Immediate Analysis (When document arrives)
```javascript
// In your MCP server
async function processDocument(doc) {
  // Extract data
  const extracted = await extractData(doc);
  
  // Generate insights
  const insights = await generateInsights(extracted);
  
  // Store in database
  await storeDocument({
    ...doc,
    extractedData: extracted,
    analysis: insights
  });
}
```

### 2. Batch Analysis (Scheduled)
```javascript
// Daily/Weekly analysis job
async function analyzeDocumentTrends() {
  const documents = await getDocuments({ 
    startDate: lastWeek,
    type: 'invoice' 
  });
  
  const trends = await analyzeTrends(documents);
  const predictions = await predictCashFlow(documents);
  
  return {
    trends,
    predictions,
    recommendations
  };
}
```

### 3. On-Demand Analysis
```javascript
// When user asks in AI chat
async function getDocumentInsights(query) {
  // "Show me spending trends for last month"
  const docs = await queryDocuments(query);
  const analysis = await runAIAnalysis(docs);
  
  return formatInsights(analysis);
}
```

## AI Insights Examples

### 1. **Invoice Analysis**
```json
{
  "summary": "45 invoices processed this month",
  "insights": {
    "totalAmount": 2500000,
    "averageProcessingTime": "2.5 days",
    "earlyPaymentSavings": 50000,
    "anomalies": [
      {
        "invoice": "INV-2025-045",
        "issue": "Amount 35% higher than average",
        "recommendation": "Verify line items"
      }
    ]
  }
}
```

### 2. **Vendor Performance**
```json
{
  "topVendors": [
    {
      "name": "Engineering Solutions Ltd",
      "invoiceCount": 12,
      "totalAmount": 500000,
      "averageDeliveryTime": "3 days",
      "qualityScore": 0.95
    }
  ],
  "recommendations": [
    "Consider bulk order with Engineering Solutions for 5% discount",
    "Review contract with Supplier B - frequent delays"
  ]
}
```

### 3. **Cash Flow Predictions**
```json
{
  "next30Days": {
    "expectedPayables": 1500000,
    "expectedReceivables": 2000000,
    "netCashFlow": 500000
  },
  "alerts": [
    "Large payment due on 15th - ensure liquidity"
  ]
}
```

## Setting Up Document Storage

### Step 1: Create Volume in Railway
```bash
# In Railway dashboard
1. Go to your backend-api service
2. Click "New Volume"
3. Name: "document-storage"
4. Mount Path: "/app/documents"
```

### Step 2: Update Backend API
```typescript
// apps/cloud-api/src/routes/documents.ts
import { saveFile, getFile } from '../utils/storage';

app.post('/api/documents', async (c) => {
  const { fileName, content, extractedData } = await c.req.json();
  
  // Save file to volume
  const filePath = await saveFile(fileName, content);
  
  // Save metadata to database
  const doc = await prisma.document.create({
    data: {
      fileName,
      filePath,
      extractedData,
      status: 'stored'
    }
  });
  
  // Run AI analysis
  const insights = await analyzeDocument(doc);
  
  return c.json({ doc, insights });
});
```

### Step 3: Enable AI Analysis
```typescript
// AI analysis function
async function analyzeDocument(doc) {
  // Pattern detection
  const patterns = await detectPatterns(doc.extractedData);
  
  // Anomaly detection
  const anomalies = await detectAnomalies(doc);
  
  // Generate recommendations
  const recommendations = await generateRecommendations(doc);
  
  return {
    patterns,
    anomalies,
    recommendations,
    confidence: 0.95
  };
}
```

## Query Examples for AI Chat

1. **Document Search**
   - "Show me all invoices from last month"
   - "Find purchase orders over ₹1 lakh"
   - "List pending documents"

2. **Analytics**
   - "What's our average invoice processing time?"
   - "Show vendor performance metrics"
   - "Analyze spending trends"

3. **Predictions**
   - "Predict cash flow for next month"
   - "When should we pay invoices for maximum discount?"
   - "Alert me about unusual transactions"

## Best Practices

1. **Storage**
   - Store original files in volume
   - Keep extracted data in PostgreSQL
   - Index JSONB fields for fast queries

2. **AI Processing**
   - Process documents asynchronously
   - Cache frequent analyses
   - Update insights periodically

3. **Security**
   - Encrypt sensitive documents
   - Implement access controls
   - Audit document access

## Next Steps

1. Mount the Railway volume to backend-api
2. Implement document storage endpoints
3. Add AI analysis functions
4. Update frontend to show insights
5. Create scheduled analysis jobs