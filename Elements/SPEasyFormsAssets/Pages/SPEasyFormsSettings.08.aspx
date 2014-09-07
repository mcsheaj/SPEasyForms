
<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c"%> <%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master"       %> <%@ Import Namespace="Microsoft.SharePoint.WebPartPages" %> <%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %> <%@ Import Namespace="Microsoft.SharePoint" %> <%@ Assembly Name="Microsoft.Web.CommandUI, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitle" runat="server">
	<SharePoint:ProjectProperty Property="Title" runat="server"/> - SharePoint Easy Forms Configuration
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderPageTitleInTitleArea" runat="server">
	<span class="ms-WikiPageNameEditor-Display" id='listBreadCrumb'>
	</span>
	<span class="ms-WikiPageNameEditor-Display" id='wikiPageNameDisplay'>
	</span>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderAdditionalPageHead" runat="server">
	<meta name="CollaborationServer" content="SharePoint Team Web Site" />
    <style>
        body {
            font-family: Verdana, Arial, sans-serif;
            font-size: .7em;
        }

        table.speasyforms-columns {
            width: 100%;
        }
        
        table.ms-formtable {
            padding: 5px;
            background: white;
            border-spacing: 10px;
        }

        tabel.ms-formtable tr {
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
            width: 100%; /* hack fix for 2010 */
        }

        .ui-accordion .ui-accordion-content {
            overflow: auto;
        }

        .ui-button {
            font-size: .9em;
            margin: 5px 0px;
        }

        .ui-menu .ui-menu-item, .nobr {
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

        .speasyforms-form {
            vertical-align: top;
            padding:0px 20px;
            width: 100%;
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
            /*width: "100%";*/
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
            font-size: 12px;
            background-color: #cdc0b0;
        }

        th.speasyforms-name {
            width: 100px;
        }

        table.speasyforms-fieldsheader {
            width: 100%;
        }

        td.speasyforms-headercell {
            width: 50%;
        }

        h1, h3.speasyforms-sortablefields {
            margin: 4px;
            padding: 5px 0px 0px 0px;
            font-weight: normal;
        }

        table.speasyforms-editor {
            width: 1024px;
        }
        
        table.speasyforms-fieldstitle, table.speasyforms-sortablefields {
            width: 100%;
        }

        table.speasyforms-sortablerules {
            width: 80%;
        }
        
        tr.speasyforms-sortablefields, tr.speasyforms-sortablerules {
            border: 1px solid lightblue !important;
            cursor: move !important;
            background: white;
        }

            tr.speasyforms-sortablefields:hover, tr.speasyforms-sortablerules:hover {
                cursor: move !important;
                background: lightyellow !important;
            }

        table.speasyforms-sortablecontainers {
            width: 400px;
        }

        td.speasyforms-sortablecontainers {
            border: 1px solid lightblue !important;
            background: #dddddd !important;
            cursor: move !important;
            padding-bottom: 30px;
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

        td.speasyforms-conditionalvisibility, td.speasyforms-visibilityrulebutton {
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

        td.speasyforms-conditionalvisibility, td.speasyforms-adapter {
            background: #ddd;
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
            padding-top: 10px;
        }
        
        td.speasyforms-blank {
            width: 47px;
            background-color: #ddd;
        }
        table.speasyforms-adapter, td.speasyforms-visibility {
            background-color: #eaf4fd;
            border: 1px solid darkgrey;
            width: 100%;
            margin-top: 15px;
            padding: 10px;
        }
        td.speasyforms-staticrules, td.speasyforms-adapter-static {
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
        table.speasyforms-fieldmissing, td.speasyforms-fieldmissing {
            background-color: #E28DA9 !important;
        }
        li.speasyforms-fieldmissing {
            border: 1px solid #E28DA9 !important;
        }
        div.speasyforms-contenttype {
            padding-top: 10px;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderMiniConsole" runat="server">
	<SharePoint:FormComponent TemplateName="WikiMiniConsole" ControlMode="Display" runat="server" id="WikiMiniConsole"/>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderLeftActions" runat="server">
	<SharePoint:RecentChangesMenu runat="server" id="RecentChanges"/>
</asp:Content>
<asp:Content ContentPlaceHolderId="PlaceHolderMain" runat="server">
<div id='spEasyFormsInitializationError' style='display:none'>
    <h3>SPEasyForms Initialization Error</h3>
    <p>
    We're not sure how you got here, but the current list context is of a type that
    is not supported by SPEasyForms.
    </p>
</div>
<div id="spEasyFormsOuterDiv">
    <table id='spEasyFormsEditor' class='speasyforms-editor'>
        <tr class='speasyforms-editor'>
            <td class='speasyforms-editor speasyforms-panel'>
                <div id="spEasyFormsButtons" class='speasyforms-buttons'>
                    <button id="spEasyFormsAddBtn" class="speasyforms-add"></button>
                    <button id="spEasyFormsExpandBtn" class="speasyforms-expand"></button>
                    <button id="spEasyFormsCollapseBtn" class="speasyforms-collapse"></button>
                    <button id="spEasyFormsSaveBtn" class="speasyforms-save"></button>
                </div>
                <div id="spEasyFormsContentType" class='speasyforms-contenttype'>
                    <label for="spEasyFormsContentTypeSelect">Content Type</label>
                    <select id="spEasyFormsContentTypeSelect" class='speasyforms-contenttype'>
                        
                    </select>
                </div>
                <table id='spEasyFormsContainerTable' class='speasyforms-sortablecontainers'>
                    <tbody class='speasyforms-sortablecontainers'></tbody>
                </table>
                <div id="spEasyFormsButtons1" class='speasyforms-buttons'>
                    <button id="spEasyFormsAddBtn1" class="speasyforms-add"></button>
                    <button id="spEasyFormsExpandBtn1" class="speasyforms-expand"></button>
                    <button id="spEasyFormsCollapseBtn1" class="speasyforms-collapse"></button>
                    <button id="spEasyFormsSaveBtn1" class="speasyforms-save"></button>
                </div>
                <div id='spEasyFormsContainerDialogs'>
                    <div id="errorDialog" class="speasyforms-dialogdiv" title="">
                    </div>
                    <div id="chooseContainerDialog" class="speasyforms-dialogdiv" title="Select the Container Type">
                        <label for="containerType">Container Type:</label>
                        <select id="containerType">
                            <option></option>
                        </select>
                        <div id='chooseContainerError' class='speasyforms-error'>&nbsp;</div>
                    </div>
                    <div id="editFieldCollectionDialog" class="speasyforms-dialogdiv" title="Edit the Name of the Field Group">
                        <label for="fieldCollectionName">Name</label>
                        <input type="text" id="fieldCollectionName" name="fieldCollectionNames" />
                        <input type='hidden' id='editFieldCollectionContainerId' value='' />
                    </div>
                    <div id='addMultiGroupContainerDialog' class='speasyforms-dialogdiv' title='Add Container'>
                        <label for='addFieldCollectionNames'>Field Group Names (one per line):</label>
                        <textarea id='addFieldCollectionNames' rows='5' cols='50'></textarea>
                        <input type='hidden' id='addMultiGroupContainerType' value='' />
                        <div id='addMultiGroupContainerError' class='speasyforms-error'></div>
                    </div>
                    <div id='addFieldCollectionsToContainerDialog' class='speasyforms-dialogdiv' title='Add Field Groups'>
                        <label for='addFieldCollectionNames2'>Field Group Names (one per line):</label>
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
                        </table> <span id='conditionalVisibilityRules' class='speasyforms-condi"tionalvisibility'></span>

                        <p />
                    </div>
                    <div id='addVisibilityRuleDialog' class='speasyforms-dialogdiv' title='Add/Edit Visibility Rule'>
                        <input type='hidden' id='visibilityRuleIndex' value='' />
                        <table>
                            <tr>
                                <td>
                                    <label for='addVisibilityRuleField'>Field Name <span class="ms-formvalidation" title="This is a required field"> *</span>

                                    </label>
                                </td>
                                <td class='speasyforms-input'>
                                    <input type='text' id='addVisibilityRuleField' name='addVisibilityRuleField' value='' disabled="disabled" />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label for='addVisibilityRuleState'>State <span class="ms-formvalidation" title="This is a required field"> *</span>

                                    </label>
                                </td>
                                <td class='speasyforms-input'>
                                    <select id='addVisibilityRuleState'>
                                        <option></option>
                                        <option>Hidden</option>
                                        <option>ReadOnly</option>
                                        <option>Editable</option>
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
                                    <div id="spEasyFormsEntityPicker" class="ui-helper-clearfix speasyforms-entitypicker">
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
                                            <option>Matches</option>
                                            <option value='NotMatches'>Does Not Match</option>
                                            <option>Equals</option>
                                        </select>
                                        <input id='conditionalValue1' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                                        <button id="spEasyFormsAddConditionalBtn" class="speasyforms-addconditional speasyforms-containerbtn" style='width:25px;height:25px;'></button>
                                    </div>
                                    <div id='condition2' class='speasyforms-condition'>
                                        <select id='conditionalField2' class='speasyforms-conditionalfield'>
                                            <option></option>
                                        </select>
                                        <select id='conditionalType2' class='speasyforms-conditionaltype'>
                                            <option>Matches</option>
                                            <option value='NotMatches'>Does Not Match</option>
                                            <option>Equals</option>
                                        </select>
                                        <input id='conditionalValue2' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                                    </div>
                                    <div id='condition3' class='speasyforms-condition'>
                                        <select id='conditionalField3' class='speasyforms-conditionalfield'>
                                            <option></option>
                                        </select>
                                        <select id='conditionalType3' class='speasyforms-conditionaltype'>
                                            <option>Matches</option>
                                            <option value='NotMatches'>Does Not Match</option>
                                            <option>Equals</option>
                                        </select>
                                        <input id='conditionalValue3' type='text' name='conditionalValue1' value='' class='speasyforms-conditionalvalue' />
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div id='adapterTypeDialog' class="speasyforms-dialogdiv" title='Adapter Type Dialog'>
                        There are multiple adapters for the type <span id='adapterFieldType'></span>.  Choose
                        which adapter type you want to apply to the field <span id='adapterInternalColumnName'></span>.
                        <p>
                            <label for='adapterType'>Adapter Type:</label>
                            <select id='adapterType'>
                                <option><option>
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
                                    <select id="cascadingRelationshipListSelect" title="Choose the list that contains the parent/child relationship.">
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
                                    <select id="cascadingLookupRelationshipParentSelect" title="Choose parent column from the relationship list.">
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
                                    <select id="cascadingLookupRelationshipChildSelect" title="Choose child column from the relationship list.">
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
                                    <select id="cascadingLookupParentSelect" title="Choose the field in this list that is the parent column of the relationship.">
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
                                    <select id="cascadingLookupChildSelect" title="Choose the field in this list that is the child column of the relationship.">
                                    </select>
                                </td>
                                <td>
                                </td>
                            </tr>
                        </table>
                        <p />
                    </div>
                    <div id='autocompleteAdapterDialog' class='speasyforms-dialogdiv' title='Autocomplete'>
                        <table>
                            <tr>
                                <td>
                                    Lookup List
                                </td>
                                <td class='speasyforms-input'>
                                    <select id="autocompleteListSelect" title="Choose the list that data for the autocomplete field.">
                                    </select>
                                    <input type='hidden' name='autoCompleteHiddenFieldName' id='autoCompleteHiddenFieldName' value='' />
                                </td>
                            </tr>
                           <tr>
                               <td>
                                   Lookup Column
                               </td>
                               <td class='speasyforms-input'>
                                   <select id="autocompleteFieldSelect" title="Choose the field in the lookup list from which autocomplete data will be read.">
                                   </select>
                               </td>
                            </tr>
                           <tr>
                               <td>
                                   Form Column
                               </td>
                               <td class='speasyforms-input'>
                                   <select id="autocompleteChildSelect" title="Choose the field in this list that is to be converted to a autocomplete.">
                                   </select>
                               </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </td>
            <td class='speasyforms-editor speasyforms-form'>
                <div id="tabs-min" class="tabs-min">
                    <ul class="tabs-min">
                        <li><a href="#tabs-min-form" class="tabs-min">Form</a>
                        </li>
                        <li id='visibilityTab'><a href="#tabs-min-visibility" class="tabs-min">Conditional Visibility</a>
                        </li>
                         <li id='adapterTab'><a href="#tabs-min-adapters" class="tabs-min">Field Adapters</a>
                        </li>
                         <li><a href="#tabs-min-about" class="tabs-min">About</a>
                        </li>
                    </ul>
                    <div id="tabs-min-form" class="tabs-min">
                        <table class="ms-formtable" style="margin-top: 8px;" border="0"></table>
                    </div>
                    <div id="tabs-min-visibility" class="tabs-min"></div>
                    <div id="tabs-min-adapters" class="tabs-min">
                        <table id="spEasyFormsAdapterTable" class="speasyforms-adapters">
                            <tr>
                                <th>Display Name</th>
                                <th>Internal Name</th>
                                <th>AdapterType</th>
                            </tr>
                        </table>
                    </div>
                    <div id="tabs-min-about" class="tabs-min">
<p><b>Version: 2014.00.07.f Alpha</b></p>
<h2>The MIT License (MIT)</h2>

<p>Copyright (c) 2014 Joe McShea</p>
<p>
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
</p><p>
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
</p><p>
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
</p>
<h2>Team</h2>
<table class='speasyforms-credits'>
    <tr>
        <td class='speasyforms-credit'>Joe McShea</td>
        <td class='speasyforms-creditdescription'>Developer (and/or development team if you prefer).</td>
    </tr>
    <tr>
        <td class='speasyforms-credit'>Scott Shearer</td>
        <td class='speasyforms-creditdescription'>SharePoint Concierge (I don't 
        know what it means either, but he's basically chief bottle washer and cook, 
        i.e. evangelist, requirements, tester, documenter, videographer...maybe even sometimes
            developer, no code solutions aside).</td>
    </tr>
</table>
<h2>Credits</h2>
<p class='speasyforms-credits'>
    I'm a developer, and I believe that if the American Indians had a name for
    developer it would be something like 'steals lots of code'.  But stealing code 
    is one thing, taking credit for it is another, thus these credits.  
</p>
<p class='speasyforms-credits'><span class='speasyforms-credits'>Please Note:</span> 
    the following people/organizations are in no way associated with the 
    SPEasyForms project, and have probably never heard of it.  So anything you 
    don't like about SPEasyForms is our fault, anything you do like is partially 
    due to their independent efforts.
</p>
<table class='speasyforms-credits'>
    <tr>
        <td class='speasyforms-credit'><a class='speasyforms-credits' href='http://sympmarc.com/' target='_blank'>Marc Anderson</a></td>
        <td class='speasyforms-creditdescription'>This project relies pretty 
            heavily on <a class='speasyforms-credits' href='http://spservices.codeplex.com/' target='_blank'>SPServices</a>. 
            Someday I might refactor it to use SharePoint's RESTful web 
            services, but I only know enough to consider that due to
            countless hours of pouring over Marc's code over the years.
        </td>
    </tr>
    <tr>
        <td class='speasyforms-credit'><a class='speasyforms-credits' href='http://www.sharepointhillbilly.com' target='_blank'>Mark Rackley</a></td>
        <td class='speasyforms-creditdescription'> We haven't actually used any of his code,
            but we have liberally borrowed without asking from his blog over the years and gained tidbits
            that made this easier by attending his presentations.  For a more flexible custom form
            solution that requires a bit more work on your part, check out his
            <a class='speasyforms-credits' href='http://forms7.codeplex.com/' target='_blank'>Forms 7</a> project. 
        </td>
    </tr>
    <tr>
        <td class='speasyforms-credit'>Mathias Schaefer</td>
        <td class='speasyforms-creditdescription'> All the web service calls made 
        this project way too slow to be useful until I started using (and quite 
        possibly abusing) his cross-page JavaScript caching library called
        <a class='speasyforms-credits' href='https://github.com/molily/javascript-client-side-session-storage' target='_blank'>Session Storage Wrapper</a>. 
        </td>
    </tr>
    <tr>
        <td class='speasyforms-credit'>The jQuery Foundation</td>
        <td class='speasyforms-creditdescription'> This project obviously makes heavy use of
        <a href='http://jquery.com/' class='speasyforms-credits' target='_blank'>jQuery</a>
        and <a href='http://jqueryui.com/' class='speasyforms-credits' target='_blank'>jQuery UI</a>. 
        </td>
    </tr>
</table>
<h2>Developer Functions</h2>
<div>
    <button id="spEasyFormsClearCacheBtn" class="speasyforms-clearcache"
        title="Clear the cross-page cache object. The page will be reloaded and all context information will be refreshed, which could take some time.">
    </button>
    <button id="spEasyFormsVerboseBtn" class="speasyforms-clearcache"
        title="Reload the page in verbose mode. This just adds an HTTP GET parameter, outputs a bunch of context junk at the bottom of the page, and runs SPServices functions with debug equal to true.">
    </button>
    <!--button id="spEasyFormsInitAsyncBtn" class="speasyforms-clearcache"
        title="Initialize the context using asnchronous Ajax calls and promises.  This is experimental and may actually cause performance problems at the moment.  Like verbose, it just adds an HTTP GET argument and reloads the page.">
    </button-->
</div>
                <br />
                <br />
                    </div>
                </div>
            </td>
            <td></td>
        </tr>
    </table>
    <div id="spEasyFormsTextareaDiv">
         <h3>JSON Configuration:</h3>

        <div id="spEasyFormsJson" class="speasyforms-json"><pre></pre>
        </div>
    </div>
</div>
</asp:Content>