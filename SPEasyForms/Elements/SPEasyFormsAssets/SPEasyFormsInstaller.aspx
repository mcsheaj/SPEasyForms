<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    SPEasyForms Installer
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderAdditionalPageHead' runat='server'>
    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style type="text/css">
        .settingsheader {
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.8em;
            color: darkslategray;
            margin-bottom: 20px;
        }

        .ms-status-yellow {
            display: none !important;
        }

        .scriptLinksdiv {
            margin-top: 20px;
            margin-bottom: 30px;
        }

        label {
            display: inline-block;
            width: 5em;
        }

        .buttun-div {
            text-align: right;
            width: 700px;
        }

        button.settings-button {
            font-size: 1em;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderMiniConsole' runat='server'>
    <SharePoint:FormComponent TemplateName='WikiMiniConsole' ControlMode='Display' runat='server' id='WikiMiniConsole'></SharePoint:FormComponent>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderLeftActions' runat='server'>
    <SharePoint:RecentChangesMenu runat='server' id='RecentChanges'></SharePoint:RecentChangesMenu>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderMain' runat='server'>
    <div id='buttonAction' style='display: none'>&lt;Elements xmlns=&quot;http://schemas.microsoft.com/sharepoint/&quot;&gt;
    &lt;CustomAction
        Location=&quot;CommandUI.Ribbon&quot;
        Id=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Action&quot;
        RegistrationType=&quot;ContentType&quot;
        RegistrationId=&quot;0x01&quot;
        Sequence=&quot;10256&quot;
        Rights=&quot;ManageLists&quot;
    &gt;
        &lt;CommandUIExtension&gt;
            &lt;CommandUIDefinitions&gt;
                &lt;CommandUIDefinition  Location=&quot;Ribbon.List.Settings.Controls._children&quot;&gt;
                    &lt;Button
                        LabelText=&quot;SPEasyForms&quot;
                        Alt=&quot;SPEasyForms Settings&quot;
                        ToolTipTitle=&quot;SPEasyForms Settings&quot;
                        ToolTipDescription=&quot;Settings page for configuring this list for SPEasyForms.&quot;
                        Id=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Button&quot;
                        Command=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Command&quot;
                        Image32by32=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms32x32.png&quot;
                        Image16by16=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms16x16.png&quot;
                        Sequence=&quot;10256&quot;
                        TemplateAlias=&quot;o1&quot;
                      /&gt;
                &lt;/CommandUIDefinition&gt;
                &lt;CommandUIDefinition  Location=&quot;Ribbon.Library.Settings.Controls._children&quot;&gt;
                    &lt;Button
                        LabelText=&quot;SPEasyForms&quot;
                        Alt=&quot;SPEasyForms Settings&quot;
                        ToolTipTitle=&quot;SPEasyForms Settings&quot;
                        ToolTipDescription=&quot;Settings page for configuring this list for SPEasyForms.&quot;
                        Id=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Button&quot;
                        Command=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Command&quot;
                        Image32by32=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms32x32.png&quot;
                        Image16by16=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms16x16.png&quot;
                        Sequence=&quot;10256&quot;
                        TemplateAlias=&quot;o1&quot;
                      /&gt;
                &lt;/CommandUIDefinition&gt;
                &lt;CommandUIDefinition  Location=&quot;Ribbon.Calendar.Calendar.Settings.Controls._children&quot;&gt;
                    &lt;Button
                        LabelText=&quot;SPEasyForms&quot;
                        Alt=&quot;SPEasyForms Settings&quot;
                        ToolTipTitle=&quot;SPEasyForms Settings&quot;
                        ToolTipDescription=&quot;Settings page for configuring this list for SPEasyForms.&quot;
                        Id=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Button&quot;
                        Command=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Command&quot;
                        Image32by32=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms32x32.png&quot;
                        Image16by16=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/Css/images/SPEasyForms16x16.png&quot;
                        Sequence=&quot;10256&quot;
                        TemplateAlias=&quot;o1&quot;
                      /&gt;
                &lt;/CommandUIDefinition&gt;
            &lt;/CommandUIDefinitions&gt;
            &lt;CommandUIHandlers&gt;
                &lt;CommandUIHandler
                    Command=&quot;Ribbon.List.Settings.Controls.SPEasyForms.Command&quot;
                    CommandAction=&quot;javascript:goToSettingsPage();
                    function goToSettingsPage() {
                        var page = &apos;/Style Library/SPEasyFormsAssets/2018.02/Pages/SPEasyFormsSettings.aspx?&apos;;
                        if(spefjQuery.spEasyForms.defaults.verbose) {
                            page = &apos;/Style Library/SPEasyFormsAssets/2018.02/Pages/SPEasyFormsSettingsVerbose.aspx?&apos;;
                            page += &apos;spEasyFormsVerbose=true&amp;amp;&apos;;
                        }
                        if(_spPageContextInfo.siteServerRelativeUrl != &apos;/&apos;) {
                            page = _spPageContextInfo.siteServerRelativeUrl + page;
                        }
                        page += &apos;ListId={ListId}&amp;amp;SiteUrl={SiteUrl}&amp;amp;Source=&apos; + encodeURIComponent(window.location.href);
                        window.location=(page);
                    }&quot;
                    EnabledScript=&quot;javascript:shouldSPEasyFormsRibbonButtonBeEnabled();&quot;
                 /&gt;
            &lt;/CommandUIHandlers&gt;
        &lt;/CommandUIExtension&gt;
    &lt;/CustomAction&gt;
&lt;/Elements&gt;
    </div>
    <div id='scriptLinksRelease'  style='display: none'>&lt;Elements xmlns=&quot;http://schemas.microsoft.com/sharepoint/&quot;&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.bundle.min.js&quot;
       Sequence=&quot;57150&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.SPEasyForms.min.js&quot;
       Sequence=&quot;57151&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/SPEasyForms_DefaultSettings.js&quot;
       Sequence=&quot;57152&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptBlock=&quot;spefjQuery(window).bind(&apos;load&apos;, function() { spefjQuery.spEasyForms.init(); });&quot;
       Sequence=&quot;57741&quot;
     /&gt;
&lt;/Elements&gt;
    </div>
    <div id='scriptLinksDebug'  style='display: none'>&lt;Elements xmlns=&quot;http://schemas.microsoft.com/sharepoint/&quot;&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.bundle.min.js&quot;
       Sequence=&quot;57166&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.SPEasyFormsInstance.js&quot;
       Sequence=&quot;57171&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/SPEasyForms_DefaultSettings.js&quot;
       Sequence=&quot;57172&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/utilities.js&quot;
       Sequence=&quot;57176&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/sharePointContext.js&quot;
       Sequence=&quot;57181&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/sharePoinFieldRows.js&quot;
       Sequence=&quot;57186&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/configManager.js&quot;
       Sequence=&quot;57191&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/containerCollection.js&quot;
       Sequence=&quot;57196&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.defaultContainer.js&quot;
       Sequence=&quot;57201&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.baseContainer.js&quot;
       Sequence=&quot;57206&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.fieldCollection.js&quot;
       Sequence=&quot;57207&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.accordion.js&quot;
       Sequence=&quot;57211&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.columns.js&quot;
       Sequence=&quot;57216&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.stack.js&quot;
       Sequence=&quot;57218&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.tabs.js&quot;
       Sequence=&quot;57221&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.wizard.js&quot;
       Sequence=&quot;57224&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/visibilityRuleCollection.js&quot;
       Sequence=&quot;57226&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adapterCollection.js&quot;
       Sequence=&quot;57231&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adap.autocompleteAdapter.js&quot;
       Sequence=&quot;57236&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adap.cascadingLookupAdapter.js&quot;
       Sequence=&quot;57241&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adap.defaultToCurrentUserAdapter.js&quot;
       Sequence=&quot;57243&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adap.lookupDetailAdapter.js&quot;
       Sequence=&quot;57243&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/adap.starRatingAdapter.js&quot;
       Sequence=&quot;57244&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.cleditor.js&quot;
       Sequence=&quot;57251&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.cleditor.sharepoint.js&quot;
       Sequence=&quot;57261&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/jquery.cleditor.xhtml.js&quot;
       Sequence=&quot;57271&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptSrc=&quot;~sitecollection/Style Library/SPEasyFormsAssets/2018.02/JavaScript/cont.htmlSnippet.js&quot;
       Sequence=&quot;57281&quot;
    /&gt;
    &lt;CustomAction
       Location=&quot;ScriptLink&quot;
       ScriptBlock=&quot;spefjQuery(window).bind(&apos;load&apos;, function() { spefjQuery.spEasyForms.init(); });&quot;
       Sequence=&quot;57741&quot;
     /&gt;
&lt;/Elements&gt;
    </div>
    <div class='settingsheader'>SPEasyForms Installer</div>
    <div class="scriptLinksdiv">
        Custom Actions:
        <div>
            <textarea
                title="Enter paths to additional JavaScript and/or CSS files to load. JavaScript files must be stored in this site collection and the path must begin with ~sitecollection. All file names must end with .js or .css."
                id='scriptLinks' rows='30' cols='100' disabled></textarea>
        </div>
    </div>
    <div class="buttun-div">
        <button id="installButton" type="button" class="settings-button">Install</button>
        <button id="uninstallButton" type="button" class="settings-button">Uninstall</button>
    </div>
    <script type="text/javascript">
        (function () {
            if (!window.intellipoint)
                window.intellipoint = {};

            var parseXml;

            if (typeof window.DOMParser != "undefined") {
                parseXml = function (xmlStr) {
                    return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
                };
            } else if (typeof window.ActiveXObject != "undefined" &&
                   new window.ActiveXObject("Microsoft.XMLDOM")) {
                parseXml = function (xmlStr) {
                    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                    return xmlDoc;
                };
            } else {
                throw new Error("No XML parser found");
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Form code behind class
            ////////////////////////////////////////////////////////////////////////////////
            intellipoint.spEasyFormsInstaller = {
                installScriptlinks: [],
                buttonAction: {},

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the SharePoint object model context, and populate the script link
                // text area with the current script links.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    spEasyFormsInstaller.getScriptlinks(spEasyFormsInstaller.arrayToTextArea);

                    var buttonAction = parseXml(document.getElementById("buttonAction").innerText);
                    var node = buttonAction.getElementsByTagName("CustomAction")[0];
                    spEasyFormsInstaller.buttonAction.Location = node.getAttribute("Location");
                    spEasyFormsInstaller.buttonAction.Id = node.getAttribute("Id");
                    spEasyFormsInstaller.buttonAction.RegistrationType = node.getAttribute("RegistrationType");
                    spEasyFormsInstaller.buttonAction.RegistrationId = node.getAttribute("RegistrationId");
                    spEasyFormsInstaller.buttonAction.Rights = node.getAttribute("Rights");
                    spEasyFormsInstaller.buttonAction.CommandUIExtension = document.getElementById("buttonAction").innerText.match(/<CommandUIExtension.*?<\/CommandUIExtension>/g);

                    var scriptLinks = parseXml(document.getElementById("scriptLinks" + (window.location.href.indexOf("Debug=true") > -1 ? "Debug" : "Release")).innerText);
                    var links = scriptLinks.getElementsByTagName("CustomAction");
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].getAttribute("ScriptSrc"))
                            spEasyFormsInstaller.installScriptlinks.push(links[i].getAttribute("ScriptSrc"));
                        else if (links[i].getAttribute("ScriptBlock"))
                            spEasyFormsInstaller.installScriptlinks.push("ScriptBlock=" + links[i].getAttribute("ScriptBlock"));
                    }

                    // on click, set the script links; note: all existing script links are deleted 
                    // and new ones are added from scratch, in the order they're listed
                    document.getElementById("installButton").onclick = function (e) {
                        e = e || window.event;
                        spEasyFormsInstaller.deleteScriptlinks(function () {
                            spEasyFormsInstaller.addScriptlinks(function () {
                                spEasyFormsInstaller.siteUserCustomActions = null;
                                spEasyFormsInstaller.getScriptlinks(spEasyFormsInstaller.arrayToTextArea);
                                alert("SPEasyForms successfully installed.");
                            });
                        });
                    };

                    document.getElementById("uninstallButton").onclick = function (e) {
                        e = e || window.event;
                        spEasyFormsInstaller.deleteScriptlinks(function () {
                            spEasyFormsInstaller.siteUserCustomActions = null;
                            spEasyFormsInstaller.getScriptlinks(spEasyFormsInstaller.arrayToTextArea);
                            alert("SPEasyForms successfully uninstalled.");
                        });
                    };
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Add a script link for each line on the script link text area. Note: lines
                // that do not begin with ~sitecollection or ~site and do not end with .js or .css will be skipped
                // intentionally.
                ////////////////////////////////////////////////////////////////////////////////
                addScriptlinks: function (callback) {
                    spEasyFormsInstaller.initClientContext(function () {
                        var suuid = SP.Guid.newGuid();

                        var manageWebRight = new SP.BasePermissions();
                        manageWebRight.set(SP.PermissionKind.manageWeb)

                        var newAction = spEasyFormsInstaller.userCustomActions.add();
                        newAction.set_location(spEasyFormsInstaller.buttonAction.Location);
                        newAction.set_name(spEasyFormsInstaller.buttonAction.Id);
                        newAction.set_registrationId(spEasyFormsInstaller.buttonAction.RegistrationId);
                        newAction.set_registrationType(SP.UserCustomActionRegistrationType.contentType);
                        newAction.set_rights(manageWebRight);
                        newAction.set_commandUIExtension(spEasyFormsInstaller.buttonAction.CommandUIExtension);
                        newAction.set_sequence(57000);
                        newAction.set_title("SPEasyForms Custom Action #57000");
                        newAction.set_description("Set programmaically by SetScriptlink.aspx.");
                        newAction.update();

                        for (var i = 0; i < spEasyFormsInstaller.installScriptlinks.length; i++) {
                            var file = spEasyFormsInstaller.installScriptlinks[i];
                            if (((/\.js$/.test(file) || /\.css$/.test(file)) && (/^~sitecollection/.test(file) || /^~site/.test(file))) || file.indexOf("ScriptBlock=") == 0) {
                                newAction = spEasyFormsInstaller.userCustomActions.add();
                                newAction.set_location("ScriptLink");
                                if (/\.js$/.test(file)) {
                                    newAction.set_scriptSrc(file + "?rev=" + suuid);
                                }
                                else if (file.indexOf("ScriptBlock=") == 0) {
                                    newAction.set_scriptBlock(file.substr(12));
                                }
                                else {
                                    var css = file.replace(/~sitecollection/g, _spPageContextInfo.siteAbsoluteUrl).replace(/~site/g, _spPageContextInfo.webAbsoluteUrl);
                                    newAction.set_scriptBlock("document.write(\"<link rel='stylesheet' type='text/css' href='" + css + "'>\");");
                                }
                                newAction.set_sequence(57001 + i);
                                newAction.set_title("SPEasyForms Custom Action #" + i);
                                newAction.set_description("Set programmaically by SetScriptlink.aspx.");
                                newAction.update();
                            }
                        }

                        spEasyFormsInstaller.clientContext.executeQueryAsync(callback, spEasyFormsInstaller.error);
                    }, spEasyFormsInstaller.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Delete script links who's titles look like they were set by me.
                ////////////////////////////////////////////////////////////////////////////////
                deleteScriptlinks: function (callback) {
                    spEasyFormsInstaller.initClientContext(function () {
                        var enumerator = spEasyFormsInstaller.userCustomActions.getEnumerator();
                        var toDelete = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            var location = action.get_location();

                            var name;
                            try {
                                name = action.get_name();
                            } catch (e) { }

                            var path;
                            try {
                                path = action.get_scriptSrc();
                            } catch (e) { }

                            var scriptBlock;
                            try {
                                scriptBlock = action.get_scriptBlock();
                            } catch (e) { }

                            if (path && path.toLowerCase().indexOf("speasyforms") > -1) {
                                toDelete.push(action);
                            }
                            else if (location === "CommandUI.Ribbon" && name.indexOf("SPEasyForms") > -1) {
                                toDelete.push(action);
                            }
                            else if (scriptBlock && scriptBlock.indexOf("spefjQuery") > -1) {
                                toDelete.push(action);
                            }
                        }

                        if (toDelete.length > 0) {
                            for (var i = 0; i < toDelete.length; i++) {
                                toDelete[i].deleteObject();
                            }

                            spEasyFormsInstaller.clientContext.executeQueryAsync(callback, spEasyFormsInstaller.error);
                        }
                        else {
                            callback();
                        }
                    }, spEasyFormsInstaller.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Get script links who's titles look like they were set by me.
                ////////////////////////////////////////////////////////////////////////////////
                getScriptlinks: function (callback) {
                    spEasyFormsInstaller.initClientContext(function () {
                        var enumerator = spEasyFormsInstaller.userCustomActions.getEnumerator();
                        var tmp = [], result = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            var location = action.get_location();

                            var name;
                            try {
                                name = action.get_name();
                            } catch (e) { }

                            var path;
                            try {
                                path = action.get_scriptSrc();
                            } catch (e) { }

                            var scriptBlock;
                            try {
                                scriptBlock = action.get_scriptBlock();
                            } catch (e) { }

                            if (path && path.toLowerCase().indexOf("speasyforms") > -1) {
                                if (path.indexOf("?") > 0)
                                    path = path.substr(0, path.indexOf("?"));
                                tmp.push({ p: path, s: action.get_sequence() });
                            }
                            else if (location === "CommandUI.Ribbon" && name.indexOf("SPEasyForms") > -1) {
                                tmp.push({ p: "Ribbon=" + name, s: action.get_sequence() });
                            }
                            else if(scriptBlock && scriptBlock.indexOf("spefjQuery") > -1) {
                                var regexp = new RegExp("href=\'([^\']*)\'", "i");
                                var matches = scriptBlock.match(regexp);
                                if (matches && matches.length >= 2) {
                                    path = matches[1];
                                    var sitecollectionregexp = new RegExp(_spPageContextInfo.siteAbsoluteUrl, "g");
                                    var siteregexp = new RegExp(_spPageContextInfo.webAbsoluteUrl, "g");
                                    path = path.replace(sitecollectionregexp, "~sitecollection").replace(siteregexp, "~site");
                                    tmp.push({ p: path, s: action.get_sequence() });
                                }
                                else {
                                    tmp.push({ p: "ScriptBlock=" + action.get_scriptBlock(), s: action.get_sequence() });
                                }
                            }
                        }
                        tmp = tmp.sort(function (a, b) { if (a.s < b.s) return -1; if (a.s > b.s) return 1; return 0 });
                        for (var i = 0; i < tmp.length; i++) {
                            result.push(tmp[i].p);
                        }
                        callback(result);
                    }, spEasyFormsInstaller.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the sharepoint object model, including site, web, and userCustomActions.
                ////////////////////////////////////////////////////////////////////////////////
                initClientContext: function (success, failure) {
                    if (!spEasyFormsInstaller.clientContext) {
                        spEasyFormsInstaller.clientContext = new SP.ClientContext();

                        if (!spEasyFormsInstaller.site) {
                            spEasyFormsInstaller.site = spEasyFormsInstaller.clientContext.get_site();
                        }

                        if (!spEasyFormsInstaller.siteUserCustomActions) {
                            spEasyFormsInstaller.siteUserCustomActions = spEasyFormsInstaller.site.get_userCustomActions();
                            spEasyFormsInstaller.clientContext.load(spEasyFormsInstaller.siteUserCustomActions);
                            spEasyFormsInstaller.userCustomActions = spEasyFormsInstaller.siteUserCustomActions;
                        }

                        spEasyFormsInstaller.clientContext.executeQueryAsync(success, failure);
                    }
                    else if (!spEasyFormsInstaller.siteUserCustomActions) {
                        spEasyFormsInstaller.siteUserCustomActions = spEasyFormsInstaller.site.get_userCustomActions();
                        spEasyFormsInstaller.clientContext.load(spEasyFormsInstaller.siteUserCustomActions);
                        spEasyFormsInstaller.userCustomActions = spEasyFormsInstaller.siteUserCustomActions;

                        spEasyFormsInstaller.clientContext.executeQueryAsync(success, failure);
                    }
                    else {
                        success();
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Failure callback for all async calls.
                ////////////////////////////////////////////////////////////////////////////////
                error: function (sender, args) { 
                    alert("Oops, something bad happened...\n\n" + args.get_errorTypeName() + ": " + args.get_message() + " (CorrelationId: " + args.get_errorTraceCorrelationId() + ")"); 
                },


                ////////////////////////////////////////////////////////////////////////////////
                // Utility method to convert an array of links into text area input.
                ////////////////////////////////////////////////////////////////////////////////
                arrayToTextArea: function (lines) {
                    if (lines) {
                        if(lines.length > 0)
                            document.getElementById("uninstallButton").removeAttribute("disabled");
                        else
                            document.getElementById("uninstallButton").setAttribute("disabled", "disabled");

                        var text = "";
                        for (var i = 0; i < lines.length; i++) {
                            text += lines[i] + "\n";
                        }
                        document.getElementById("scriptLinks").value = text;
                    }
                }
            };

            var spEasyFormsInstaller = intellipoint.spEasyFormsInstaller;
        })();

        ExecuteOrDelayUntilScriptLoaded(function () {
            intellipoint.spEasyFormsInstaller.init();
        }, "sp.js");
    </script>
</asp:Content>
