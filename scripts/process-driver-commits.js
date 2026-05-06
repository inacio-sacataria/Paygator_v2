require('dotenv').config();

const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const apiKey = process.env.API_KEY || process.env.PLAYFOOD_API_KEY;

if (!apiKey) {
  console.error('Missing API key. Define API_KEY or PLAYFOOD_API_KEY.');
  process.exit(1);
}

const url = `${baseUrl}/api/v1/driver-checkout/process-pending-commits`;

fetch(url, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  },
})
  .then(async (response) => {
    const body = await response.text();
    console.log(`[driver-commit-cron] ${response.status} ${response.statusText}`);
    console.log(body);
    if (!response.ok) process.exit(1);
  })
  .catch((error) => {
    console.error('[driver-commit-cron] request failed:', error.message);
    process.exit(1);
  });
