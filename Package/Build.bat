@echo off
set ConfigurationName=%1
if [%ConfigurationName%] equ [] set ConfigurationName=Debug
copy ..\Elements\SPEasyFormsScriptLinks.%ConfigurationName%.xml ..\Elements\SPEasyFormsScriptLinks.xml
makecab /f Package.ddf
