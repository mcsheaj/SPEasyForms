SPEasyForms is a no code sandbox solution for Office 365, and 
SharePoint 2013 and 2010. It was developed using Visual Studio Ultimate
(Update 3), but Visual Studio is not required to build it (with the
folowing caveats).

The build is just a batch file in the Package directory called 
Build.bat. Build.bat requires makecab.exe to be on the system and
in the PATH (this is true by default on most modern Windows systems).
If you just double click Build.bat, it will build the Debug solution
(javascript is not bundled or minified).

Build.bat takes one optional argument, a ConfigurationName, which it
expects to be either Debug or Release. It then packages the wsp with
the appropriate ScriptLinks.xml to load either the individual javascript
modules or the bundled/minifed version. Building the solution in 
Visual Studio calls Build.bat and passes the ConfigurationName so the
Debug and Release builds do what one would expect automatically.

Note: the only real dependency on Visual Studio, and Web Essentials for
Visual Studio, is that the release build loads a bundled/minified 
version of the JavaScript from 
SPEasyFormsAssets/JavaScript/jquery.SPEasyForms.min.js, which Web
Essentials updates automatically whenever one of the non-minified 
javascript files is updated in Visual Studio. If you want to make 
changes and build the project, and you don't want to use or don't
have Visual Studio, updating the minified bundle is now your problem.
If you only want to play around and deploy debug builds, you can
ignore this.
