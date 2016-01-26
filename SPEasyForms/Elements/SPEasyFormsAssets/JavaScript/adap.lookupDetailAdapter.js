/*
 * $.spEasyForms.lookupDetailAdapter - an adapter plug-in for SPEasyForms
 * that creates an adapter for text fields to listen for changes to a lookup
 * and pull in data from another field in the lookup list.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;
    var fieldRows = $.spEasyForms.sharePointFieldRows;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.lookupDetailAdapter = {
        type: "Lookup Detail",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldText", "SPFieldNote", "SPFieldMultiLine", "SPFieldChoice", "SPFieldMultiChoice", "SPFieldDateTime",
                "SPFieldBoolean", "SPFieldURL", "SPFieldUser", "SPFieldUserMulti", "SPFieldCurrency", "SPFieldNumber"];
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
                        opt.lookup = $(this);
                        lookupDetailAdapter.updateAllDetailFields(opt);
                    });
                    if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "new") {
                        opt.lookup = lookupInfo.row.find("select");
                        lookupDetailAdapter.updateAllDetailFields(opt);
                    }
                }
            }
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
            };
            return new $.spEasyForms.relationshipListAdapterHelper(opt);
        },

        updateAllDetailFields: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.lookup.val() === "0") {
                $.each(Object.keys(opt.adapters), function (idx, key) {
                    var current = opt.adapters[key];
                    opt.row = containerCollection.rows[current.columnNameInternal];
                    opt.row.value = "";
                    fieldRows.setValue(opt);
                    if (opt.row.row.next().attr("data-visibilityadded") === "true") {
                        var h3 = "";
                        if (opt.row.row.next().find("td.ms-formbody").find("h3").length > 0) {
                            h3 = opt.row.row.next().find("td.ms-formbody").find("h3")[0].outerHTML;
                        }
                        opt.row.row.next().find("td.ms-formbody").html("");
                        opt.row.row.next().find("td.ms-formbody").append(h3 + "<span class='readonly'>" + opt.row.value + "</span>");
                    }
                });
            }
            else {
                var query = "<Query><Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" +
                    opt.lookup.val() + "</Value></Eq></Where></Query>";

                var viewFields = "<ViewFields>";
                var adapters = [];
                $.each(Object.keys(opt.adapters), function (idx, key) {
                    var current = opt.adapters[key];
                    if (current.parentColumnInternal === current.parentColumnInternal) {
                        adapters.push(current);
                        viewFields += "<FieldRef Name='" + current.relationshipListChildColumn + "'></FieldRef>";
                    }
                });
                viewFields += "</ViewFields>";

                $().SPServices({
                    operation: "GetListItems",
                    async: false,
                    listName: opt.adapter.relationshipList,
                    CAMLQuery: query,
                    CAMLViewFields: viewFields,
                    completefunc: function (xData) {
                        $(xData.responseXML).SPFilterNode('z:row').each(function () {
                            var resultRow = $(this);
                            $.each($(adapters), function (idx, adapter) {
                                opt.row = containerCollection.rows[adapter.columnNameInternal];
                                var value = resultRow.attr("ows_" + adapter.relationshipListChildColumn);
                                if (typeof (value) !== "undefined" && value !== null) {
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
                                if (opt.row.row.next().attr("data-visibilityadded") === "true") {
                                    var h3 = "";
                                    if (opt.row.row.next().find("td.ms-formbody").find("h3").length > 0) {
                                        h3 = opt.row.row.next().find("td.ms-formbody").find("h3")[0].outerHTML;
                                    }
                                    else if (opt.row.row.next().find("td.ms-formbody").find("nobr.speasyforms-columnheader")) {
                                        h3 = opt.row.row.next().find("td.ms-formbody").find("nobr.speasyforms-columnheader").parent()[0].outerHTML;
                                    }
                                    opt.row.row.next().find("td.ms-formbody").html("");
                                    opt.row.row.next().find("td.ms-formbody").append(h3 + "<span class='readonly'>" + opt.row.value + "</span>");
                                }
                            });
                        });
                    }
                });
            }
        }
    };

    // define shorthand local variable for adapter
    var lookupDetailAdapter = $.spEasyForms.lookupDetailAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[lookupDetailAdapter.type] = lookupDetailAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
