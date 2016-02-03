/*
 * SPEasyForms.adapterCollection.cascadingLookupAdapter - implementaiton of a cascading lookup field adapter.
 *
 * @requires jQuery.SPEasyForms.2015.01.01 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for configuring cascading lookup fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.cascadingLookupAdapter = {
        type: "Cascading Lookup",

        supportedTypes: function () {
            return ["SPFieldLookup"];
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.adapter.parentColumnInternal in $.spEasyForms.containerCollection.rows && opt.adapter.columnNameInternal in $.spEasyForms.containerCollection.rows) {
                opt.adapter.parentColumn =
                    $.spEasyForms.containerCollection.rows[opt.adapter.parentColumnInternal].displayName;
                opt.adapter.childColumn =
                    $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].displayName;
                opt.adapter.listName = $.spEasyForms.sharePointContext.getCurrentListId(opt);
                opt.adapter.debug = $.spEasyForms.defaults.verbose;
                $().SPServices.SPCascadeDropdowns(opt.adapter);
            }
        },

        toEditor: function (options) {
            if (!this.initialized) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var adapterOpts = {
                    modal: true,
                    buttons: {
                        "Ok": function () {
                            opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                            opt.adapters = opt.currentConfig.adapters.def;
                            if (!opt.currentConfig.adapters) {
                                opt.currentConfig.adapters = {};
                            }
                            if (!opt.currentConfig.adapters.def) {
                                opt.currentConfig.adapters.def = {};
                            }
                            opt.adapters = opt.currentConfig.adapters.def;
                            opt.adapterField = $("#cascadingLookupHiddenFieldName").val();
                            if ($("#cascadingRelationshipListSelect").val().length === 0) {
                                if (opt.adapterField in opt.adapters) {
                                    delete opt.adapters[opt.adapterField];
                                }
                                $.spEasyForms.configManager.set(opt);
                                $('#cascadingLookupAdapterDialog').dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            } else {
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupRelationshipParentSelect",
                                    displayName: "Parent Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupRelationshipChildSelect",
                                    displayName: "Child Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupParentSelect",
                                    displayName: "Form Parent Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupChildSelect",
                                    displayName: "Form Child Column"
                                });
                                if ($("#cascadingLookupAdapterDialog").find(".speasyforms-error").length === 0) {
                                    var adapter = {};
                                    if (opt.adapterField && opt.adapterField in opt.adapters) {
                                        adapter = opt.adapters[opt.adapterField];
                                    } else {
                                        opt.adapters[opt.adapterField] = adapter;
                                    }
                                    adapter.type = cascadingLookupAdapter.type;
                                    adapter.relationshipList =
                                        $("#cascadingRelationshipListSelect").val();
                                    adapter.relationshipListTitle =
                                        $("#cascadingRelationshipListSelect option:selected").text();
                                    adapter.relationshipListParentColumn =
                                        $("#cascadingLookupRelationshipParentSelect").val();
                                    adapter.relationshipListChildColumn =
                                        $("#cascadingLookupRelationshipChildSelect").val();
                                    adapter.parentColumnInternal =
                                        $("#cascadingLookupParentSelect").val();
                                    adapter.columnNameInternal =
                                        $("#cascadingLookupChildSelect").val();
                                    $.spEasyForms.configManager.set(opt);
                                    $('#cascadingLookupAdapterDialog').dialog("close");
                                    opt.refresh = $.spEasyForms.refresh.adapters;
                                    $.spEasyForms.containerCollection.toEditor(opt);
                                }
                            }
                            return false;
                        },
                        "Cancel": function () {
                            $('#cascadingLookupAdapterDialog').dialog("close");
                            return false;
                        }
                    },
                    autoOpen: false,
                    width: 650
                };
                $('#cascadingLookupAdapterDialog').dialog(adapterOpts);
            }
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // clear dialog
            cascadingLookupAdapter.clearDialog(opt);
            // init dialog
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
                $("#cascadingRelationshipListSelect").append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });
            $("#cascadingLookupList").val(opt.currentListContext.title);
            if ($("#cascadingRelationshipListSelect").attr("data-change") !== "true") {
                $("#cascadingRelationshipListSelect").attr("data-change", "true");
                $("#cascadingRelationshipListSelect").change(function () {
                    opt.listId = $("#cascadingRelationshipListSelect").val().toLowerCase();
                    cascadingLookupAdapter.initRelationshipFields({
                        listId: $("#cascadingRelationshipListSelect").val().toLowerCase()
                    });
                });
                $("#cascadingLookupRelationshipParentSelect").change(function () {
                    if ($("#cascadingLookupParentSelect").find("option[value='" +
                        $("#cascadingLookupRelationshipParentSelect").val() + "']").length > 0) {
                        $("#cascadingLookupParentSelect").find("option[text='" +
                            $("#cascadingLookupRelationshipParentSelect").text() + "']");
                    }
                });
            }
            $("#cascadingLookupChildSelect").val(opt.fieldName);
            $("#cascadingLookupHiddenFieldName").val(opt.fieldName);
            opt.adapters = opt.currentConfig.adapters.def;
            if (opt.fieldName in opt.adapters) {
                var a = opt.adapters[opt.fieldName];
                $("#cascadingRelationshipListSelect").val(
                    a.relationshipList);
                cascadingLookupAdapter.initRelationshipFields({
                    listId: a.relationshipList
                });
                $("#cascadingLookupRelationshipParentSelect").val(
                    a.relationshipListParentColumn);
                $("#cascadingLookupRelationshipChildSelect").val(
                    a.relationshipListChildColumn);
                $("#cascadingLookupParentSelect").val(
                    a.parentColumnInternal);
            }
            // launch dialog
            $('#cascadingLookupAdapterDialog').dialog("open");
        },

        initRelationshipFields: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#cascadingLookupRelationshipParentSelect").find("option").remove();
            $("#cascadingLookupRelationshipParentSelect").append("<option></option>");
            $("#cascadingLookupRelationshipParentSelect").val("");
            $("#cascadingLookupRelationshipParentSelect").attr("disabled", "disabled");

            $("#cascadingLookupRelationshipChildSelect").find("option").remove();
            $("#cascadingLookupRelationshipChildSelect").append("<option></option>");
            $("#cascadingLookupRelationshipChildSelect").val("");
            $("#cascadingLookupRelationshipChildSelect").attr("disabled", "disabled");

            if (opt.listId) {
                var listctx = $.spEasyForms.sharePointContext.getListContext(opt);
                $.each(Object.keys(listctx.fields), function (idx, field) {
                    if (listctx.fields[field].spFieldType === "SPFieldLookup") {
                        $("#cascadingLookupRelationshipParentSelect").append(
                            "<option value='" +
                            listctx.fields[field].internalName + "'>" +
                            listctx.fields[field].displayName + "</option>");
                    }
                    $("#cascadingLookupRelationshipChildSelect").append(
                        "<option value='" +
                        listctx.fields[field].internalName + "'>" +
                        listctx.fields[field].displayName + "</option>");
                });
                $("#cascadingLookupRelationshipParentSelect").removeAttr("disabled");
                $("#cascadingLookupRelationshipChildSelect").removeAttr("disabled");
                var choices = $("#cascadingLookupRelationshipParentSelect").find("option");
                if (choices.length === 2) {
                    $("#cascadingLookupRelationshipParentSelect").val(
                        $(choices[1]).attr("value"));
                    var relationshipParentText =
                        $("#cascadingLookupRelationshipParentSelect option:selected").text();
                    var thisParentOption =
                        $("#cascadingLookupParentSelect").find(
                            "option:contains('" + relationshipParentText + "')");
                    $("#cascadingLookupParentSelect").val(thisParentOption.val());
                }
                var thisChildText =
                    $("#cascadingLookupChildSelect option:selected").text();
                var relationshipChildOption =
                    $("#cascadingLookupRelationshipChildSelect").find(
                        "option:contains('" + thisChildText + "')");
                $("#cascadingLookupRelationshipChildSelect").val(
                    relationshipChildOption.val());
            }
        },

        clearDialog: function () {

            $("#cascadingLookupAdapterDialog").find(".speasyforms-error").remove();

            $("#cascadingRelationshipListSelect").find("option").remove();
            $("#cascadingRelationshipListSelect").append("<option></option>");
            $("#cascadingRelationshipListSelect").val("");

            $("#cascadingLookupRelationshipParentSelect").find("option").remove();
            $("#cascadingLookupRelationshipParentSelect").append("<option></option>");
            $("#cascadingLookupRelationshipParentSelect").val("");
            $("#cascadingLookupRelationshipParentSelect").attr("disabled", "disabled");

            $("#cascadingLookupRelationshipChildSelect").find("option").remove();
            $("#cascadingLookupRelationshipChildSelect").append("<option></option>");
            $("#cascadingLookupRelationshipChildSelect").val("");
            $("#cascadingLookupRelationshipChildSelect").attr("disabled", "disabled");

            $("#cascadingLookupParentSelect").find("option").remove();
            $("#cascadingLookupParentSelect").append("<option></option>");
            $("#cascadingLookupParentSelect").val("");

            $("#cascadingLookupChildSelect").find("option").remove();
            $("#cascadingLookupChildSelect").append("<option></option>");
            $("#cascadingLookupChildSelect").val("");

            var fields = $.spEasyForms.containerCollection.rows;
            $.each(Object.keys($.spEasyForms.containerCollection.rows).sort($.spEasyForms.sharePointFieldRows.compareField), function (idx, field) {
                if (fields[field].spFieldType === "SPFieldLookup") {
                    $("#cascadingLookupParentSelect").append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                    $("#cascadingLookupChildSelect").append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                }
            });
        }
    };
    var cascadingLookupAdapter = $.spEasyForms.cascadingLookupAdapter;
    adapterCollection.adapterImplementations[cascadingLookupAdapter.type] = cascadingLookupAdapter;

})(spefjQuery);
