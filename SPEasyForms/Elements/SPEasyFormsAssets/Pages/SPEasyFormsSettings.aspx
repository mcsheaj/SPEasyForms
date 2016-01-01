<!DOCTYPE html>

<%@ Page Language="C#" %>

<%@ Register TagPrefix="SharePoint"
    Namespace="Microsoft.SharePoint.WebControls"
    Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="UTF-8" />
    <title>SPEasyForms Settings</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <script src="../JavaScript/MicrosoftAjax.js " type="text/javascript"></script>
    <script src="/_layouts/1033/init.js" type="text/javascript"></script>
    <script src="/_layouts/sp.core.js" type="text/javascript"></script>
    <script src="/_layouts/sp.runtime.js" type="text/javascript"></script>
    <script src="/_layouts/sp.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery-ui.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery-ui.nestedsortable.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPServices.js" type="text/javascript"></script>
    <script src="../JavaScript/ssw.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.SPEasyForms.js" type="text/javascript"></script>
    <script src="../../SPEasyForms_DefaultSettings.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.SPEasyForms.utilities.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.sharePointContext.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.sharePoinFieldRows.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.configManager.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.defaultContainer.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.baseContainer.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.fieldCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.accordion.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.columns.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.stack.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.tabs.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.wizard.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.containerCollection.htmlSnippet.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.SPEasyForms.visibilityRuleCollection.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.autocompleteAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.cascadingLookupAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.defaultToCurrentUserAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.lookupDetailAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.SPEasyForms.adapterCollection.starRatingAdapter.js" type="text/javascript"></script>

    <script src="../JavaScript/jquery.cleditor.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.cleditor.xhtml.js" type="text/javascript"></script>
    <script src="../JavaScript/jquery.cleditor.sharepoint.js" type="text/javascript"></script>

    <SharePoint:CssRegistration Name="default" runat="server" />

    <style>
        body {
            font-family: Verdana, Arial, sans-serif;
            overflow: hidden;
            margin:0;
        }

        table.speasyforms-columns {
            width: 100%;
        }

        table.ms-formtable {
            padding: 5px;
            background: white;
            border-spacing: 10px;
            width: 600px;
        }

            table.ms-formtable tr {
                padding: 10px !important;
            }

        td.ms-formlabel {
            padding: 5px;
            text-align: right;
            font-size: 0.7rem;
        }

        td.ms-formbody {
            border: 1px solid gray;
            padding: 0;
            margin: 20px;
            width: 100%;
            /* 
            hack fix for 2010 
            */
        }

        .ui-accordion .ui-accordion-content {
            overflow: auto;
        }

        .ui-menu .ui-menu-item,
        .nobr {
            white-space: nowrap;
        }

        div.ui-dialog {
            background: #eee !important;
        }

        .ms-formvalidation {
            color: red;
        }

        .speasyforms-panel {
            vertical-align: top;
        }

        #s4-bodyContainer {
            overflow-x: hidden;
            padding-bottom: 0;
        }

        div.speasyforms-panel {
            width: 400px;
            height: 700px;
            overflow-x: scroll;
            overflow-y: scroll;
            background: #eee;
            float: left;
        }

        td.speasyforms-form,
        #toggleContext,
        #outputTable {
            padding-left: 405px;
        }

        td.speasyforms-sortablefields {
            width: 45%;
            cursor: move;
        }

        #contentRow {
            padding-top: 0;
        }

        #contentBox {
            margin-left: 0;
        }

        .speasyforms-form {
            vertical-align: top;
            padding: 0 20px;
            width: 100%;
            min-width: 360px;
        }

        .speasyforms-entity {
            display: block;
            padding: 3px 20px 4px 8px;
            margin: 1px 2px;
            position: relative;
            float: left;
            background-color: #eee;
            border: 1px solid #333;
            -moz-border-radius: 7px;
            -webkit-border-radius: 7px;
            border-radius: 7px;
            color: #333;
            font: n ormal 11px Verdana, Sans-serif;
        }

            .speasyforms-entity a {
                position: absolute;
                right: 8px;
                top: 2px;
                color: #666;
                font: bold 12px Verdana, Sans-serif;
                text-decoration: none;
            }

                .speasyforms-entity a:hover {
                    color: #ff0000;
                }

        .speasyforms-input {
            background: #eee;
        }

        #spEasyFormsOuterDiv {
            display: none;
        }

        .speasyforms-error {
            color: maroon !important;
        }

        .speasyforms-dialogdiv {
            display: none;
        }

        .speasyforms-json {
            border: 1px solid lightblue;
        }

        .formTabsDiv {
            margin-top: 10px;
            margin-bottom: 10px;
        }

        .formTabsTable {
            padding: 1px;
            margin: 0;
        }

        .formTabsList {
            background-color: #cdc0b0;
        }

        th.speasyforms-fieldcell {
            font-size: .8rem;
        }

        table.speasyforms-fieldsheader {
            width: 100%;
        }

        td.speasyforms-headercell {
            width: 50%;
        }

        h1 {
            font-size: 1.8rem;
            font-weight: normal;
        }

        h3.speasyforms-sortablefields {
            font-size: 1.2rem;
            font-weight: normal;
        }

        .speasyforms-itemtype {
            font-size: .7rem;
            font-weight: normal;
        }

        table.speasyforms-editor {
            max-width: 1280px;
        }

        table.speasyforms-fieldstitle,
        table.speasyforms-sortablefields {
            width: 95%;
            margin-left: auto;
            margin-right: auto;
        }

        table.speasyforms-columncell {
            width: 95%;
        }

        table.speasyforms-sortablerules {
            width: 80%;
        }

        tr.speasyforms-sortablefields,
        tr.speasyforms-sortablerules {
            font-size: .9rem;
        }

        td.speasyforms-sortablerules {
            border: 1px solid gray;
        }

        div.speasyforms-buttons {
            margin-top: 20px;
        }

        button.ui-button-icon-only {
            font-size: .5rem !important;
            margin: 0;
            padding: 0;
            min-width: 0;
        }

        div.speasyforms-entitypicker {
            border: 1px solid gray;
            width: 500px;
            padding: 3px;
            background: white;
        }

        input.speasyforms-entitypicker {
            width: 100px;
            position: relative;
            float: left;
            border: none;
            padding: 5px;
        }

        table.speasyforms-rulestable {
            width: 90%;
        }

        td.speasyforms-visibility,
        td.speasyforms-adapter {
            margin: 0;
            padding: 0;
            width: 1px;
            background: #ddd;
        }

            td.speasyforms-visibility:hover,
            td.speasyforms-adapter:hover {
                background: #eee;
            }

        td.speasyforms-visibilityrulebutton {
            background: #eee;
            width: 1px;
        }

        td.speasyforms-editor .ui-widget-content.tabs-min {
            background: transparent;
            border: none;
        }

        .ui-widget-header.tabs-min {
            background: transparent;
            border: none;
            border-bottom: 1px solid #c0c0c0;
            -moz-border-radius: 0;
            -webkit-border-radius: 0;
            border-radius: 0;
        }

        .ui-tabs-nav.tabs-min .ui-state-default {
            background: transparent;
            border: none;
        }

            .ui-tabs-nav.tabs-min .ui-state-default a {
                color: #c0c0c0;
            }

        .ui-tabs-nav.tabs-min .ui-state-active a {
            color: #459e00;
        }

        #spEasyFormsTextareaDiv {
            display: none;
        }

        table.speasyforms-staticrules {
            width: 100%;
        }

        td.speasyforms-blank {
            width: 47px;
            background-color: #ddd;
        }

        table.speasyforms-adapter,
        td.speasyforms-visibility {
            background-color: #eaf4fd;
            border: 1px solid darkgrey;
            width: 100%;
            margin-top: 15px;
            padding: 10px;
        }

        td.speasyforms-staticrules,
        td.speasyforms-adapter-static {
            text-align: left;
        }

        table.speasyforms-adapters {
            width: 100%;
        }

        td.speasyforms-adapterlabel {
            font-weight: bold;
            width: 150px;
        }

        .speasyforms-adapterdetails {
            border: 1px solid darkgrey;
            width: 90%;
            margin: 10px 10px auto auto;
        }

        table.speasyforms-credits {
            border: 1px solid darkgrey;
            margin: 20px;
            padding: 0;
        }

        td.speasyforms-credit {
            white-space: nowrap;
            font-weight: bold;
            vertical-align: top;
            padding: 5px;
        }

        td.speasyforms-creditdescription {
            vertical-align: top;
            padding: 5px;
        }

        span.speasyforms-credits {
            font-weight: bold;
        }

        a.speasyforms-credits {
            color: blue !important;
        }

        div.speasyforms-contenttype {
            padding-top: 5px;
        }

        .ms-cui-tts {
            display: none;
        }

        #sideNavBox {
            display: none;
        }

        .speasyforms-ribbon {
            width: 100%;
            height: 85px;
            font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
            overflow: hidden;
            z-index: 1;
            border-bottom: 1px solid lightgray;
            background-color: #fcfcfc;
        }

        .speasyforms-controlouterdiv {
            float: left;
            border: 1px solid #fcfcfc;
            height: 53px;
            padding: 3px;
        }

        .speasyforms-buttonouterdiv,
        .speasyforms-buttoncontainer {
            float: left;
            border: 1px solid #fcfcfc;
            height: 65px;
            padding: 3px;
        }

        .speasyforms-buttonouterdiv-smallimg {
            border: 1px solid #fcfcfc;
            padding: 0 2px;
        }

            .speasyforms-buttonouterdiv-smallimg:hover, .speasyforms-buttonouterdiv:hover {
                border: 1px dotted darkblue !important;
                cursor: pointer !important;
            }

        .speasyforms-buttontext {
            text-align: center;
            color: rgb(68, 68, 68);
        }

        .speasyforms-buttontextdisabled {
            color: gray;
        }

        .speasyforms-buttongroup {
            font-size: .8rem;
            border-right: 1px dotted gray;
            height: 84px;
            float: left;
        }

        .speasyforms-buttongrptext {
            font-size: .7rem;
            text-align: center;
            color: gray;
            clear: both;
        }

        .speasyforms-contenttype {
            margin-top: 3px;
        }

        .speasyforms-img {
            background-image: url(menu.png);
            width: 32px;
            height: 32px;
            margin-left: auto;
            margin-right: auto;
        }

        .speasyforms-imgdisabled {
            opacity: 0.3;
            filter: alpha(opacity=30);
        }

        .speasyforms-smallimg {
            background-image: url(menu.png);
            width: 26px;
            height: 18px;
            margin-left: auto;
            margin-right: auto;
            float: left;
        }

        .speasyforms-cancelimg {
            background-position: 512px 0;
        }

        .speasyforms-addimg {
            background-position: 480px 0;
        }

        .speasyforms-undoimg {
            background-position: 448px 0;
        }

        .speasyforms-redoimg {
            background-position: 416px 0;
        }

        .speasyforms-formimg {
            background-position: 384px 0;
        }

        .speasyforms-visimg {
            background-position: 352px 0;
        }

        .speasyforms-adaptimg {
            background-position: 320px 0;
        }

        .speasyforms-expimg {
            background-position: 288px 0;
        }

        .speasyforms-colimg {
            background-position: 255px 0;
        }

        .speasyforms-clrimg {
            background-position: 224px 0;
        }

        .speasyforms-verimg {
            background-position: 192px 0;
        }

        .speasyforms-aboutimg {
            background-position: 160px 0;
        }

        .speasyforms-helpimg {
            background-position: 128px 0;
        }

        .speasyforms-importimg {
            background-position: 96px 0;
        }

        .speasyforms-exportimg {
            background-position: 64px 0;
        }

        .speasyforms-settingsimg {
            background-position: 32px 0;
        }

        .speasyforms-btnstack {
            text-align: left;
            height: 16px;
        }

        .speasyforms-btnstack1 {
            width: 110px;
        }

        .speasyforms-btnstack2 {
            width: 80px;
        }

        .speasyforms-btnstack3 {
            width: 100px;
        }

        h2.speasyforms-breadcrumbs {
            padding: 3px;
            color: #666;
            margin:0;
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.1em;
            font-weight: normal;
        }

            h2.speasyforms-breadcrumbs a,
            h2.speasyforms-breadcrumbs a:visited {
                color: #666;
                text-decoration: underline;
            }

        .speasyforms-hidden {
            display: none;
        }

        #spEasyFormsBusyScreen {
            background: url(/_layouts/images/loading16.gif) no-repeat;
            padding-left: 25px;
        }

        .speasyforms-busyscreen .ui-dialog-titlebar {
            display: none;
        }

        .speasyforms-busyscreen .ui-dialog-titlebar-close {
            display: none;
        }

        .speasyforms-aboutlink, .speasyforms-aboutlink:visited {
            color: darkblue !important;
            text-decoration: underline;
        }

        .speasyforms-helptext {
            background-color: white;
            color: #383822;
            padding: 10px;
            border: 1px solid gray;
            overflow: auto;
        }

        #spEasyFormsContent {
            float: left;
            overflow-y: scroll;
            overflow-x: scroll;
            padding-right: 10px;
            padding-left: 10px;
            margin-left: 400px;
            position: fixed;
        }

        #s4-titlerow {
            padding-bottom: 0;
        }

        ol {
            padding-left: 20px;
        }

        .speasyforms-nestedsortable-error {
            background: #fc87a5;
            border-color: transparent;
        }

        ol.speasyforms-nestedsortable {
            font-size: 13px;
            font-family: Freesans, sans-serif;
            padding: 5px 3px 0 3px;
            margin: 0 0 10px 0;
        }

            ol.speasyforms-nestedsortable,
            ol.speasyforms-nestedsortable ol {
                list-style-type: none;
            }

        .speasyforms-nestedsortable li {
            border: 1px solid #999;
        }

        div.speasyforms-menudiv {
            margin: 0;
            padding: 2px;
            cursor: move;
        }

        div.speasyforms-nestedsortable-content {
            margin: 0;
            padding: 5px;
        }

        li.speasyforms-nestedsortable-collapsed.speasyforms-nestedsortable-hovering div {
            border-color: #999;
        }

        .speasyforms-nestedsortable li.speasyforms-nestedsortable-collapsed > ol {
            display: none;
        }

        .speasyforms-nestedsortable li.speasyforms-nestedsortable-branch > div > .disclose {
            display: inline-block;
        }

        .speasyforms-nestedsortable span.ui-icon {
            display: inline-block;
            margin: 0;
            padding: 0;
        }

        .speasyforms-itemtitle {
            font-size: 16px;
            font-weight: bold;
            vertical-align: middle;
        }

        .speasyforms-nestedsortable-status {
            cursor: pointer;
        }

        .speasyforms-nestedsortable-edit,
        .speasyforms-nestedsortable-delete {
            float: right;
            cursor: pointer;
        }

        td.speasyforms-icon-visibility:hover,
        td.speasyforms-icon-adapter:hover {
            cursor: pointer;
        }

        .speasyforms-placeholder {
            outline: 1px dashed #4183C4;
        }

        .speasyforms-panel, .speasyforms-content {
            display: none;
        }

        h3.ms-standardheader, .ms-standardheader {
            font-size: 0.7rem;
        }

        #tabs-min {
            padding: 15px;
        }

        .ui-widget {
	        font-size: 1rem !important;
        }

        #suitBar {
            height: 46px;
            padding-left: 10px;
        }

        #suitBar a {
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.8rem;
            text-decoration: none;
        }

        #msCuiTopbar {
            background-color: #eee;
            padding: 3px 10px;
            height: 27px;
        }

        .ms-accentText, .ms-accentText:visited {
            color: #0072c6;
        }

        .speasyforms-settingsheader {
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.8em;
            color: darkslategray;
            margin-bottom: 20px;
        }

        h3, h3.speasyforms-columnsheader {
            font-size: 1rem;
            font-weight: normal;
            margin: 4px;
        }
    </style>
