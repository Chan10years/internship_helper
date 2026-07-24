param(
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupRoot = Join-Path $projectRoot "backups"
if (-not (Test-Path -LiteralPath $backupRoot)) {
  New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

if (-not $OutputPath) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputPath = Join-Path $backupRoot "internship-helper-$timestamp.dump"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath = Join-Path $projectRoot $OutputPath
}

$fullOutput = [System.IO.Path]::GetFullPath($OutputPath)
$resolvedBackupRoot = [System.IO.Path]::GetFullPath($backupRoot) + [System.IO.Path]::DirectorySeparatorChar
if (-not $fullOutput.StartsWith($resolvedBackupRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup output must stay inside $backupRoot"
}

$partialOutput = "$fullOutput.partial"
$process = Start-Process -FilePath "docker" -ArgumentList @(
  "compose", "exec", "-T", "postgres",
  "pg_dump", "-U", "internship_app", "-d", "internship_helper",
  "--format=custom", "--no-owner", "--no-acl"
) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $partialOutput

if ($process.ExitCode -ne 0) {
  throw "Database backup failed with exit code $($process.ExitCode). Partial file: $partialOutput"
}

Move-Item -LiteralPath $partialOutput -Destination $fullOutput
Write-Output "Backup created: $fullOutput"
