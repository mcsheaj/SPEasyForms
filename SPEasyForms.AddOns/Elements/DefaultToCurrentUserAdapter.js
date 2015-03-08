/*
 * $.spEasyForms.defaultToCurrentUserAdapter - an adapter plug-in for SPEasyForms
 * that creates an adapter for user fields to enter a default value of the current
 * user on new forms.
 *
 * @version 2015.00.09
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, SPClientPeoplePicker, ExecuteOrDelayUntilScriptLoaded */
(function ($, undefined) {

    // return without doing anything if there is already a DefaultToCurrentUser adapter
    if (!$ || !$.spEasyForms || "DefaultToCurrentUser" in $.spEasyForms.adapterCollection.adapterImplementations) return;

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.defaultToCurrentUserAdapter = {
        type: "DefaultToCurrentUser",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldUser", "SPFieldUserMulti"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (visibilityRuleCollection.getFormType(opt) !== "new") {
                return;
            }
            if (containerCollection.rows[opt.adapter.columnNameInternal]) {
                var pplpkrDiv = $("[id^='" + opt.adapter.columnNameInternal + "'][id$='ClientPeoplePicker']");
                var currentUser = $.spEasyForms.sharePointContext.getUserInformation(opt).name;
                if (pplpkrDiv.length > 0) {
                    ExecuteOrDelayUntilScriptLoaded(function () {
                        var clientPplPicker = SPClientPeoplePicker.SPClientPeoplePickerDict[pplpkrDiv[0].id];
                        if (clientPplPicker.GetAllUserInfo().length === 0) {
                            clientPplPicker.AddUserKeys(currentUser);
                        }
                    }, "clientpeoplepicker.js");
                } else {
                    var displayName = containerCollection.rows[opt.adapter.columnNameInternal].displayName;
                    var picker = $().SPServices.SPFindPeoplePicker({
                        peoplePickerDisplayName: displayName
                    });
                    if (!picker.currentValue) {
                        ExecuteOrDelayUntilScriptLoaded(function () {
                            setTimeout(function () {
                                $().SPServices.SPFindPeoplePicker({
                                    peoplePickerDisplayName: displayName,
                                    valueToSet: currentUser,
                                    checkNames: false
                                });
                            }, 1000);
                        }, "sp.js");
                    }
                }
            }
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // add the dialog div to the UI if it is not already there
            if ($("#addDefaultToCurrentUserDialog").length === 0) {
                var txt = "<div id='addDefaultToCurrentUserDialog' " +
                    "class='speasyforms-dialogdiv' " +
                    "title='Default to Current User Adapter'>" +
                    "Would you like to add/remove a Default to Current User adapter to " +
                    "'<span id='defaultToCurrentFieldName'></span>'?</div>";
                $("#spEasyFormsContainerDialogs").append(txt);
            }
            // initialize the jQuery UI dialog
            var defaultToCurrentOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        // add an adapter to the adaptes list and redraw the editor
                        if ($("#defaultToCurrentFieldName").text().length > 0) {
                            var result = {
                                type: defaultToCurrentUserAdapter.type,
                                columnNameInternal: $("#defaultToCurrentFieldName").text()
                            };
                            opt.adapters[result.columnNameInternal] = result;
                            $.spEasyForms.configManager.set(opt);
                            containerCollection.toEditor(opt);
                        }
                        $('#addDefaultToCurrentUserDialog').dialog("close");
                    },
                    "Remove": function () {
                        // remove the adapter from the adaptes list and redraw the editor
                        if ($("#defaultToCurrentFieldName").text().length > 0 &&
                            $("#defaultToCurrentFieldName").text() in opt.adapters) {
                            delete opt.adapters[$("#defaultToCurrentFieldName").text()];
                            $.spEasyForms.configManager.set(opt);
                        }
                        $('#addDefaultToCurrentUserDialog').dialog("close");
                        containerCollection.toEditor(opt);
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#addDefaultToCurrentUserDialog').dialog(defaultToCurrentOpts);
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // initialize the field name in the dialog
            $("#defaultToCurrentFieldName").text(opt.fieldName);
            // launch the dialog
            $('#addDefaultToCurrentUserDialog').dialog("open");
        }
    };

    // define shorthand local variable for adapter
    var defaultToCurrentUserAdapter = $.spEasyForms.defaultToCurrentUserAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[defaultToCurrentUserAdapter.type] = defaultToCurrentUserAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
