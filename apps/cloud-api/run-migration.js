const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/add_email_credential.sql'), 
      'utf8'
    );

    // Use the Railway API endpoint to run migrations
    const response = await fetch('https://backend-api-production-5e68.up.railway.app/api/run-migrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Migration result:', result);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();