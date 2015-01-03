<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderId='PlaceHolderPageTitle' runat='server'>
    <SharePoint:ProjectProperty Property='Title' runat='server'>- SharePoint Easy Forms Configuration</SharePoint:ProjectProperty>
</asp:Content>
<asp:Content ContentPlaceHolderId='PlaceHolderPageTitleInTitleArea' runat='server'>
    <span class='ms-WikiPageNameEditor-Display' id='listBreadCrumb'>
	</span>
    <span class='ms-WikiPageNameEditor-Display' id='wikiPageNameDisplay'>
	</span>
</asp:Content>
<asp:Content ContentPlaceHolderId='PlaceHolderAdditionalPageHead' runat='server'>
    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style>
        body {
            font-family: Verdana, Arial, sans-serif;
        }
        table.speasyforms-columns {
            width: 100%;
        }
        table.ms-formtable {
            padding: 5px;
            background: white;
            border-spacing: 10px;
        }
        table.ms-formtable tr {
            padding: 10px !important;
        }
        td.ms-formlabel {
            padding: 5px;
            text-align: right;
        }
        td.ms-formbody {
            border: 1px solid gray;
            padding: 0px;
            margin: 20px;
            width: 100%;
            /* hack fix for 2010 */
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
        }
        div.speasyforms-panel {
            width: 400px;
            height: 700px;
            overflow-x: hidden;
            overflow-y: scroll;
            background: #eee;
            position: fixed;
            float: left;
        }
        td.speasyforms-form,
        #toggleContext,
        #outputTable {
            padding-left: 405px;
        }
        td.speasyforms-sortablefields {
            width: 45%;
        }
        #contentRow {
            padding-top: 0px;
        }
        #contentBox {
            margin-left: 0px;
        }
        .speasyforms-form {
            vertical-align: top;
            padding: 0px 20px;
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
        .speasyforms-container {
            margin-top: 10px;
            margin-bottom: 20px;
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
            margin: 0px;
        }
        .formTabsList {
            background-color: #cdc0b0;
        }
        th.speasyforms-name {
            width: 100px;
            font-size: .8em;
        }
        table.speasyforms-fieldsheader {
            width: 100%;
        }
        td.speasyforms-headercell {
            width: 50%;
        }
        h1 {
            font-size: 1.8em;
            font-weight: normal;
        }
        h3.speasyforms-sortablefields {
            font-size: 1.2em;
            font-weight: normal;
        }
        table.speasyforms-editor {
            max-width: 1280px;
        }
        table.speasyforms-fieldstitle,
        table.speasyforms-sortablefields {
            width: 375px;
            margin-left: auto;
            margin-right: auto;
        }
        table.speasyforms-sortablerules {
            width: 80%;
        }
        tr.speasyforms-sortablefields,
        tr.speasyforms-sortablerules {
            border: 1px solid lightblue !important;
            cursor: move !important;
            background: white;
            font-size: .9em;
        }
        tr.speasyforms-sortablefields:hover, tr.speasyforms-sortablerules:hover {
            cursor: move !important;
            background: lightyellow !important;
        }
        table.speasyforms-sortablecontainers {
        }
        td.speasyforms-sortablecontainers {
            border: 1px solid lightblue !important;
            background: #dddddd !important;
            cursor: move !important;
        }
        td.speasyforms-sortablerules {
            border: 1px solid gray;
        }
        div.speasyforms-buttons {
            margin-top: 20px;
        }
        button.ui-button-icon-only {
            font-size: .8em;
            margin: 0px;
            padding: 0px;
            min-width: 0px;
        }
        td.speasyforms-conditionalvisibility,
        td.speasyforms-visibilityrulebutton {
            margin: 0px;
            padding: 0px;
            width: 1px;
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
        td.speasyforms-conditionalvisibility,
        td.speasyforms-adapter {
            background: #ddd;
            width: 1px;
        }
        td.speasyforms-visibilityrulebutton {
            background: #eee;
        }
        td.speasyforms-editor .ui-widget-content.tabs-min {
            background: transparent;
            border: none;
        }
        .ui-widget-header.tabs-min {
            background: transparent;
            border: none;
            border-bottom: 1px solid #c0c0c0;
            -moz-border-radius: 0px;
            -webkit-border-radius: 0px;
            border-radius: 0px;
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
        table.speasyforms-sortablecontainers {
            padding-top: 2px;
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
            background-color: #eaf4fd;
            border: 1px solid darkgrey;
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
            margin-top: 10px;
            margin-bottom: 10px;
            margin-right: auto;
            margin-left: auto;
        }
        table.speasyforms-credits {
            border: 1px solid darkgrey;
            margin: 20px;
            padding: 0px;
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
        table.speasyforms-fieldmissing,
        td.speasyforms-fieldmissing {
            background-color: #E28DA9 !important;
        }
        li.speasyforms-fieldmissing {
            border: 1px solid #E28DA9 !important;
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
            height: 91px;
            font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
            overflow: hidden;
            z-index: 110;
            position: absolute;
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
            height: 60px;
            padding: 3px;
        }
        .speasyforms-buttonouterdiv-smallimg {
            border: 1px solid #fcfcfc;
            padding: 0px 2px;
        }
        .speasyforms-buttonouterdiv-smallimg:hover, .speasyforms-buttonouterdiv:hover {
            border: 1px dotted darkblue !important;
            cursor: pointer !important;
        }
        .speasyforms-buttonimg {
            display: block;
            margin: auto;
            border: none;
        }
        .speasyforms-buttonsmallimg {
            border: none;
            position: relative;
            top: 3px;
            padding-right: 2px;
        }
        .speasyforms-buttonimgdisabled {
            opacity: 0.3;
            filter: alpha(opacity=30)
        }
        .speasyforms-buttontext {
            font-size: 1em;
            font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
            text-align: center;
            color: rgb(68, 68, 68);
        }
        .speasyforms-buttontextdisabled {
            color: gray;
        }
        .speasyforms-buttongroup {
            font-size: .9em;
            border-right: 1px dotted gray;
            height: 84px;
            float: left;
        }
        .speasyforms-buttongrptext {
            text-align: center;
            color: gray;
            clear: both;
        }
        .speasyforms-contenttype {
            margin-top: 3px;
        }
        #RibbonContainer-TabRowRight {
            display: none !important;
        }
        h2.speasyforms-breadcrumbs {
            float: left;
            padding: 3px;
            color: #333;
        }
        h2.speasyforms-breadcrumbs a,
        h2.speasyforms-breadcrumbs a: visited {
            color: #333;
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
            padding: 10px;
            border: 1px solid gray;
            overflow: auto;
        }
        #spEasyFormsContent {
            position: fixed;
            overflow-y: scroll;
            overflow-x: hidden;
            padding-right: 15px;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderId='PlaceHolderMiniConsole' runat='server'>
    <SharePoint:FormComponent TemplateName='WikiMiniConsole' ControlMode='Display' runat='server' id='WikiMiniConsole'></SharePoint:FormComponent>
</asp:Content>
<asp:Content ContentPlaceHolderId='PlaceHolderLeftActions' runat='server'>
    <SharePoint:RecentChangesMenu runat='server' id='RecentChanges'></SharePoint:RecentChangesMenu>
</asp:Content>
<asp:Content ContentPlaceHolderId='PlaceHolderMain' runat='server'>
    <div id='spEasyFormsBusyScreen'></div>
    <div id='spEasyFormsOuterDiv'>
        <table id='spEasyFormsEditor' class='speasyforms-editor'>
            <tr class='speasyforms-editor'>
                <td class='speasyforms-editor speasyforms-panel'>
                    <div class='speasyforms-panel'>
                        <table id='spEasyFormsContainerTable' class='speasyforms-sortablecontainers'>
                            <tbody class='speasyforms-sortablecontainers'></tbody>
                        </table>
                    </div>
                </td>
                <td class='speasyforms-editor speasyforms-form'>
                    <div id='spEasyFormsContent'>
                        <div id='tabs-min'>
                            <div id='tabs-min-form' class='tabs-min'>
                                <table class='ms-formtable' style='margin-top: 8px;' border='0'></table>
                            </div>
                            <div id='tabs-min-visibility' class='tabs-min' style='display:none'></div>
                            <div id='tabs-min-adapters' class='tabs-min' style='display:none'>
                                <table id='spEasyFormsAdapterTable' class='speasyforms-adapters'>
                                    <tr>
                                        <th>Display Name</th>
                                        <th class='speasyforms-hidden' style='display:none'>Internal Name</th>
                                        <th>Adapter Type</th>
                                        <th>Additional Settings</th>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
        <br />
    </div>
    <div id='spEasyFormsTextareaDiv'>
        <h3>JSON Configuration:</h3>
        <div id='spEasyFormsJson' class='speasyforms-json'><pre></pre>
        </div>
    </div>
    <div id='spEasyFormsRibbon' class='speasyforms-ribbon'>
        <div class='speasyforms-buttongroup'>
            <div id='spEasyFormsSaveButton' class='speasyforms-buttonouterdiv'>
                <img class='speasyforms-buttonimg speasyforms-buttonimgdisabled' src='/_layouts/images/save32x32.png' />
                <div class='speasyforms-buttontext speasyforms-buttontextdisabled'>Save</div>
            </div>
            <div id='spEasyFormsCancelButton' class='speasyforms-buttonouterdiv'>
                <img class='speasyforms-buttonimg' src='/_layouts/images/erroricon.png' />
                <div class='speasyforms-buttontext'>Cancel</div>
            </div>
            <div class='speasyforms-buttongrptext'>
                Commit
            </div>
        </div>
        <div class='speasyforms-buttongroup'>
            <div id='spEasyFormsContentType' class='speasyforms-contenttype speasyforms-controlouterdiv'>
                <label for='spEasyFormsContentTypeSelect' class='nobr'>Content Type:</label>
                <br />
                <select id='spEasyFormsContentTypeSelect' class='speasyforms-contenttype'>
                </select>
            </div>
            <div class='speasyforms-buttoncontainer'>
                <div id='spEasyFormsAddButton' class='speasyforms-buttonouterdiv-smallimg'>
                    <img width='16px' height='16px' class='speasyforms-buttonsmallimg' src='/_layouts/images/caladd.gif' />Add Container
                </div>
                <div id='spEasyFormsUndoButton' class='speasyforms-buttonouterdiv-smallimg speasyforms-buttontextdisabled'>
                    <img width='16px' height='16px' class='speasyforms-buttonsmallimg  speasyforms-buttonimgdisabled' src='/_layouts/images/undohs.png' />Undo
                </div>
                <div id='spEasyFormsRedoButton' class='speasyforms-buttonouterdiv-smallimg speasyforms-buttontextdisabled'>
                    <img width='16px' height='16px' class='speasyforms-buttonsmallimg  speasyforms-buttonimgdisabled' src='/_layouts/images/redohs.png' />Redo
                </div>
            </div>
            <div class='speasyforms-buttongrptext'>
                Edit
            </div>
        </div>
        <div class='speasyforms-buttongroup'>
            <div id='spEasyFormsFormButton' class='speasyforms-buttonouterdiv'>
                <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/create.gif' />
                <div class='speasyforms-buttontext'>Form</div>
            </div>
            <div id='spEasyFormsConditionalVisibilityButton' class='speasyforms-buttonouterdiv'>
                <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/centraladmin_security_generalsecurity_32x32.png' />
                <div class='speasyforms-buttontext'>Conditional
                    <br />Visibility</div>
            </div>
            <div id='spEasyFormsFieldAdaptersButton' class='speasyforms-buttonouterdiv'>
                <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/cenadmin.ico' />
                <div class='speasyforms-buttontext'>Field
                    <br />Adapters</div>
            </div>
            <div class='speasyforms-buttoncontainer'>
                <div id='spEasyFormsExpandButton' class='speasyforms-buttonouterdiv-smallimg'>
                    <img width='16px' height='16px' class='speasyforms-buttonsmallimg' src='/_layouts/images/ApOpenThisLocation.gif' />Expand
                </div>
                <div id='spEasyFormsCollapseButton' class='speasyforms-buttonouterdiv-smallimg'>
                    <img height='16px' width='16px' class='speasyforms-buttonsmallimg' src='/_layouts/images/FLDRNEW.GIF' />Collapse
                </div>
            </div>
            <div class='speasyforms-buttongrptext'>
                View
            </div>
        </div>
        <div class='speasyforms-buttongroup'>
            <a href='javascript:void(0)' id='spEasyFormsExportLink'>
                <div id='spEasyFormsExportButton' class='speasyforms-buttonouterdiv'>
                    <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/icongo01.gif' />
                    <div class='speasyforms-buttontext'>Export</div>
                </div>
            </a>
            <div id='spEasyFormsImportButton' class='speasyforms-buttonouterdiv'>
                <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/icongo01rtl.gif' />
                <div class='speasyforms-buttontext'>Import</div>
            </div>
            <div class='speasyforms-buttoncontainer'>
                <div id='spEasyFormsClearCacheButton' class='speasyforms-buttonouterdiv-smallimg'>
                    <img width='16px' height='16px' class='speasyforms-buttonsmallimg' src='/_layouts/images/comdel.gif' />Clear Cache
                </div>
                <div id='spEasyFormsVerboseButton' class='speasyforms-buttonouterdiv-smallimg'>
                    <img height='16px' width='16px' class='speasyforms-buttonsmallimg' src='/_layouts/images/css16.gif' />Verbose
                </div>
            </div>
            <div class='speasyforms-buttongrptext'>
                Tools
            </div>
        </div>
        <div class='speasyforms-buttongroup'>
            <div id='spEasyFormsAboutButton' class='speasyforms-buttonouterdiv'>
                <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/mewa_infob.gif' />
                <div class='speasyforms-buttontext'>About</div>
            </div>
            <a href='javascript:void(0)' id='spEasyFormsHelpLink'>
                <div id='spEasyFormsHelpButton' class='speasyforms-buttonouterdiv'>
                    <img width='32px' height='32px' class='speasyforms-buttonimg' src='/_layouts/images/lg_ichlp.gif' />
                    <div class='speasyforms-buttontext'>Help</div>
                </div>
            </a>
            <div class='speasyforms-buttongrptext'>
                Info
            </div>
        </div>
    </div>
    <script type='text/javascript'>
        spefjQuery('#RibbonContainer').append(spefjQuery('#spEasyFormsRibbon'));
    </script>
    <div id='spEasyFormsContainerDialogs'>
        <div id='spEasyFormsErrorDialog' class='speasyforms-dialogdiv' title=''>
        </div>
        <div id='spEasyFormsInitializationError' style='display:none'>
            <h3>SPEasyForms Initialization Error</h3>
            <p>
                We're not sure how you got here, but the current list context is of a type that is not supported by SPEasyForms.
            </p>
        </div>
        <div id='spEasyFormsAboutDialog' class='tabs-min' style='display:none' title='About SPEasyForms'>
            <div class='speasyforms-helptext ui-corner-all'>
                <p><b>Version: 2014.01</b>
                </p>
                <h2>The MIT License (MIT)</h2>
                <p>Copyright (c) 2014 Joe McShea</p>
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
                    <a href='http://jquery.com' target='_blank' class='speasyforms-aboutlink'>jQuery</a><br /> 
                    Copyright 2005, 2014 <a href='http://jquery.org' target='_blank' class='speasyforms-aboutlink'>jQuery Foundation, Inc.</a> and other contributors, Licensed MIT 
                </p>
                <p>
                    <a href='http://jqueryui.com' target='_blank' class='speasyforms-aboutlink'>jQuery UI</a><br /> 
                    Copyright 2005, 2014 <a href='http://jquery.org' target='_blank' class='speasyforms-aboutlink'>jQuery Foundation, Inc.</a> and other contributors, Licensed MIT 
                </p>
                <p>
                    <a href='http://spservices.codeplex.com' target='_blank' class='speasyforms-aboutlink'>SPServices</a><br />
                    Copyright (c) 2009-2013 <a href='http://www.sympraxisconsulting.com' target='_blank' class='speasyforms-aboutlink'>Sympraxis Consulting LLC</a>, written by 
                    <a href='http://sympmarc.com/' target='_blank' class='speasyforms-aboutlink'>Marc Anderson</a>, Licensed MIT
                </p>
                <p>
                    <a href='https://github.com/molily/javascript-client-side-session-storage' target='_blank' class='speasyforms-aboutlink'>Session Storage Wrapper</a><br />
                    written by Mathias Schaefer, Licensed Public Domain
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
        <div id='addMultiGroupContainerDialog' class='speasyforms-dialogdiv' title='Add Container'>
            <label for='addFieldCollectionNames'>Field Collection Names (one per line):</label>
            <textarea id='addFieldCollectionNames' rows='5' cols='50'></textarea>
            <input type='hidden' id='addMultiGroupContainerType' value='' />
            <div id='addMultiGroupContainerError' class='speasyforms-error'></div>
        </div>
        <div id='addFieldCollectionsToContainerDialog' class='speasyforms-dialogdiv' title='Add Field Collections'>
            <label for='addFieldCollectionNames2'>Field Collection Names (one per line):</label>
            <textarea id='addFieldCollectionNames2' rows='5' cols='50'></textarea>
            <input type='hidden' id='addFieldCollectionsContainerId' value='' />
            <div id='addFieldCollectionsToContainerDialogError' class='speasyforms-error'></div>
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
            </table> <span id='conditionalVisibilityRules' class='speasyforms-condiotionalvisibility'></span>
        </div>
        <div id='addVisibilityRuleDialog' class='speasyforms-dialogdiv' title='Add/Edit Visibility Rule'>
            <input type='hidden' id='visibilityRuleIndex' value='' />
            <table>
                <tr>
                    <td>
                        <label for='addVisibilityRuleField'>Field Name <span class='ms-formvalidation' title='This is a required field'> *</span>

                        </label>
                    </td>
                    <td class='speasyforms-input'>
                        <input type='text' id='addVisibilityRuleField' name='addVisibilityRuleField' value='' disabled='disabled' />
                    </td>
                </tr>
                <tr>
                    <td>
                        <label for='addVisibilityRuleState'>State <span class='ms-formvalidation' title='This is a required field'> *</span>
                        </label>
                    </td>
                    <td class='speasyforms-input'>
                        <select id='addVisibilityRuleState'>
                            <option></option>
                        </select>
                        <br /> <span id='addVisibilityRuleStateError' class='speasyforms-error'></span>
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
                            <button id='spEasyFormsAddConditionalBtn' class='speasyforms-addconditional speasyforms-containerbtn' style='width:25px;height:25px;'></button>
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
                    <option>
                        <option>
                </select>
            </p>
        </div>
        <div id='cascadingLookupAdapterDialog' class='speasyforms-dialogdiv' title='Cascading Lookup'>
            <table>
                <tr>
                    <td>
                        Relationship List
                    </td>
                    <td class='speasyforms-input'>
                        <select id='cascadingRelationshipListSelect' title='Choose the list that contains the parent/child relationship.'>
                        </select>
                        <input type='hidden' name='cascadingLookupHiddenFieldName' id='cascadingLookupHiddenFieldName' value='' />
                    </td>
                    <td>
                    </td>
                </tr>
                <tr>
                    <td>
                    </td>
                    <td>
                        Parent Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='cascadingLookupRelationshipParentSelect' title='Choose parent column from the relationship list.'>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                    </td>
                    <td>
                        Child Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='cascadingLookupRelationshipChildSelect' title='Choose child column from the relationship list.'>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                        &nbsp;
                    </td>
                </tr>
                <tr>
                    <td>
                        This List
                    </td>
                    <td>
                        <input type='text' id='cascadingLookupList' name='cascadingLookupList' value='' disabled='disabled' />
                    </td>
                    <td>
                    </td>
                </tr>
                <tr>
                    <td>
                    </td>
                    <td>
                        Form Parent Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='cascadingLookupParentSelect' title='Choose the field in this list that is the parent column of the relationship.'>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                    </td>
                    <td>
                        Form Child Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='cascadingLookupChildSelect' title='Choose the field in this list that is the child column of the relationship.'>
                        </select>
                    </td>
                    <td>
                    </td>
                </tr>
            </table>
        </div>
        <div id='autocompleteAdapterDialog' class='speasyforms-dialogdiv' title='Autocomplete'>
            <table>
                <tr>
                    <td>
                        Lookup List
                    </td>
                    <td class='speasyforms-input'>
                        <select id='autocompleteListSelect' title='Choose the list that data for the autocomplete field.'>
                        </select>
                        <input type='hidden' name='autoCompleteHiddenFieldName' id='autoCompleteHiddenFieldName' value='' />
                    </td>
                </tr>
                <tr>
                    <td>
                        Lookup Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='autocompleteFieldSelect' title='Choose the field in the lookup list from which autocomplete data will be read.'>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                        Form Column
                    </td>
                    <td class='speasyforms-input'>
                        <select id='autocompleteChildSelect' title='Choose the field in this list that is to be converted to a autocomplete.'>
                        </select>
                    </td>
                </tr>
            </table>
        </div>
        <div id='importConfigurationDialog' class='speasyforms-dialogdiv' title='Import JSON'>
            <span>
                Type or paste JSON configuration into the following textbox, and hit OK.  Note that this 
                will replace any existing configuration and that no changes are committed until you hit
                the save button.
            </span>
            <textarea id='importedJson' rows='25' cols='80'></textarea>
        </div>
    </div>
</asp:Content>