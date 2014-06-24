<%@ Import Namespace="Microsoft.SharePoint.Publishing" %>
<%@ Register Tagprefix="asp" Namespace="System.Web.UI" Assembly="System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" %> 
<%@ Page Language="C#" Inherits="Microsoft.SharePoint.Publishing.PublishingLayoutPage,Microsoft.SharePoint.Publishing,Version=14.0.0.0, Culture=neutral,PublicKeyToken=71e9bce111e9429c" %>

<asp:content runat="server" contentplaceholderid="PlaceHolderPageTitle">
SPEasyForms Settings
</asp:content>

<asp:content runat="server" contentplaceholderid="PlaceHolderPageTitleInTitleArea">
<h1>SPEasyForms Settings - <asp:Literal runat="server" Text="<%$Resources:wss,language_value%>" /></h1>
</asp:content>

<asp:content runat="server" contentplaceholderid="PlaceHolderAdditionalPageHead">
<style>
    body {
        font-family: Verdana, Arial, sans-serif;
        font-size: .7em;
    }

    h1, h3.speasyforms-sortablefields {
        margin: 4px;
        padding: 5px 0px 0px 0px;
        font-weight: normal;
    }

    .speasyforms-panel {
        vertical-align: top;
    }

    .speasyforms-editor {
        padding: 20px 0px;
    }

    .speasyforms-form {
        vertical-align: top;
        padding: 100px 20px;
        width: 100%;
    }

    table.ms-formtable td {
        border: 1px solid lightblue;
    }

    table.speasyforms-fieldstitle, table.speasyforms-editor, table.speasyforms-sortablefields {
        width: 100%;
    }

    th.speasyforms-name {
        width: 100px;
    }

    td.speasyforms-sortablefields {
        border: 1px solid lightblue !important;
    }

    tr.speasyforms-sortablefields {
        cursor: move !important;
        background-color: white !important;
    }

    tr.speasyforms-sortablefields:hover {
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

    td.speasyforms-sortablecontainers:hover {
        background: #eeffee !important;
    }

    table.ms-formtable {
        //display: none;
        background: white;
    }

    td.ms-formlabel {
        text-align: right;
    }

    .ui-button {
        font-size: .9em;
        margin: 5px 0px;
    }

    .speasyforms-buttons {
    }

    .speasyforms-json {
        width: "100%";
        border: 1px solid lightblue;
    }

    div.speasyforms-buttons {
        margin-top: 20px;
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

    .speasyforms-error {
        color: maroon !important;
    }

    .speasyforms-dialogdiv {
        display: none;
    }

    .ui-accordion .ui-accordion-content {
        overflow: auto;
    }

    table.speasyforms-fieldsheader {
        
        width: 100%;
    
    }
    
    td.speasyforms-headercell {
        
        width: 50%;

    }


    .spEasyFormsOuterDiv {

        display: none;

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
                <table id='spEasyFormsContainerTable' class='speasyforms-sortablecontainers' width='100%' cellspacing='20px'>
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
                        <label for="fieldGroupNames">Name</label>
                        <input type="text" id="fieldGroupNames" name="fieldGroupNames" />
                        <input type='hidden' id='editFieldGroupContainerId' value='' />
                    </div>
                    <div id='addMultiGroupContainerDialog' class='speasyforms-dialogdiv' title='Add Multiple Field Group Container'>
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
                </div>
            </td>
            <td class='speasyforms-editor speasyforms-form'>
                <table class='ms-formtable' width="100%" cellpadding='0' cellspacing='0'></table>
            </td>
        </tr>
    </table>
    <div id="spEasyFormsTextareaDiv">
        <h3>JSON:</h3>
        <div id="spEasyFormsJson" class="speasyforms-json"><pre></pre>
        </div>
    </div>
</div>
</asp:content>
