Write-Host "Starting SkillSprint Full Stack Application..." -ForegroundColor Cyan

# Start Backend API in a new window
Start-Process powershell -ArgumentList "-NoExit -Command `"cd d:\Dev\habit\backend; .\venv\Scripts\Activate.ps1; `$env:FLASK_APP='app.py'; flask run`""

# Start Cron Job Worker in a new window
Start-Process powershell -ArgumentList "-NoExit -Command `"cd d:\Dev\habit\backend; .\venv\Scripts\Activate.ps1; python cron.py`""

# Start Frontend in current window
Write-Host "Starting Vite frontend server... (Press Ctrl+C to stop this window)" -ForegroundColor Green
cd d:\Dev\habit\frontend
npm run dev
