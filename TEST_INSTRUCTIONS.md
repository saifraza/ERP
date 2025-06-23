# Testing Instructions

## QUICKEST WAY TO GET TO ERP (Development Only):

Just navigate to: **http://localhost:3000/dev**

This will:
1. Auto-login as Saif
2. Create demo company if needed
3. Redirect to main ERP dashboard

---

## Debug Info Box

When running in development mode, you'll see a debug info box in the bottom-right corner showing:
- Authentication status
- Setup completion status
- List of all companies
- Current selected company/factory

Use the buttons to:
- **Log to Console**: See detailed state info
- **Reset All**: Clear all data and start fresh

---

## To See Your Company After Setup:

1. Look at the debug box - it should show all companies
2. Click on the company selector at the top (shows current company name)
3. You should see all companies listed there
4. Select your new company/factory from the dropdown

If you only see the demo company:
1. Click "Log to Console" in the debug box
2. Check the browser console for what's stored
3. The setup might not have saved properly

## If Setup Fails:

1. Open browser console (F12) BEFORE clicking submit
2. Go through the setup wizard
3. When you get the error, check console for:
   - "Starting setup submission..."
   - "Company Data:", should show your company info
   - "Factories:", should show your factories
   - "Master Data Template:", should show selected template
   - Any error messages

Common issues:
- Missing required fields (check console for "is missing" errors)
- Browser blocking localStorage (check privacy settings)
- Data validation errors

To manually fix:
1. Click "Reset All" in debug box
2. Try again with /dev route for quick setup
3. Or manually create company in console:
```javascript
const company = {
  id: crypto.randomUUID(),
  code: 'COMP001',
  name: 'Your Company Name',
  // ... add other required fields
}
localStorage.setItem('erp-companies', JSON.stringify([company]))
location.reload()
```

---

## Fixed Issues:

1. **Login Autofill**: Click on the blue dev credentials box to autofill username/password
2. **Company Setup**: "Skip Setup (Dev Mode)" now properly saves data and reloads
3. **Backend Testing**: New test page to verify backend/database connectivity

## How to Test:

### 1. Test Login and Setup:
```bash
# Clear everything first
# Open browser console (F12) and run:
localStorage.clear()

# Then refresh and:
1. Click the blue dev credentials box (it will autofill saif/1234)
2. Click "Sign in"
3. You'll be redirected to setup page
4. Click "Skip Setup (Dev Mode)" button at top right
5. Page will reload and you should see the main ERP dashboard
```

### 2. Test Backend Connection:
```bash
# After logging in:
1. Look for "Test Backend" in the sidebar (bottom)
2. Click it to open the test page
3. Click "Run Tests" button
4. You'll see results for:
   - API Health Check
   - Database Connection
   - Authentication
   - Company Setup Save
   - Load Companies
```

### 3. Manual Company Setup:
If you want to test the full setup wizard:
1. Clear localStorage again
2. Login with saif/1234
3. Go through the 4-step wizard
4. Use the demo data from DEMO_DATA.md file

## Debugging:

Open browser console (F12) to see debug logs:
- Company loading logs
- Setup status checks
- Any errors

## If Still Stuck on Setup:

1. Open console and check:
```javascript
// See what's in localStorage
console.log(localStorage.getItem('erp-companies'))

// Clear and try again
localStorage.clear()
location.reload()
```

2. The "Skip Setup (Dev Mode)" button now:
   - Creates a complete demo company with all required fields
   - Saves to localStorage
   - Forces a page reload to refresh all states

## Backend API Routes:

The system expects these backend routes:
- POST `/api/auth/login` - Login endpoint
- GET `/api/health` - Health check
- GET `/api/setup/db-status` - Database status
- GET `/api/auth/verify` - Token verification
- POST `/api/setup/complete` - Save company setup
- GET `/api/setup/companies` - Load companies

For development, the system works offline using localStorage.