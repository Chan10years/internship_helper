param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmRestore) {
  throw "Restore replaces current database objects. Re-run with -ConfirmRestore after confirming the target and backup."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$fullBackup = if ([System.IO.Path]::IsPathRooted($BackupPath)) {
  [System.IO.Path]::GetFullPath($BackupPath)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $projectRoot $BackupPath))
}
if (-not (Test-Path -LiteralPath $fullBackup -PathType Leaf)) {
  throw "Backup file not found: $fullBackup"
}

$process = Start-Process -FilePath "docker" -ArgumentList @(
  "compose", "exec", "-T", "postgres",
  "pg_restore", "-U", "internship_app", "-d", "internship_helper",
  "--clean", "--if-exists", "--no-owner", "--no-acl"
) -NoNewWindow -Wait -PassThru -RedirectStandardInput $fullBackup

if ($process.ExitCode -ne 0) {
  throw "Database restore failed with exit code $($process.ExitCode). Stop and inspect before retrying."
}

Write-Output "Restore completed. Run npm.cmd run db:verify before starting the application."
