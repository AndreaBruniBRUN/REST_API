@echo off
cd /d D:\LOCCIONI\PROGETTI\REST_API
start /B /MIN npm start

:: Invia una notifica di sistema
powershell -Command "New-BurntToastNotification -Text 'Il server Node.js è stato avviato con successo.'"
