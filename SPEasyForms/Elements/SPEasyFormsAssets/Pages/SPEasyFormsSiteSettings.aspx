<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    <SharePoint:ProjectProperty Property='Title' runat='server'>- SharePoint Easy Forms Site Settings</SharePoint:ProjectProperty>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
    <span class='ms-WikiPageNameEditor-Display' id='listBreadCrumb'></span>
    <span class='ms-WikiPageNameEditor-Display' id='wikiPageNameDisplay'></span>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderAdditionalPageHead' runat='server'>
    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style type="text/css">
        .speasyforms-settingsheader {
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.8em;
            color: darkslategray;
            margin-bottom: 20px;
        }

        .ms-status-yellow {
            display: none !important;
        }

        .speasyforms-themediv {
            margin-top: 10px;
            margin-bottom: 10px;
        }

        .speasyforms-additionalfilesdiv {
            margin-top: 20px;
            margin-bottom: 30px;
        }

        label {
            display: inline-block;
            width: 5em;
        }

        fieldset div {
            margin-bottom: 2em;
        }

        fieldset .help {
            display: inline-block;
        }

        .ui-tooltip {
            width: 300px;
            background: #eee;
            border: 1px solid darkgrey;
            padding: 10px;
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
    <div class='speasyforms-settingsheader'>jQuery UI Theme</div>
    <div>
        <input type="radio" name="jqueryuitheme" value="gallery" title="Use one of the six themes built-in to SPEasyForms."/>
        Use Gallery Theme 
                        <input type="radio" name="jqueryuitheme" value="custom" title="Use a custom jQuery UI theme."/>
        Use Custom Theme 
    </div>
    <div class="speasyforms-themediv">
        <select id="selGalleryTheme" title="Choose one of the six built-in jQuery UI themes.">
        </select>
        <input type="text" id="inpCustomTheme" name="inpCustomTheme"
            value="" title="Enter the full text to a jQuery UI 1.11.x theme." style="display: none; width: 700px;" />
    </div>
    <div class="speasyforms-additionalfilesdiv">
        Additional files to load:
        <div>
            <textarea
                title="Enter paths to additional JavaScript and/or CSS files to load. JavaScript files must be stored in this site collection and the path must begin with ~sitecollection. All file names must end with .js or .css."
                id='settingsAdditionalFiles' rows='10' cols='100'></textarea>
        </div>
    </div>
    <div>
        <button id="saveButton">Save</button>
        <button id="cancelButton">Cancel</button>
    </div>
    <script type="text/javascript">
        (function ($, undefined) {
            var params = $.spEasyForms.utilities.getRequestParameters();
            var opt = $.spEasyForms.defaults;
            $.spEasyForms.initCacheLibrary(opt);
            opt.currentContext = $.spEasyForms.sharePointContext.get(opt);

            $.spEasyForms.siteSettings = {
                init: function () {
                    if ($.spEasyForms.defaults.jQueryUITheme) {
                        opt.source = $.spEasyForms.defaults.jQueryUITheme;
                        var theme = $.spEasyForms.replaceVariables(opt);
                        $("head").append(
                            '<link rel="stylesheet" type="text/css" href="' + theme + '">');
                    }

                    this.initTheme();
                    this.wireButtonEvents();
                },

                initTheme: function() {
                    var currentGalleryTheme;
                    $.each($($.spEasyForms.defaults.jQueryUIGallery), function (idx, item) {
                        if ($.spEasyForms.defaults.jQueryUITheme && $.spEasyForms.defaults.jQueryUITheme.indexOf("/jquery-ui-" + item.toLowerCase() + "/") > 0) {
                            currentGalleryTheme = item;
                        }
                        $("#selGalleryTheme").append("<option value='" + item.toLowerCase() + "'>" + item + "</option>");
                    });

                    if (currentGalleryTheme) {
                        $("input:radio[value='gallery']").prop("checked", "checked");
                        $("#selGalleryTheme").val(currentGalleryTheme);
                        $("#inpCustomTheme").hide();
                        $("#selGalleryTheme").show();
                    }
                    else {
                        $("#inpCustomTheme").val($.spEasyForms.defaults.jQueryUITheme);
                        $("input:radio[value='custom']").prop("checked", "checked");
                        $("#inpCustomTheme").show();
                        $("#selGalleryTheme").hide();
                    }

                    $("input:radio[name='jqueryuitheme']").change(function () {
                        var value = $("input:radio[name='jqueryuitheme']:checked").val();
                        if (value === "gallery") {
                            $("#selGalleryTheme").show();
                            $("#inpCustomTheme").hide();
                        }
                        else {
                            $("#inpCustomTheme").show();
                            $("#selGalleryTheme").hide();
                        }
                    });

                    if ($.spEasyForms.userDefaults.additionalFiles && $.spEasyForms.userDefaults.additionalFiles.length > 0) {
                        var additionalFiles = "";
                        $.each($($.spEasyForms.userDefaults.additionalFiles), function (idx, file) {
                            additionalFiles += file + "\n";
                        });
                        $("#settingsAdditionalFiles").val(additionalFiles);
                    }
                },

                wireButtonEvents: function () {
                    $("#saveButton").button({
                        label: "Save"
                    }).click(function (e) {
                        e.preventDefault();
                        if (!$.spEasyForms.userDefaults) {
                            $.spEasyForms.userDefaults = {};
                        }
                        var themeType = $("input:radio[name='jqueryuitheme']:checked").val();
                        if (themeType === "gallery") {
                            theme = $("#selGalleryTheme").val();
                            theme = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/~version/Css/jquery-ui-' + theme + '/jquery-ui.css');
                            $.spEasyForms.userDefaults.jQueryUITheme = theme;
                        }
                        else if($("#inpCustomTheme").val().length > 0) {
                            $.spEasyForms.userDefaults.jQueryUITheme = $("#inpCustomTheme").val();
                        }
                        siteSettings.deleteAdditionalFileCustomActions(function () {
                            $.spEasyForms.userDefaults.additionalFiles = [];
                            var additionalFiles = $("#settingsAdditionalFiles").val().trim();
                            if (additionalFiles.length > 0) {
                                var files = additionalFiles.split("\n");
                                $.each($(files), function (i, file) {
                                    if (file.trim().length > 0) {
                                        file = file.trim();
                                        if (/\.css$/.test(file) || /\.js$/.test(file)) {
                                            $.spEasyForms.userDefaults.additionalFiles.push(file);
                                        }
                                    }
                                });
                            }
                            
                            siteSettings.addAdditionalFileCustomActions(function () {
                                var defaultSettings = "(function ($, undefined) {\n" +
                                    "$.spEasyForms.userDefaults = {0};\n" +
                                    "$.spEasyForms.defaults = $.extend({}, $.spEasyForms.defaults, $.spEasyForms.userDefaults);\n" +
                                    "})(spefjQuery);";
                                defaultSettings = defaultSettings.replace("{0}", JSON.stringify($.spEasyForms.userDefaults, null, 4));
                                $.ajax({
                                    url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/SPEasyForms_DefaultSettings.js"),
                                    type: "PUT",
                                    headers: {
                                        "Content-Type": "text/plain",
                                        "Overwrite": "T"
                                    },
                                    data: defaultSettings,
                                    success: function () {
                                        window.location.href = params["Source"] ? params["Source"] : $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("_layouts/Settings.aspx");
                                    },
                                    error: function (xhr, ajaxOptions, thrownError) {
                                        alert("Error uploading settings.\nStatus: " + xhr.status +
                                                "\nStatus Text: " + thrownError);
                                    }
                                });
                            });
                        });
                        return false;
                    });

                    $("#cancelButton").button({
                        label: "Cancel"
                    }).click(function (e) {
                        e.preventDefault();
                        window.location.href = params["Source"] ? params["Source"] : $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("_layouts/Settings.aspx");
                        return false;
                    });
                },

                addAdditionalFileCustomActions: function (callback) {
                    var found = false;
                    $.each($($.spEasyForms.userDefaults.additionalFiles), function (idx, file) {
                        if (/\.js$/.test(file) && /^~sitecollection/.test(file)) {
                            found = true;
                            var newAction = siteSettings.userCustomActions.add();
                            newAction.set_location("ScriptLink");
                            newAction.set_scriptSrc(file);
                            newAction.set_sequence(57500 + idx);
                            newAction.set_title("SPEasyForms Additional File #" + idx);
                            newAction.set_description("Generally used to load SPEasyForms AddOns.");
                            newAction.update();
                        }
                    });

                    if (found) {
                        siteSettings.clientContext.executeQueryAsync(
                            Function.createDelegate(siteSettings, callback),
                            Function.createDelegate(siteSettings, siteSettings.error));
                    }
                    else {
                        callback();
                    }
                },

                deleteAdditionalFileCustomActions: function (callback) {
                    siteSettings.initClientContext(function () {
                        var enumerator = siteSettings.userCustomActions.getEnumerator();
                        var toDelete = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            if (/^SPEasyForms Additional File #/.test(action.get_title())) {
                                //action.deleteObject();
                                toDelete.push(action);
                            }
                        }

                        if (toDelete.length > 0) {
                            $.each($(toDelete), function (idx, action) {
                                action.deleteObject();
                            });

                            siteSettings.clientContext.executeQueryAsync(
                                Function.createDelegate(siteSettings, callback),
                                Function.createDelegate(siteSettings, siteSettings.error));
                        }
                        else {
                            callback();
                        }
                    }, siteSettings.error);
                },

                initClientContext: function (success, failure) {
                    if (!siteSettings.clientContext) {
                        siteSettings.clientContext = new SP.ClientContext();
                    }

                    if (!siteSettings.site) {
                        siteSettings.site = siteSettings.clientContext.get_web();
                    }

                    if (!siteSettings.userCustomActions) {
                        siteSettings.userCustomActions = siteSettings.site.get_userCustomActions();
                        siteSettings.clientContext.load(siteSettings.userCustomActions);
                    }

                    siteSettings.clientContext.executeQueryAsync(
                        Function.createDelegate(siteSettings, success),
                        Function.createDelegate(siteSettings, failure));
                },

                error: function() {
                    alert("oops...");
                }
            };

            var siteSettings = $.spEasyForms.siteSettings;
            siteSettings.init();
        })(spefjQuery);
    </script>
</asp:Content>
