# Network Diagnostics for Einkaufsliste App
Write-Host "=== Network Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# 1. Get all local IP addresses
Write-Host "1. Local IP Addresses:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | ForEach-Object {
    Write-Host "   - $($_.IPAddress) ($($_.InterfaceAlias))" -ForegroundColor Green
}
Write-Host ""

# 2. Check if port 8000 is listening
Write-Host "2. Port 8000 Status:" -ForegroundColor Yellow
$listening = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "   OK Port 8000 is LISTENING" -ForegroundColor Green
    $listening | ForEach-Object {
        Write-Host "   - Local Address: $($_.LocalAddress):$($_.LocalPort)" -ForegroundColor Green
    }
} else {
    Write-Host "   ERROR Port 8000 is NOT listening!" -ForegroundColor Red
    Write-Host "   Start the server first with: .\start-server.ps1" -ForegroundColor Yellow
}
Write-Host ""

# 3. Check Windows Firewall rules for port 8000
Write-Host "3. Windows Firewall Rules for Port 8000:" -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object {
    $_.Enabled -eq $true -and
    ($_.DisplayName -like "*8000*" -or $_.DisplayName -like "*Python*" -or $_.DisplayName -like "*uvicorn*")
} | Select-Object DisplayName, Direction, Action, Enabled

if ($firewallRules.Count -gt 0) {
    $firewallRules | ForEach-Object {
        $color = if ($_.Action -eq "Allow") { "Green" } else { "Red" }
        Write-Host "   - $($_.DisplayName) [$($_.Direction)] [$($_.Action)]" -ForegroundColor $color
    }
} else {
    Write-Host "   ! No explicit firewall rules found for port 8000" -ForegroundColor Yellow
    Write-Host "   You may need to add a firewall rule to allow incoming connections" -ForegroundColor Yellow
}
Write-Host ""

# 4. Suggest connection URLs for iPad
Write-Host "4. Connection URLs for iPad:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | ForEach-Object {
    $ip = $_.IPAddress
    Write-Host "   http://$ip:8000" -ForegroundColor Cyan
}
Write-Host ""

# 5. Test local connection
Write-Host "5. Testing Local Connection:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/version" -UseBasicParsing -TimeoutSec 5
    Write-Host "   OK Server is responding locally" -ForegroundColor Green
    Write-Host "   - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Server is NOT responding locally!" -ForegroundColor Red
    Write-Host "   - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Firewall recommendations
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To allow iPad connections, run this command in PowerShell (as Administrator):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   New-NetFirewallRule -DisplayName 'Einkaufsliste Port 8000' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow" -ForegroundColor White
Write-Host ""
Write-Host "On iPad Safari, navigate to one of the IPs shown above" -ForegroundColor Yellow
Write-Host ""
