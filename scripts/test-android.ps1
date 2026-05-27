# Start Android emulator and run the app for local testing.
# Run before committing to a release build.
# Usage: npm run test:android

$ADB          = "C:\Users\StevenPower\Android\Sdk\platform-tools\adb.exe"
$EMULATOR     = "C:\Users\StevenPower\Android\Sdk\emulator\emulator.exe"
$AVD_NAME     = "Pixel_10_API_36"
$BUILD_DIR    = "C:\PN"
$JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$ANDROID_HOME = "C:\Users\StevenPower\Android\Sdk"

# Verify short-path junction exists
if (-not (Test-Path $BUILD_DIR)) {
    Write-Error @"
C:\PN junction not found. Create it once (run as admin):
  cmd /c mklink /J C:\PN "C:\Users\StevenPower\OneDrive - Steven Power\OneDrive\Documents\POWR DATA\GitHub\Project_Niobe"
"@
    exit 1
}

# Check if emulator is already running (must be "device", not "offline")
$running = & $ADB devices 2>$null | Select-String "emulator-\d+\s+device$"
if ($running) {
    Write-Host "Emulator already running." -ForegroundColor Green
} else {
    Write-Host "Starting emulator ($AVD_NAME)..." -ForegroundColor Cyan
    Start-Process -FilePath $EMULATOR -ArgumentList "-avd", $AVD_NAME, "-no-snapshot-load" -WindowStyle Minimized

    Write-Host "Waiting for emulator to boot (this takes ~60s)..." -ForegroundColor Cyan
    $timeout = 180
    $elapsed = 0
    $booted  = $false

    while (-not $booted) {
        Start-Sleep -Seconds 5
        $elapsed += 5

        if ($elapsed -ge $timeout) {
            Write-Host "Emulator did not boot within $timeout seconds." -ForegroundColor Red
            exit 1
        }

        # Suppress all errors from adb — device is offline during early boot
        try {
            $prop = & $ADB shell getprop sys.boot_completed 2>$null
            if ($prop -match "1") { $booted = $true }
        } catch {}
    }

    Write-Host "Emulator booted." -ForegroundColor Green
}

# Run the app
Write-Host "Building and launching app on emulator..." -ForegroundColor Cyan
$env:JAVA_HOME    = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME

Set-Location $BUILD_DIR
npx expo run:android
exit $LASTEXITCODE
