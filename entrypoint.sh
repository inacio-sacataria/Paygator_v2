#!/bin/sh

if [ ! -f /app/api_key.txt ]; then
  node -e "const fs = require('fs'); const key = 'main_' + require('crypto').randomBytes(32).toString('hex'); fs.writeFileSync('/app/api_key.txt', key); console.log('API Key gerada:', key)"
else
  echo "API Key já gerada:"
  cat /app/api_key.txt
fi

exec npm start 