/*
 * SPEasyForms.adapterCollection.autocompleteAdapter - implementation of type ahead field control 
 * adapter for SPFieldText.
 *
 * @requires jQuery.SPEasyForms.2015.01.beta 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for autocomplete on text fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.autocompleteAdapter = {
        type: "Autocomplete",

        supportedTypes: function () {
            return ["SPFieldText"];
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.adapter.columnNameInternal in $.spEasyForms.containerCollection.rows) {
                var autocompleteData = [];
                $().SPServices({
                    operation: "GetListItems",
                    async: true,
                    listName: opt.adapter.sourceList,
                    CAMLViewFields: "<ViewFields>" +
                        "<FieldRef Name='" + opt.adapter.sourceField + "' />" +
                        "</ViewFields>",
                    CAMLQuery: "<Query><OrderBy>" +
                        "<FieldRef Name='" + opt.adapter.sourceField + "' Ascending='True' />" +
                        "</OrderBy></Query>",
                    completefunc: function (xData) {
                        $(xData.responseXML).SPFilterNode("z:row").each(function () {
                            autocompleteData.push($(this).attr("ows_" + opt.adapter.sourceField));
                        });

                        if (autocompleteData.length > 0) {
                            $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].row.find("input").autocomplete({
                                source: autocompleteData,
                                minLength: 2
                            });
                        }
                    }
                });
            }
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var autocompleteOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        adapterCollection.validateRequired({
                            id: "autocompleteFieldSelect",
                            displayName: "Lookup Field"
                        });
                        if ($("#autocompleteListSelect").val() && $("#autocompleteListSelect").val().length > 0) {
                            if ($("#AutocompleteDialog").find(".speasyforms-error").length === 0) {
                                var result = {
                                    type: "Autocomplete",
                                    sourceList: $("#autocompleteListSelect").val(),
                                    sourceListTitle: $("#autocompleteListSelect option:selected").text(),
                                    sourceField: $("#autocompleteFieldSelect").val(),
                                    columnNameInternal: $("#autocompleteChildSelect").val()
                                };
                                opt.adapters[result.columnNameInternal] = result;
                                $.spEasyForms.configManager.set(opt);
                                $('#autocompleteAdapterDialog').dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                        } else {
                            if ($("#autoCompleteHiddenFieldName").val() in opt.adapters) {
                                delete opt.adapters[$("#autoCompleteHiddenFieldName").val()];
                                $.spEasyForms.configManager.set(opt);
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                            $('#autocompleteAdapterDialog').dialog("close");
                        }
                    },
                    "Cancel": function () {
                        $('#autocompleteAdapterDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#autocompleteAdapterDialog').dialog(autocompleteOpts);
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#autocompleteAdapterDialog").find(".speasyforms-error").remove();

            opt.adapter = undefined;
            if (opt.fieldName in opt.adapters) {
                opt.adapter = opt.adapters[opt.fieldName];
            }

            // initialize the lookup list
            $("#autocompleteListSelect").val("");
            $("#autocompleteListSelect option").remove();
            $("#autocompleteListSelect").append("<option></option>");
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
                $("#autocompleteListSelect").append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });

            if (opt.adapter) {
                $("#autocompleteListSelect").val(opt.adapter.sourceList);
            }

            // initialize the lookup field
            opt.listId = $("#autocompleteListSelect").val();
            if (opt.listId) {
                opt.autocompleteContext = $.spEasyForms.sharePointContext.getListContext(opt);
                $("#autocompleteFieldSelect option").remove();
                $("#autocompleteFieldSelect").append("<option></option>");
                $.each(Object.keys(opt.autocompleteContext.fields), function (idx, field) {
                    $("#autocompleteFieldSelect").append("<option value='" +
                        opt.autocompleteContext.fields[field].internalName + "'>" +
                        opt.autocompleteContext.fields[field].displayName + "</option>");
                });
            } else {
                $("#autocompleteFieldSelect option").remove();
            }

            if (opt.adapter) {
                $("#autocompleteFieldSelect").val(opt.adapter.sourceField);
            }

            $("#autocompleteChildSelect option").remove();
            $("#autocompleteChildSelect").append("<option></option>");
            $.each(Object.keys(opt.currentListContext.fields), function (idx, field) {
                $("#autocompleteChildSelect").append("<option value='" +
                    opt.currentListContext.fields[field].internalName + "'>" +
                    opt.currentListContext.fields[field].displayName + "</option>");
            });
            $("#autocompleteChildSelect").val(opt.fieldName).attr("disabled", "disabled");
            $("#autoCompleteHiddenFieldName").val(opt.fieldName);
            if ($("#autocompleteChildSelect").val() !== $("#autoCompleteHiddenFieldName").val()) {
                $("#autocompleteChildSelect").append("<option value='" +
                    opt.fieldName + "'>" +
                    opt.fieldName + "</option>");
                $("#autocompleteChildSelect").val(opt.fieldName).attr("disabled", "disabled");
            }

            // add a change listener to reinitialize on change of the lookup list
            if ($("#autocompleteListSelect").attr("data-changelistener") !== "true") {
                $("#autocompleteListSelect").attr("data-changelistener", "true");
                $("#autocompleteListSelect").change(function () {
                    opt.listId = $("#autocompleteListSelect").val();
                    if (opt.listId) {
                        opt.autocompleteContext = $.spEasyForms.sharePointContext.getListContext(opt);
                        $("#autocompleteFieldSelect option").remove();
                        $("#autocompleteFieldSelect").append("<option></option>");
                        $.each(Object.keys(opt.autocompleteContext.fields), function (idx, field) {
                            $("#autocompleteFieldSelect").append("<option value='" +
                                opt.autocompleteContext.fields[field].internalName + "'>" +
                                opt.autocompleteContext.fields[field].displayName + "</option>");
                        });
                    }
                });
            }

            $('#autocompleteAdapterDialog').dialog("open");
        }
    };
    var autocompleteAdapter = $.spEasyForms.autocompleteAdapter;
    adapterCollection.adapterImplementations[autocompleteAdapter.type] = autocompleteAdapter;

})(spefjQuery);
