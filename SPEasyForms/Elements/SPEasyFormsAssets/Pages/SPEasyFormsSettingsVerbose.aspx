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
    <script src="../JavaScript/jquery.bundle.min.js" type="text/javascript"></script>

    <!--
    <script src="../JavaScript/jquery.SPEasyForms.min.js" type="text/javascript"></script>
    -->
    <script src="../JavaScript/jquery.SPEasyForms.js" type="text/javascript"></script>
    <script src="../JavaScript/utilities.js" type="text/javascript"></script>
    <script src="../JavaScript/sharePointContext.js" type="text/javascript"></script>
    <script src="../JavaScript/sharePoinFieldRows.js" type="text/javascript"></script>
    <script src="../JavaScript/configManager.js" type="text/javascript"></script>
    <script src="../JavaScript/containerCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.defaultContainer.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.baseContainer.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.fieldCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.accordion.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.columns.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.stack.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.tabs.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.wizard.js" type="text/javascript"></script>
    <script src="../JavaScript/cont.htmlSnippet.js" type="text/javascript"></script>
    <script src="../JavaScript/visibilityRuleCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/adapterCollection.js" type="text/javascript"></script>
    <script src="../JavaScript/adap.autocompleteAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/adap.cascadingLookupAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/adap.defaultToCurrentUserAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/adap.lookupDetailAdapter.js" type="text/javascript"></script>
    <script src="../JavaScript/adap.starRatingAdapter.js" type="text/javascript"></script>

    <script src="../../SPEasyForms_DefaultSettings.js" type="text/javascript"></script>
    <link href="SPEasyFormsSettings.css" rel="stylesheet" type="text/css" />
    <link href="../Css/speasyforms.css" rel="stylesheet" type="text/css" />
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
                <div id='spEasyFormsDiagButton' class='speasyforms-buttonouterdiv speasyforms-hidden'>
                    <div class="speasyforms-img speasyforms-diagimg"></div>
                    <div class='speasyforms-buttontext'>Diag</div>
                </div>
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
                            <th class="ui-widget-header ui-corner-all nobr">Display Name</th>
                            <th class="ui-widget-header ui-corner-all nobr speasyforms-hidden">Internal Name</th>
                            <th class="ui-widget-header ui-corner-all nobr">Adapter Type</th>
                            <th class="ui-widget-header ui-corner-all nobr">Additional Settings</th>
                        </tr>
                    </table>
                </div>
                <div id='tabs-min-settings' class='tabs-min' style='display: none;'>
                    <div class='speasyforms-settingsheader'>jQuery UI Theme</div>
                    <div>
                        <input type="radio" name="jqueryuitheme" value="none" checked="checked" />
                        Use Default Theme 
                        <input type="radio" name="jqueryuitheme" value="gallery" />
                        Use Gallery Theme 
                        <input type="radio" name="jqueryuitheme" value="custom" />
                        Use Custom Theme 
                    </div>
                    <div style="margin-top: 10px; margin-bottom: 10px;">
                        <select id="selGalleryTheme">
                        </select>
                        <input type="text" id="inpCustomTheme" name="inpCustomTheme"
                            value="" title="Enter the full text to a jQuery UI 1.11.x theme." style="display: none; width: 700px;" />
                    </div>
                    <div class="speasyforms-applytheme">
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
                        <b>Version: 2015.01</b>
                    </p>
                    <h2>The MIT License (MIT)</h2>
                    <p>Copyright (c) 2014-2016 Joe McShea</p>
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
            <!-- id='staticVisibilityRules' -->
            <table class="speasyforms-staticrules speasyforms-staticrulestabletemplate">
                <tbody class="speasyforms-staticrules">
                    <tr>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr ">Display Name</th>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr speasyforms-hidden">Internal Name</th>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr">State</th>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr">Applies To</th>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr">On Forms</th>
                        <th class="speasyforms-staticrules  ui-widget-header ui-corner-all nobr">And When</th>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <!-- id="visibilityRule0" data-fieldname="Company" -->
                    <tr class="speasyforms-staticrules speasyforms-staticrulesrowtemplate"  data-dialogtype="visibility">
                        <td class="speasyforms-displayname speasyforms-staticrules ui-widget-content ui-corner-all nobr speasyforms-dblclickdialog"></td>
                        <td class="speasyforms-internalname speasyforms-staticrules speasyforms-hidden"></td>
                        <td class="speasyforms-state speasyforms-staticrules ui-widget-content ui-corner-all nobr speasyforms-dblclickdialog"></td>
                        <td class="speasyforms-appliesto speasyforms-staticrules ui-widget-content ui-corner-all nobr speasyforms-dblclickdialog"></td>
                        <td class="speasyforms-forms speasyforms-staticrules ui-widget-content ui-corner-all nobr speasyforms-dblclickdialog"></td>
                        <td class="speasyforms-when speasyforms-staticrules ui-widget-content ui-corner-all nobr speasyforms-dblclickdialog"></td>
                    </tr>
                </tbody>
            </table>
            <table class="speasyforms-sortablerules speasyforms-visibilityrulestabletemplate">
                <tbody class="speasyforms-sortablerules">
                    <tr>
                        <th class="speasyforms-sortablerules nobr ui-widget-header ui-corner-all">State</th>
                        <th class="speasyforms-sortablerules nobr ui-widget-header ui-corner-all">Applies To</th>
                        <th class="speasyforms-sortablerules nobr ui-widget-header ui-corner-all">On Forms</th>
                        <th class="speasyforms-sortablerules nobr ui-widget-header ui-corner-all">And When</th>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr class="speasyforms-sortablerules speasyforms-visibilityrulesrowtemplate">
                        <td class="speasyforms-state speasyforms-sortablerules nobr ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-appliesto speasyforms-sortablerules nobr ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-forms speasyforms-sortablerules nobr ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-when speasyforms-sortablerules nobr ui-widget-content ui-corner-all"></td>
                        <td class="speasyforms-visibilityrulebutton">
                            <!-- id="addVisililityRuleButton0" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only" -->
                            <button title="Edit Rule" class="speasyforms-visibilityrulebutton"></button>
                        </td>
                        <td class="speasyforms-visibilityrulebutton">
                            <!-- id="delVisililityRuleButton0" -->
                            <button title="Delete Rule" class="speasyforms-visibilityrulebutton"></button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <!--  data-fieldname="Rating" -->
                    <tr class="speasyforms-adapter-static speasyforms-dblclickdialog speasyforms-adapterrowtemplate" data-dialogtype="adapter">
                        <td class="speasyforms-displayname speasyforms-adapter-static speasyforms-dblclickdialog ui-widget-content ui-corner-all nobr"></td>
                        <td class="speasyforms-internalname speasyforms-adapter-static speasyforms-dblclickdialog ui-widget-content ui-corner-all nobr speasyforms-hidden"></td>
                        <td class="speasyforms-adaptertype speasyforms-adapter-static speasyforms-dblclickdialog ui-widget-content ui-corner-all nobr"></td>
                        <td class="speasyforms-adapterconfig speasyforms-adapter-static speasyforms-dblclickdialog ui-widget-content ui-corner-all nobr"></td>
                        <td>
                            <!-- id="RatingDelete" -->
                            <button title="Delete" class="speasyforms-containerbtn speasyforms-deleteadapter"></button>
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
            spefjQuery.spEasyForms.init();
        </script>
        <SharePoint:FormDigest ID="FormDigest1" runat="server"></SharePoint:FormDigest>
    </form>
</body>
</html>
