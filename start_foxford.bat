@echo off
title Foxford Smart Barista System - Spustenie
color 0B
echo ==========================================
echo   FOXFORD SMART BARISTA SYSTEM
echo ==========================================
echo.
echo Kontrolujem pripojenie a spustam vyvojovy server...
echo.

:: Sem zadaj cestu k priecinku, kde mas ulozeny projekt
:: Napriklad: cd /d C:\Users\Meno\Documents\foxford-app
cd /d "%~dp0"

:: Spustenie React aplikacie
npm start

if %errorlevel% neq 0 (
    echo.
    echo [CHYBA] Nepodarilo sa spustit aplikaciu. 
    echo Skontroluj, ci si v spravnom priecinku a ci mas nainstalovane moduly (npm install).
    pause
)