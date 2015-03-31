/*
 * $.spEasyForms.lookupDetailAdapter - an adapter plug-in for SPEasyForms
 * that creates an adapter for text fields to listen for changes to a lookup
 * and pull in data from another field in the lookup list.
 *
 * @version 2014.01.13
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if there is already a DefaultToCurrentUser adapter
    if (!$ || !$.spEasyForms || "LookupDetailAdapter" in $.spEasyForms.adapterCollection.adapterImplementations) return;

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;
    var fieldRows = $.spEasyForms.sharePointFieldRows;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.lookupDetailAdapter = {
        type: "LookupDetailAdapter",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldText", "SPFieldNote", "SPFieldMultiLine", "SPFieldChoice", "SPFieldMultiChoice",
                "SPFieldDateTime", "SPFieldBoolean", "SPFieldURL", "SPFieldUser", "SPFieldUserMulti"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var adapter = opt.adapter;
            var rowInfo = containerCollection.rows[adapter.columnNameInternal];
            if (rowInfo) {
                var lookupInfo = containerCollection.rows[adapter.parentColumnInternal];
                if (lookupInfo.row.find("select").attr("data-relationshipListListener") !== "true") {
                    lookupInfo.row.find("select").attr("data-relationshipListListener", "true").change(function () {
                        var lookup = $(this);

                        if (adapter.readOnly) {
                            opt.row = rowInfo;
                            visibilityRuleCollection.scrubCollection($([opt.row]));
                        }

                        var query = "<Query><Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" +
                            lookup.val() + "</Value></Eq></Where></Query>";

                        var viewFields = "<ViewFields>";
                        var adapters = [];
                        $.each(Object.keys(opt.adapters), function (idx, key) {
                            var current = opt.adapters[key];
                            if (current.parentColumnInternal === adapter.parentColumnInternal) {
                                adapters.push(current);
                                viewFields += "<FieldRef Name='" + current.relationshipListChildColumn + "'></FieldRef>";
                            }
                        });
                        viewFields += "</ViewFields>";

                        $().SPServices({
                            operation: "GetListItems",
                            async: false,
                            listName: adapter.relationshipList,
                            CAMLQuery: query,
                            CAMLViewFields: viewFields,
                            completefunc: function (xData) {
                                $(xData.responseXML).SPFilterNode('z:row').each(function () {
                                    var resultRow = $(this);
                                    $.each($(adapters), function (idx, adapter) {
                                        opt.row = containerCollection.rows[adapter.columnNameInternal];
                                        var value = resultRow.attr("ows_" + adapter.relationshipListChildColumn);
                                        if (typeof(value) !== "undefined" && value !== null) {
                                            switch (opt.row.spFieldType) {
                                                case "SPFieldUser":
                                                case "SPFieldUserMulti":
                                                    opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn);
                                                    if (opt.value.indexOf(";#") > -1) {
                                                        var a = opt.value.split(";#");
                                                        opt.value = "";
                                                        for (var i = 1; i < a.length; i += 2) {
                                                            if (opt.value.length > 0) {
                                                                opt.value += ";";
                                                            }
                                                            opt.value += a[i];
                                                        }
                                                    }
                                                    break;
                                                case "SPFieldDateTime":
                                                    opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(/-/g, "/");
                                                    break;
                                                case "SPFieldURL":
                                                    opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(", ", "|");
                                                    break;
                                                default:
                                                    opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(/;#/g, ";");
                                                    break;
                                            }
                                        }
                                        else {
                                            opt.value = "";
                                        }
                                        fieldRows.setValue(opt);
                                        if (adapter.readOnly) {
                                            if (opt.row.spFieldType.indexOf('User') < 0) {
                                                visibilityRuleCollection.scrubCollection($([opt.row.row]));
                                                visibilityRuleCollection.stateHandlers.readOnly(opt);
                                            }
                                            else {
                                                lookupDetailAdapter.delayResetReadonly(opt);
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            }
            if (adapter.readOnly) {
                opt.row = rowInfo;
                visibilityRuleCollection.scrubCollection($([ opt.row ]));
                visibilityRuleCollection.stateHandlers.readOnly(opt);
            }
        },

        delayResetReadonly: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            setTimeout(function () {
                visibilityRuleCollection.scrubCollection($([opt.row.row]));
                visibilityRuleCollection.stateHandlers.readOnly(opt);
            }, 1000);
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            this.getRelationshipHelper(options).constructDialog();
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var relationshipHelper = this.getRelationshipHelper(options);
            relationshipHelper.clearDialog();
            relationshipHelper.initControls();
            relationshipHelper.initDialog();
            $("#lookupDetailDialogTable").append("<tr class='implementation-specific'><td></td><td>" +
                "<input type='checkbox' id='lookupDetailReadOnly' " + (!options.adapter || options.adapter.readOnly ? "checked = 'checked'" : "") +
                " /> Read Only</td></tr>");
            $("#lookupDetailDialog").dialog("open");
        },

        getRelationshipHelper: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.relationship = {
                type: lookupDetailAdapter.type,
                dialogDiv: "lookupDetailDialog",
                relationshipListColumn: { id: "lookupDetailRelationshipList", displayName: "Relationship List" },
                relationshipChildColumn: { id: "lookupDetailRelationshipDetailColumn", displayName: "Detail Column" },
                formListColumn: { id: "lookupDetailList", displayName: "This List" },
                formParentColumn: { id: "lookupDetailLookupColumn", displayName: "Form Lookup Column" },
                formChildColumn: { id: "lookupDetailDetailColumn", displayName: "Form Detail Column" },
                updateCallback: function (adapter) { adapter.readOnly = $("#lookupDetailReadOnly").is(":checked"); }
            };
            return new $.spEasyForms.relationshipListAdapterHelper(opt);
        }
    };

    // define shorthand local variable for adapter
    var lookupDetailAdapter = $.spEasyForms.lookupDetailAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[lookupDetailAdapter.type] = lookupDetailAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
