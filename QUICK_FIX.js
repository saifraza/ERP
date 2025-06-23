// Run this entire script in Chrome DevTools Console

// Step 1: Clear everything
console.log('Clearing all storage...');
localStorage.clear();
sessionStorage.clear();

// Step 2: Login properly
async function properLogin() {
  console.log('Logging in...');
  
  // Login
  const loginResponse = await fetch('https://cloud-api-production-0f4d.up.railway.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'saif@erp.com', password: '1234' })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login successful:', loginData.user.email);
  
  // CRITICAL: Store token in localStorage
  localStorage.setItem('token', loginData.token);
  
  // Store auth state
  localStorage.setItem('auth-storage', JSON.stringify({
    state: {
      user: loginData.user,
      token: loginData.token,
      isAuthenticated: true
    },
    version: 0
  }));
  
  // Fetch companies with the token
  console.log('Fetching companies...');
  const companiesResponse = await fetch('https://cloud-api-production-0f4d.up.railway.app/api/companies', {
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  
  const companiesData = await companiesResponse.json();
  console.log('Companies found:', companiesData.companies.length);
  
  // Store companies
  localStorage.setItem('erp-companies', JSON.stringify(companiesData.companies));
  
  // Store company state
  const company = companiesData.companies[0];
  const factory = company.factories[0];
  
  localStorage.setItem('company-storage', JSON.stringify({
    state: {
      currentCompany: company,
      currentFactory: factory
    },
    version: 0
  }));
  
  console.log('Setup complete! Reloading...');
  
  // Reload the page
  setTimeout(() => {
    location.reload();
  }, 1000);
}

// Run it
properLogin().catch(console.error);