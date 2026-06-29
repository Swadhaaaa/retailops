$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$activateScript = Join-Path $workspaceRoot "backend\venv\Scripts\Activate.ps1"

Set-Location $workspaceRoot

if (Test-Path $activateScript) {
    & $activateScript
} else {
    Write-Warning "QMS virtual environment was not found at: $activateScript"
}
