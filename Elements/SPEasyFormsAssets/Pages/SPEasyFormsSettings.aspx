<%@ Import Namespace="Microsoft.SharePoint.Publishing" %>
<%@ Register TagPrefix="asp" Namespace="System.Web.UI" Assembly="System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.Publishing.PublishingLayoutPage,Microsoft.SharePoint.Publishing,Version=14.0.0.0, Culture=neutral,PublicKeyToken=71e9bce111e9429c" %>

<asp:content runat="server" contentplaceholderid="PlaceHolderPageTitle">
    SPEasyForms Settings
</asp:content>

<asp:content runat="server" contentplaceholderid="PlaceHolderPageTitleInTitleArea">
    <h2>SPEasyForms Settings</h2>
</asp:content>

<asp:content runat="server" contentplaceholderid="PlaceHolderAdditionalPageHead">
    <style>
        body {
            font-family: Verdana, Arial, sans-serif;
            font-size: .7em;
        }

        table.ms-formtable {
            padding: 5px;
            background: white;
            border-spacing: 10px;
        }

        tabel.ms-formtable tr {
            border: 1px solid red;
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
        }

        .ui-accordion .ui-accordion-content {
            overflow: auto;
        }

        .ui-button {
            font-size: .9em;
            margin: 5px 0px;
        }

        .ui-menu .ui-menu-item {
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
            padding:30px 20px;
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

        .spEasyFormsOuterDiv {
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

        table.speasyforms-fieldstitle, table.speasyforms-editor, table.speasyforms-sortablefields {
            width: 100%;
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
            font-size: 8px;
            margin: 0px;
            padding: 0px;
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

        td.speasyforms-conditionalvisibility {
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

        td.speasyforms-staticrules {
            text-align: left;
            border: 1px solid gray;
        }

        #spEasyFormsTextareaDiv {
            display: none;
        }

        h3.speasyforms-staticrules {
            margin-top: 20px;
        }

        td.speasyforms-staticrules {
            padding: 5px 10px;
        }
    </style>
</asp:content>

<asp:content runat="server" contentplaceholderid="PlaceHolderMain">
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
                        <div id="chooseContainerDialog" class="speasyforms-dialogdiv" title="Select the Container Type">
                            <label for="containerType">Container Type:</label>
                            <select id="containerType">
                                <option></option>
                            </select>
                            <div id='chooseContainerError' class='speasyforms-error'>&nbsp;</div>
                        </div>
                        <div id="editFieldGroupDialog" class="speasyforms-dialogdiv" title="Edit the Name of the Field Group">
                            <label for="fieldGroupName">Name</label>
                            <input type="text" id="fieldGroupName" name="fieldGroupNames" />
                            <input type='hidden' id='editFieldGroupContainerId' value='' />
                        </div>
                        <div id='addMultiGroupContainerDialog' class='speasyforms-dialogdiv' title='Add Container'>
                            <label for='addFieldGroupNames'>Field Group Names (one per line):</label>
                            <textarea id='addFieldGroupNames' rows='5' cols='50'></textarea>
                            <input type='hidden' id='addMultiGroupContainerType' value='' />
                            <div id='addMultiGroupContainerError' class='speasyforms-error'></div>
                        </div>
                        <div id='addFieldGroupsToContainerDialog' class='speasyforms-dialogdiv' title='Add Field Groups'>
                            <label for='addFieldGroupNames2'>Field Group Names (one per line):</label>
                            <textarea id='addFieldGroupNames2' rows='5' cols='50'></textarea>
                            <input type='hidden' id='addFieldGroupsContainerId' value='' />
                            <div id='addFieldGroupsToContainerDialogError' class='speasyforms-error'></div>
                        </div>
                        <div id='layoutSavedDialog' class='speasyforms-dialogdiv' title='Configuration Saved'> <span>Your configuration was successfully saved.</span>

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
                                        <label for='addVisibilityRuleField'>
                                            Field Name <span class="ms-formvalidation" title="This is a required field"> *</span>
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
                                    <td>
                                        Forms
                                    </td>
                                    <td class='speasyforms-input'>
                                            <input type='checkbox' id='addVisibilityRuleNewForm' name='addVisibilityRuleNewForm' class='speasyforms-formcb' value='' checked='checked' />
                                            <label for='addVisibilityRuleNewForm'>New</label>
                                            <input type='checkbox' id='addVisibilityRuleEditForm' name='addVisibilityRuleEditForm' class='speasyforms-formcb' value='' checked='checked' />
                                            <label for='addVisibilityRuleEditForm'>Edit</label>
                                            <input type='checkbox' id='addVisibilityRuleDisplayForm' name='addVisibilityRuleDisplayForm' class='speasyforms-formcb' value='' checked='checked' />
                                            <label for='addVisibilityRuleDisplayForm'>Display</label>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td class='speasyforms-editor speasyforms-form'>
                    <article id="tabs-min" class="tabs-min">
	                    <ul class="tabs-min">
		                    <li><a href="#tabs-min-form" class="tabs-min">Form</a></li>
		                    <li><a href="#tabs-min-visibility" class="tabs-min">Conditional Visibility</a></li>
	                    </ul>
	                    <div id="tabs-min-form" class="tabs-min">
                                    <table class="ms-formtable" style="margin-top: 8px;" border="0">
                                    </table>
                         </div>
                        <div id="tabs-min-visibility" class="tabs-min">                    
                        </div>
                    </article>
                </td>
                <td></td>
            </tr>
        </table>
        <div id="spEasyFormsTextareaDiv">
            <div>
                <a href="#" onclick="javascript:$.spEasyForms.clearCachedContext();">Clear Cache</a>
            </div>
            <h3>JSON:</h3>
            <div id="spEasyFormsJson" class="speasyforms-json"><pre></pre></div>
        </div>
    </div>
</asp:content>
