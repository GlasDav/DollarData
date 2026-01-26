# Start the DollarData Backend Server
$ErrorActionPreference = "Stop"

# Ensure we are in the project root
Set-Location "$PSScriptRoot"

Write-Host "Starting DollarData Backend..." -ForegroundColor Green

# Run uvicorn using the virtual environment's python
# Running as module 'backend.main' to resolve relative imports
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
