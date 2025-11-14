# API Test Script for SmaRTC

$baseUrl = "http://localhost"
$verbose = $true

function Write-Log {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    if ($verbose) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [object]$Headers = $null,
        [int[]]$ExpectedStatusCodes
    )

    Write-Log "-------------------------------------------" -Color Cyan
    Write-Log "🧪 TESTING: $Name" -Color Cyan
    Write-Log "URL: $Url"
    Write-Log "Method: $Method"

    try {
        $params = @{
            Uri    = $Url
            Method = $Method
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 5)
            $params.ContentType = "application/json"
            Write-Log "Body: $($params.Body)"
        }
        if ($Headers) {
            $params.Headers = $Headers
            Write-Log "Headers: $($Headers | Format-List | Out-String)"
        }

        $response = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = $response.StatusCode
        $content = $response.Content
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            $reader.Close()
            $stream.Close()
        } else {
            $statusCode = -1 # Or 0, or some other indicator of connection failure
            $content = $_.Exception.Message
        }
    }

    Write-Log "Status Code: $statusCode"
    if ($content) {
        Write-Log "Response: $content"
    }

    if ($ExpectedStatusCodes -contains $statusCode) {
        Write-Log "✅ PASSED: Expected status code $statusCode" -Color Green
        return $content | ConvertFrom-Json -ErrorAction SilentlyContinue
    }
    else {
        Write-Log "❌ FAILED: Expected status code(s) $($ExpectedStatusCodes -join ', ') but got $statusCode" -Color Red
        # Exit the script on first failure
        exit 1
    }
}

# --- Test Execution ---

# 1. Health Check (WeatherForecast)
Test-Endpoint -Name "Get WeatherForecast" -Url "$baseUrl/weatherforecast" -ExpectedStatusCodes 200

# 2. Register User
$userCreds = @{
    Username = "testuser" + (Get-Random)
    Password = "Password123!"
    Email    = "user" + (Get-Random) + "@example.com"
    Role     = "User"
}
$registerResult = Test-Endpoint -Name "Register User" -Url "$baseUrl/api/Auth/register" -Method POST -Body $userCreds -ExpectedStatusCodes 200

# 3. Login User
$loginResult = Test-Endpoint -Name "Login User" -Url "$baseUrl/api/Auth/login" -Method POST -Body $userCreds -ExpectedStatusCodes 200
$userToken = $loginResult.token
if (-not $userToken) {
    Write-Log "❌ FAILED: Did not receive token on login." -Color Red
    exit 1
}
Write-Log "User Token acquired." -Color Yellow
$userAuthHeader = @{ "Authorization" = "Bearer $userToken" }

# 4. Register Admin
$adminCreds = @{
    Username = "testadmin" + (Get-Random)
    Password = "Password123!"
    Email    = "admin" + (Get-Random) + "@example.com"
    Role     = "Admin"
}
Test-Endpoint -Name "Register Admin" -Url "$baseUrl/api/Auth/register" -Method POST -Body $adminCreds -ExpectedStatusCodes 200

# 5. Login Admin
$adminLoginResult = Test-Endpoint -Name "Login Admin" -Url "$baseUrl/api/Auth/login" -Method POST -Body $adminCreds -ExpectedStatusCodes 200
$adminToken = $adminLoginResult.token
if (-not $adminToken) {
    Write-Log "❌ FAILED: Did not receive admin token on login." -Color Red
    exit 1
}
Write-Log "Admin Token acquired." -Color Yellow
$adminAuthHeader = @{ "Authorization" = "Bearer $adminToken" }


# 6. Admin Endpoint Access
Test-Endpoint -Name "Get Users (Admin, Unauthorized)" -Url "$baseUrl/api/Admin/users" -Headers $userAuthHeader -ExpectedStatusCodes 403 # Forbidden
Test-Endpoint -Name "Get Users (Admin, Authorized)" -Url "$baseUrl/api/Admin/users" -Headers $adminAuthHeader -ExpectedStatusCodes 200

# 7. Session Management
$sessionBody = @{
    Name        = "Test Session " + (Get-Random)
    Description = "A test session for automated testing."
}
$session = Test-Endpoint -Name "Create Session" -Url "$baseUrl/api/Session" -Method POST -Body $sessionBody -Headers $userAuthHeader -ExpectedStatusCodes 200
$sessionId = $session.id

Test-Endpoint -Name "Get All Sessions" -Url "$baseUrl/api/Session" -Headers $userAuthHeader -ExpectedStatusCodes 200
Test-Endpoint -Name "Get Session by ID" -Url "$baseUrl/api/Session/$sessionId" -Headers $userAuthHeader -ExpectedStatusCodes 200

# 8. Participant Management
$participant = Test-Endpoint -Name "Join Session" -Url "$baseUrl/api/Session/$sessionId/participants" -Method POST -Headers $userAuthHeader -ExpectedStatusCodes 200
$participantId = $participant.id

Test-Endpoint -Name "Leave Session" -Url "$baseUrl/api/Session/$sessionId/participants/$participantId" -Method DELETE -Headers $userAuthHeader -ExpectedStatusCodes 204

# 9. Delete Session
Test-Endpoint -Name "Delete Session" -Url "$baseUrl/api/Session/$sessionId" -Method DELETE -Headers $userAuthHeader -ExpectedStatusCodes 204

# 10. WebRTC
Test-Endpoint -Name "Get ICE Servers" -Url "$baseUrl/api/WebRTC/ice-servers" -Headers $userAuthHeader -ExpectedStatusCodes 200


Write-Log "===========================================" -Color Green
Write-Log "✅ ALL TESTS PASSED SUCCESSFULLY!" -Color Green
Write-Log "===========================================" -Color Green
