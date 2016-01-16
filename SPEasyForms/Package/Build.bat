@echo off
set ConfigurationName=%1
if [%ConfigurationName%] equ [] set ConfigurationName=Debug
copy ..\Elements\SPEasyFormsScriptLinks.%ConfigurationName%.xml ..\Elements\SPEasyFormsScriptLinks.xml
"%WINDIR%\SysNative\WindowsPowerShell\v1.0\powershell.exe" -File CreateVerboseSettingsPage.ps1
makecab /f Package.ddf
