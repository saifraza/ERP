# RFQ Email Workflow Test Guide

## Complete RFQ to PO Workflow via Email

### Prerequisites
1. Login to ERP: https://frontend-production-adfe.up.railway.app
   - Username: saif
   - Password: 1234

2. Ensure Gmail is connected:
   - Go to Settings → Email Settings
   - Your company email should be linked

### Step 1: Create Purchase Requisition
1. Navigate to **Procurement → Purchase Requisitions**
2. Click **Create New PR**
3. Fill in:
   - Division: Select a division
   - Department: Select department
   - Add items with quantities
4. Click **Submit for Approval**

### Step 2: Approve PR (if you have approval rights)
1. Go to **Procurement → Pending Approvals**
2. Find your PR and click **Approve**

### Step 3: Convert PR to RFQ
1. Go back to **Purchase Requisitions**
2. Click on your approved PR
3. Click **Convert to RFQ**
4. Select vendors (at least 2-3 for testing)
5. Set submission deadline
6. Add delivery and payment terms
7. Click **Create RFQ**

### Step 4: Send RFQ to Vendors
1. Navigate to **Procurement → RFQ Management**
2. Click on your RFQ
3. Click **Send to Vendors** button
4. Verify emails are sent:
   - Check **Email History** button
   - You'll see sent emails with status

### Step 5: Monitor Vendor Responses
1. In RFQ Detail page, click **Email History**
2. You'll see:
   - Which vendors received emails
   - Email sent timestamps
   - Response status for each vendor

### Step 6: Process Vendor Email Responses
1. Click **Process New Emails** button in Email History
2. System will:
   - Fetch unread emails from vendors
   - Extract quotation data using AI
   - Create quotations automatically
   - Send acknowledgments to vendors

### Step 7: Compare Quotations
1. Once responses are received, click **Compare Quotations** button
2. You'll see:
   - Overall price comparison
   - Item-wise price comparison
   - Vendor ratings and delivery terms
3. Select best vendors for each item
4. Click **Save Selection**

### Step 8: Generate Purchase Order
1. After vendor selection, system can generate PO
2. PO will include selected vendors and items
3. Send PO to vendors via email

## Email Automation Features

### Automatic Processing
- **Quotation Extraction**: AI extracts pricing, terms, and item details
- **Smart Classification**: Identifies email types (quotation, invoice, etc.)
- **Auto-Acknowledgment**: Sends confirmation to vendors
- **Status Updates**: Tracks email delivery and responses

### Manual Interventions
- **Send Reminders**: For vendors who haven't responded
- **Resend RFQ**: To specific vendors if needed
- **Review Pending**: For emails that need manual review

## Testing Tips

### 1. Test with Real Vendor Emails
- Use actual vendor email addresses
- They'll receive professional RFQ PDFs
- Their replies will be auto-processed

### 2. Test Email Response Processing
- Go to **Email & AI Hub** (`/mails`)
- Look for vendor responses
- Click **Process Emails** to trigger automation

### 3. Check Email Logs
- All email communications are logged
- View in RFQ Email History
- Track open rates and responses

### 4. Vendor Response Simulation
If you don't have real vendor emails:
1. Send test emails to your RFQ email address
2. Include RFQ number in subject
3. Add pricing details in email body
4. System will process as vendor response

## Common Issues & Solutions

### Emails Not Sending
- Check Gmail connection in Settings
- Verify vendor email addresses
- Check for send errors in Email History

### Responses Not Processing
- Ensure emails contain RFQ number
- Check if vendor email is registered
- Look for processing errors in logs

### Quotations Not Creating
- Verify email has pricing information
- Check AI extraction results
- Review pending emails for manual processing

## Key Features Implemented

✅ **Email Tracking**
- Complete audit trail
- Delivery confirmations
- Response tracking

✅ **Vendor Communication**
- Professional RFQ PDFs
- Automated reminders
- Response acknowledgments

✅ **AI Processing**
- Quotation data extraction
- Smart email classification
- Confidence scoring

✅ **Comparison Tools**
- Price comparison matrix
- Vendor rating integration
- Multi-criteria selection

✅ **Workflow Automation**
- PR → RFQ → Email → Quotation → PO
- Minimal manual intervention
- Real-time status updates