</head>
<body>
    <div id="suitBar" class="speasyforms-suitbar ui-widget-header"><a href="https://speasyforms.codeplex.com" target="_blank">SPEasyForms</a></div>
    <div id="msCuiTopbar" class=".ms-cui-topBar2"></div>
    <form id="form1" runat="server">
        <div id='spEasyFormsRibbon' class='speasyforms-ribbon'>
            <div class='speasyforms-buttongroup'>
                <div id='spEasyFormsSaveButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-saveimg"></div>
                    <div class='speasyforms-buttontext'>
                        Save
                    </div>
                </div>
                <div id='spEasyFormsCancelButton' class='speasyforms-buttonouterdiv'>
                    <div class='speasyforms-img speasyforms-cancelimg'></div>
                    <div class='speasyforms-buttontext'>
                        Cancel
                    </div>
                </div>
                <div class='speasyforms-buttongrptext'>
                    Commit
                </div>
            </div>
            <div class='speasyforms-buttongroup'>
                <div id='spEasyFormsContentType' class='speasyforms-contenttype speasyforms-controlouterdiv'>
                    <label for='spEasyFormsContentTypeSelect' class='nobr'>Content Type:</label>
                    <br />
                    <select id='spEasyFormsContentTypeSelect' class='speasyforms-contenttype'></select>
                </div>
                <div class='speasyforms-buttoncontainer'>
                    <div id='spEasyFormsAddButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-addimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack1'>
                            Add Container
                        </div>
                    </div>
                    <div id='spEasyFormsUndoButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-undoimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack1'>
                            Undo
                        </div>
                    </div>
                    <div id='spEasyFormsRedoButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-redoimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack1'>
                            Redo
                        </div>
                    </div>
                </div>
                <div class='speasyforms-buttongrptext'>
                    Edit
                </div>
            </div>
            <div class='speasyforms-buttongroup'>
                <div id='spEasyFormsFormButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-formimg"></div>
                    <div class='speasyforms-buttontext'>Form</div>
                </div>
                <div id='spEasyFormsConditionalVisibilityButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-visimg"></div>
                    <div class='speasyforms-buttontext'>
                        Conditional
                    <br />
                        Visibility
                    </div>
                </div>
                <div id='spEasyFormsFieldAdaptersButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-adaptimg"></div>
                    <div class='speasyforms-buttontext'>
                        Field
                    <br />
                        Adapters
                    </div>
                </div>
                <div id='spEasyFormsSettingsButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-settingsimg"></div>
                    <div class='speasyforms-buttontext'>Settings</div>
                </div>
                <div class='speasyforms-buttoncontainer'>
                    <div id='spEasyFormsExpandButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-expimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack2'>
                            Expand
                        </div>
                    </div>
                    <div id='spEasyFormsCollapseButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-colimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack2'>
                            Collapse
                        </div>
                    </div>
                </div>
                <div class='speasyforms-buttongrptext'>
                    View
                </div>
            </div>
            <div class='speasyforms-buttongroup'>
                <a href='javascript:void(0)' id='spEasyFormsExportLink'>
                    <div id='spEasyFormsExportButton' class='speasyforms-buttonouterdiv'>
                        <div class="speasyforms-img speasyforms-exportimg"></div>
                        <div class='speasyforms-buttontext'>
                            Export
                        </div>
                    </div>
                </a>
                <div id='spEasyFormsImportButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-importimg"></div>
                    <div class='speasyforms-buttontext'>
                        Import
                    </div>
                </div>
                <div class='speasyforms-buttoncontainer'>
                    <div id='spEasyFormsClearCacheButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-clrimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack3'>
                            Clear Cache
                        </div>
                    </div>
                    <div id='spEasyFormsVerboseButton' class='speasyforms-buttonouterdiv-smallimg'>
                        <div class='speasyforms-smallimg speasyforms-verimg'></div>
                        <div class='speasyforms-buttontext speasyforms-btnstack speasyforms-btnstack3'>
                            Verbose
                        </div>
                    </div>
                </div>
                <div class='speasyforms-buttongrptext'>
                    Tools
                </div>
            </div>
            <div class='speasyforms-buttongroup'>
                <div id='spEasyFormsAboutButton' class='speasyforms-buttonouterdiv'>
                    <div class="speasyforms-img speasyforms-aboutimg"></div>
                    <div class='speasyforms-buttontext'>About</div>
                </div>
                <a href='javascript:void(0)' id='spEasyFormsHelpLink'>
                    <div id='spEasyFormsHelpButton' class='speasyforms-buttonouterdiv'>
                        <div class="speasyforms-img speasyforms-helpimg"></div>
                        <div class='speasyforms-buttontext'>Help</div>
                    </div>
                </a>
                <div class='speasyforms-buttongrptext'>
                    Info
                </div>
            </div>
        </div>
        <div id='spEasyFormsPanel' class='speasyforms-panel'>
            <ol class="speasyforms-nestedsortable ui-corner-all">
            </ol>
        </div>
        <div id='spEasyFormsContent' class='speasyforms-content'>
            <div id='tabs-min'>
                <div id='tabs-min-form' class='tabs-min'>
                    <table class='ms-formtable' style='margin-top: 8px;' border='0'></table>
                </div>
                <div id='tabs-min-visibility' class='tabs-min' style='display: none'></div>
                <div id='tabs-min-adapters' class='tabs-min' style='display: none'>
                    <table id='spEasyFormsAdapterTable' class='speasyforms-adapters'>
                        <tr>
                            <th>Display Name</th>
                            <th class='speasyforms-hidden' style='display: none'>Internal Name</th>
                            <th>Adapter Type</th>
                            <th>Additional Settings</th>
                        </tr>
                    </table>
                </div>
                <div id='tabs-min-settings' class='tabs-min' style='display: none;'>
                    <div class='speasyforms-settingsheader'>jQuery UI Theme</div>
                    <div>
                        <input type="radio" name="jqueryuitheme" value="none" checked="checked"/> Use Default Theme 
                        <input type="radio" name="jqueryuitheme" value="gallery" /> Use Gallery Theme 
                        <input type="radio" name="jqueryuitheme" value="custom"/> Use Custom Theme 
                    </div>
                    <div style="margin-top: 10px; margin-bottom: 10px;">
                        <select id="selGalleryTheme">
                        </select>
                        <input type="text" id="inpCustomTheme" name="inpCustomTheme" 
                            value="" title="Enter the full text to a jQuery UI 1.11.x theme." style="display:none; width: 700px;"/>
                    </div>
                    <div>
                        <button id="applyThemeButton">Apply</button>
                    </div>
                </div>
            </div>
        </div>
        <div id='spEasyFormsTextareaDiv'>
            <h3>JSON Configuration:</h3>
            <div id='spEasyFormsJson' class='speasyforms-json'>
                <pre></pre>
            </div>
        </div>
        <div id='spEasyFormsContainerDialogs'>
            <div id='spEasyFormsErrorDialog' class='speasyforms-dialogdiv' title=''>
            </div>
            <div id='spEasyFormsBusyScreen'></div>
            <div id='spEasyFormsInitializationError' style='display: none'>
                <h3>SPEasyForms Initialization Error</h3>
                <p>
                    We're not sure how you got here, but the current list context is of a type that is not supported by SPEasyForms.
                </p>
            </div>
            <div id='spEasyFormsAboutDialog' class='tabs-min' style='display: none' title='About SPEasyForms'>
                <div class='speasyforms-helptext ui-corner-all'>
                    <p>
                        <b>Version: 2015.01.beta</b>
                    </p>
                    <h2>The MIT License (MIT)</h2>
                    <p>Copyright (c) 2014-2015 Joe McShea</p>
                    <p>
                        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
                    merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                    </p>
                    <p>
                        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                    </p>
                    <p>
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
                    BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                    </p>
                    <h2>Third Party Software</h2>
                    <p>
                        This project uses the following third party open source libraries:
                    </p>
                    <p>
                        <a href='http://jquery.com' target='_blank' class='speasyforms-aboutlink'>jQuery v1.11.3</a><br />
                        Copyright 2005, 2014 <a href='http://jquery.org' target='_blank' class='speasyforms-aboutlink'>jQuery Foundation, Inc.</a> and other contributors, Licensed MIT 
                    </p>
                    <p>
                        <a href='http://jqueryui.com' target='_blank' class='speasyforms-aboutlink'>jQuery UI v1.11.4</a><br />
                        Copyright 2005, 2014 <a href='http://jquery.org' target='_blank' class='speasyforms-aboutlink'>jQuery Foundation, Inc.</a> and other contributors, Licensed MIT 
                    </p>
                    <p>
                        <a href='http://spservices.codeplex.com' target='_blank' class='speasyforms-aboutlink'>SPServices v2014.02</a><br />
                        Copyright (c) 2009-2013 <a href='http://www.sympraxisconsulting.com' target='_blank' class='speasyforms-aboutlink'>Sympraxis Consulting LLC</a>, written by 
                    <a href='http://sympmarc.com/' target='_blank' class='speasyforms-aboutlink'>Marc Anderson</a>, Licensed MIT
                    </p>
                    <p>
                        <a href='https://github.com/ilikenwf/nestedSortable' target='_blank' class='speasyforms-aboutlink'>jQuery UI Nested Sortable v2.0</a><br />
                        Copyright (c) 2010-2013 <a href='http://mjsarfatti.com/' target='_blank' class='speasyforms-aboutlink'>Manuele J Sarfatti</a>, Licensed MIT
                    </p>
                    <p>
                        <a href='https://github.com/molily/javascript-client-side-session-storage' target='_blank' class='speasyforms-aboutlink'>Session Storage Wrapper</a><br />
                        written by Mathias Schaefer, Licensed Public Domain
                    </p>
                    <p>
                        <a href='http://premiumsoftware.net/cleditor' target='_blank' class='speasyforms-aboutlink'>CLEditor WYSIWYG HTML Editor v1.4.5</a><br />
                        Copyright 2010, Chris Landowski, <a href='http://premiumsoftware.net/' target='_blank' class='speasyforms-aboutlink'>Premium Software, LLC</a>, Licensed MIT
                    </p>
                </div>
            </div>
            <div id='chooseContainerDialog' class='speasyforms-dialogdiv' title='Select the Container Type'>
                <label for='containerType'>Container Type:</label>
                <select id='containerType'>
                    <option></option>
                </select>
                <div id='chooseContainerError' class='speasyforms-error'>&nbsp;</div>
            </div>
            <div id='editFieldCollectionDialog' class='speasyforms-dialogdiv' title='Edit Field Collection Name'>
                <label for='fieldCollectionName'>Name</label>
                <input type='text' id='fieldCollectionName' name='fieldCollectionNames' />
                <input type='hidden' id='editFieldCollectionContainerId' value='' />
            </div>
            <div id='containerSettingsDialog' class='speasyforms-dialogdiv' title='Add Container'>
                <div style="margin-bottom: 10px">
                    <label for='settingsContainerName'>Name:</label>
                    <input type='text' id='settingsContainerName' name='settingsContainerName' />
                </div>
                <label for='settingsCollectionNames'>Field Collection Names (one per line):</label>
                <textarea id='settingsCollectionNames' rows='5' cols='50'></textarea>
                <input type='hidden' id='settingsContainerType' value='' />
                <input type='hidden' id='settingsContainerId' value='' />
            </div>
            <div id='conditonalVisibilityRulesDialog' class='speasyforms-dialogdiv' title='Conditional Visibility'>
                <input type='hidden' id='conditionalVisibilityField' name='conditionalVisibilityField' value='' />
                <table>
                    <tr>
                        <td>
                            <h3 id='conditionalVisibilityDialogHeader'>Visibility Rules for</h3>

                        </td>
                        <td>
                            <button id='addVisibilityRule'>Add Visibility Rule</button>
                        </td>
                    </tr>
                </table>
                <span id='conditionalVisibilityRules' class='speasyforms-condiotionalvisibility'></span>
            </div>
            <div id='addVisibilityRuleDialog' class='speasyforms-dialogdiv' title='Add/Edit Visibility Rule'>
                <input type='hidden' id='visibilityRuleIndex' value='' />
                <table>
                    <tr>
                        <td>
                            <label for='addVisibilityRuleField'>
                                Field Name <span class='ms-formvalidation' title='This is a required field'>*</span>

                            </label>
                        </td>
                        <td class='speasyforms-input'>
                            <input type='text' id='addVisibilityRuleField' name='addVisibilityRuleField' value='' disabled='disabled' />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label for='addVisibilityRuleState'>
                                State <span class='ms-formvalidation' title='This is a required field'>*</span>
                            </label>
                        </td>
                        <td class='speasyforms-input'>
                            <select id='addVisibilityRuleState'>
                                <option></option>
                            </select>
                            <br />
                            <span id='addVisibilityRuleStateError' class='speasyforms-error'></span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label for='spEasyFormsEntityPicker'>Applies To</label>
                        </td>
                        <td class='speasyforms-input'>
                            <input type='checkbox' id='addVisibilityRuleApplyToAuthor' name='addVisibilityRuleApplyToAuthor' />
                            <label for='addVisibilityRuleApplyToAuthor'>Author</label>
                            <br />
                            <div id='spEasyFormsEntityPicker' class='ui-helper-clearfix speasyforms-entitypicker'>
                                <input type='text' id='addVisibilityRuleApplyTo' name='addVisibilityRuleApplyTo' value='' class='speasyforms-entitypicker' />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Forms</td>
                        <td class='speasyforms-input'>
                            <input type='checkbox' id='addVisibilityRuleNewForm' name='addVisibilityRuleNewForm' class='speasyforms-formcb' value='' checked='checked' />
                            <label for='addVisibilityRuleNewForm'>New</label>
                            <input type='checkbox' id='addVisibilityRuleEditForm' name='addVisibilityRuleEditForm' class='speasyforms-formcb' value='' checked='checked' />
                            <label for='addVisibilityRuleEditForm'>Edit</label>
                            <input type='checkbox' id='addVisibilityRuleDisplayForm' name='addVisibilityRuleDisplayForm' class='speasyforms-formcb' value='' checked='checked' />
                            <label for='addVisibilityRuleDisplayForm'>Display</label>
                        </td>
                    </tr>
                    <tr>
                        <td>And When</td>
                        <td class='speasyforms-input'>
                            <div id='condition1' class='speasyforms-condition'>
                                <select id='conditionalField1' class='speasyforms-conditionalfield'>
                                    <option></option>
                                </select>
                                <select id='conditionalType1' class='speasyforms-conditionaltype'>
                                </select>
                                <input id='conditionalValue1' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                                <button id='spEasyFormsAddConditionalBtn' class='speasyforms-addconditional speasyforms-containerbtn' style='width: 25px; height: 25px;'></button>
                            </div>
                            <div id='condition2' class='speasyforms-condition'>
                                <select id='conditionalField2' class='speasyforms-conditionalfield'>
                                    <option></option>
                                </select>
                                <select id='conditionalType2' class='speasyforms-conditionaltype'>
                                </select>
                                <input id='conditionalValue2' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                            </div>
                            <div id='condition3' class='speasyforms-condition'>
                                <select id='conditionalField3' class='speasyforms-conditionalfield'>
                                    <option></option>
                                </select>
                                <select id='conditionalType3' class='speasyforms-conditionaltype'>
                                </select>
                                <input id='conditionalValue3' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div id='adapterTypeDialog' class='speasyforms-dialogdiv' title='Adapter Type Dialog'>
                There are multiple adapters for the type <span id='adapterFieldType'></span>. Choose which adapter type you want to apply to the field <span id='adapterInternalColumnName'></span>.
            <p>
                <label for='adapterType'>Adapter Type:</label>
                <select id='adapterType'>
                    <option></option>
                </select>
            </p>
            </div>
            <div id='cascadingLookupAdapterDialog' class='speasyforms-dialogdiv' title='Cascading Lookup'>
                <table>
                    <tr>
                        <td>Relationship List
                        </td>
                        <td class='speasyforms-input'>
                            <select id='cascadingRelationshipListSelect' title='Choose the list that contains the parent/child relationship.'>
                            </select>
                            <input type='hidden' name='cascadingLookupHiddenFieldName' id='cascadingLookupHiddenFieldName' value='' />
                        </td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>Parent Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='cascadingLookupRelationshipParentSelect' title='Choose parent column from the relationship list.'>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>Child Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='cascadingLookupRelationshipChildSelect' title='Choose child column from the relationship list.'>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>&nbsp;
                        </td>
                    </tr>
                    <tr>
                        <td>This List
                        </td>
                        <td>
                            <input type='text' id='cascadingLookupList' name='cascadingLookupList' value='' disabled='disabled' />
                        </td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>Form Parent Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='cascadingLookupParentSelect' title='Choose the field in this list that is the parent column of the relationship.'>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>Form Child Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='cascadingLookupChildSelect' title='Choose the field in this list that is the child column of the relationship.'>
                            </select>
                        </td>
                        <td></td>
                    </tr>
                </table>
            </div>
            <div id='autocompleteAdapterDialog' class='speasyforms-dialogdiv' title='Autocomplete'>
                <table>
                    <tr>
                        <td>Lookup List
                        </td>
                        <td class='speasyforms-input'>
                            <select id='autocompleteListSelect' title='Choose the list that data for the autocomplete field.'>
                            </select>
                            <input type='hidden' name='autoCompleteHiddenFieldName' id='autoCompleteHiddenFieldName' value='' />
                        </td>
                    </tr>
                    <tr>
                        <td>Lookup Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='autocompleteFieldSelect' title='Choose the field in the lookup list from which autocomplete data will be read.'>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>Form Column
                        </td>
                        <td class='speasyforms-input'>
                            <select id='autocompleteChildSelect' title='Choose the field in this list that is to be converted to a autocomplete.'>
                            </select>
                        </td>
                    </tr>
                </table>
            </div>
            <div id='importConfigurationDialog' class='speasyforms-dialogdiv' title='Import JSON'>
                <span>Type or paste JSON configuration into the following textbox, and hit OK.  Note that this 
                will replace any existing configuration and that no changes are committed until you hit
                the save button.
                </span>
                <textarea id='importedJson' rows='25' cols='80'></textarea>
            </div>
        </div>
        <div id='spEasyFormsTemplates' style='display: none'>
            <ol style='list-style-type: none'>
                <li class="speasyforms-nestedsortable-container ui-corner-all">
                    <div class="speasyforms-menudiv ui-accordion-header ui-state-default ui-corner-all">
                        <span class="speasyforms-nestedsortable-status ui-icon  ui-icon-triangle-1-s"></span>
                        <span>
                            <span class="speasyforms-itemtitle"></span>
                            <span class="speasyforms-itemtype"></span>
                            <span class="speasyforms-nestedsortable-delete ui-icon ui-icon-closethick"></span>
                            <span class="speasyforms-nestedsortable-edit ui-icon ui-icon-gear"></span>
                        </span>
                    </div>
                </li>
                <li class="speasyforms-nestedsortable-fieldcollection ui-corner-all speasyforms-nestedsortable-nochildren speasyforms-nestedsortable-needsparent">
                    <div class="speasyforms-menudiv ui-accordion-header ui-state-default ui-corner-all">
                        <span class="speasyforms-nestedsortable-status ui-icon  ui-icon-triangle-1-s"></span>
                        <span>
                            <span class="speasyforms-itemtitle"></span>
                            <span class="speasyforms-itemtype"></span>
                            <span class="speasyforms-nestedsortable-delete ui-icon ui-icon-closethick"></span>
                            <span class="speasyforms-nestedsortable-edit ui-icon ui-icon-gear"></span>
                        </span>
                    </div>
                    <div class="speasyforms-nestedsortable-content">
                    </div>
                </li>
                <li class="speasyforms-nestedsortable-defaultform speasyforms-nestedsortable-noparent speasyforms-nestedsortable-nochildren ui-corner-all">
                    <div class="speasyforms-menudiv ui-accordion-header ui-state-default ui-corner-all">
                        <span class="speasyforms-nestedsortable-status ui-icon  ui-icon-triangle-1-s"></span>
                        <span>
                            <span class="speasyforms-itemtitle"></span>
                            <span class="speasyforms-itemtype"></span>
                        </span>
                    </div>
                    <div class="speasyforms-nestedsortable-content">
                    </div>
                </li>
            </ol>
            <table width="100%" class="speasyforms-sortablefields speasyforms-fieldtabletemplate">
                <tbody class="speasyforms-sortablefields">
                    <tr>
                        <th class="speasyforms-fieldcell ui-widget-header ui-corner-all nobr">Display Name</th>
                        <th class="speasyforms-fieldcell speasyforms-hidden">Internal Name</th>
                        <th class="speasyforms-fieldcell speasyforms-fieldtype ui-widget-header ui-corner-all nobr">Field Type</th>
                        <th>&nbsp;</th>
                        <th>&nbsp;</th>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr class="speasyforms-sortablefields speasyforms-fieldrowtemplate ">
                        <td class="speasyforms-sortablefields speasyforms-fieldname  ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-sortablefields speasyforms-fieldinternal speasyforms-hidden  ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-sortablefields speasyforms-fieldtype  ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-icon-visibility ui-widget-content ui-corner-all">
                            <span class="speasyforms-icon-visibility ui-icon ui-icon-key"></span>
                        </td>
                        <td class="speasyforms-icon-adapter ui-widget-content ui-corner-all">
                            <span class="speasyforms-icon-adapter ui-icon ui-icon-wrench"></span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <style type="text/css">
            #DeltaPageStatusBar {
                display: none;
            }
        </style>
        <script type='text/javascript'>
            spefjQuery(window).bind('load', function () { spefjQuery.spEasyForms.init(); });
        </script>
        <!--<script type="text/javascript">
            clientContext = SP.ClientContext.get_current();
            document.getElementById("heading1").innerHTML = "Hello " + _spPageContextInfo.userLoginName + "!";
        </script>-->
        <SharePoint:FormDigest ID="FormDigest1" runat="server"></SharePoint:FormDigest>
    </form>
</body>
</html>
