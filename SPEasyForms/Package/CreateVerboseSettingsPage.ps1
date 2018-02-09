$settingsPage = Get-Content ..\Elements\SPEasyFormsAssets\Pages\SPEasyFormsSettingsVerbose.aspx
$settingsPage = $settingsPage.Replace("<!-- RELEASE_START", "<!-- RELEASE_START -->")
$settingsPage = $settingsPage.Replace("RELEASE_END -->", "<!-- RELEASE_END -->")
$settingsPage = $settingsPage.Replace("<!-- DEBUG_START -->", "<!-- DEBUG_START")
$settingsPage = $settingsPage.Replace("<!-- DEBUG_END -->", "DEBUG_END -->")
$settingsPage | Out-File -FilePath ..\Elements\SPEasyFormsAssets\Pages\SPEasyFormsSettings.aspx
Write-Host "Updated ..\Elements\SPEasyFormsAssets\Pages\SPEasyFormsSettings.aspx"
