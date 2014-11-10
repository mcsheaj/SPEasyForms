/*
 * SPEasyForms.sharePointFieldRows - collection of field control adapters.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Collection of field control adapters.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.adapterCollection = {
        adapterImplementations: {},

        supportedTypes: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            if (opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                $.each(Object.keys(adapterCollection.adapterImplementations), function (idx, impl) {
                    if (impl in adapterCollection.adapterImplementations) {
                        result = result.concat(adapterCollection.adapterImplementations[impl].supportedTypes(opt));
                    }
                });
                result = $(result).filter(function (pos, item) {
                    return $.inArray(item, result) == pos;
                });
            }
            return result;
        },

        transform: function (options) {
            if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") < 0) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                if (opt.currentConfig && opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                    opt.adapters = opt.currentConfig.adapters.def;
                    $.each(opt.adapters, function (idx, adapter) {
                        opt.adapter = adapter;
                        if (opt.adapter.type in adapterCollection.adapterImplementations) {
                            adapterCollection.adapterImplementations[opt.adapter.type].transform(opt);
                        }
                    });
                }
            }
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.adapters = opt.currentConfig.adapters.def;

            $.each(Object.keys(adapterCollection.adapterImplementations), function (idx, impl) {
                if (impl in adapterCollection.adapterImplementations) {
                    adapterCollection.adapterImplementations[impl].toEditor(opt);
                }
            });

            $("tr.speasyforms-adapter-static").remove();
            $.each(Object.keys(opt.adapters).sort(this.compareAdapters), function (idx, adapterField) {
                opt.adapter = opt.adapters[adapterField];
                opt.fieldName = adapterField;
                if (opt.adapter.type in adapterCollection.adapterImplementations) {
                    adapterCollection.drawAdapter(opt);
                }
            });
            if ($("tr.speasyforms-adapter-static").length === 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='speasyforms-adapter-static'>" +
                    "<td class='speasyforms-adapter-static' colspan='5'>" +
                    "There are no adpaters configured for the current form.</td></tr>");
            }
            $("#tabs-min-adapters").append("<br /><br />");

            $("tr.speasyforms-sortablefields").each(function (idx, tr) {
                var tds = $(this).find("td");
                if (tds.length > 2) {
                    var internalName = $(this).find("td")[1].innerHTML;
                    var type = $(this).find("td")[2].innerHTML;
                    opt.supportedTypes = adapterCollection.supportedTypes(opt);
                    if ($.inArray(type, opt.supportedTypes) >= 0) {
                        $(this).append(
                            "<td class='speasyforms-adapter'><button id='" +
                            internalName +
                            "Adapter' class='speasyforms-containerbtn " +
                            "speasyforms-adapter' data-spfieldtype='" +
                            type + "'>" +
                            "Configure Field Control Adapter</button></td>");
                    } else {
                        $(this).append("<td class='speasyforms-blank'>&nbsp;</td>");
                    }
                }
            });

            $("#adapterTypeDialog").dialog({
                modal: true,
                autoOpen: false,
                width: 400,
                buttons: {
                    "Ok": function () {
                        $("#adapterTypeDialog").dialog("close");
                        opt.adapterType = $("#adapterType option:selected").text();
                        $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                            if (impl.type === opt.adapterType) {
                                opt.adapterImpl = impl;
                            }
                        });
                        if (opt.adapterImpl) {
                            opt.adapterImpl.launchDialog(opt);
                        }
                    },
                    "Cancel": function () {
                        $("#adapterTypeDialog").dialog("close");
                    }
                }
            });

            $("button.speasyforms-adapter").button({
                icons: {
                    primary: "ui-icon-shuffle"
                },
                text: false
            }).click(function () {
                opt.button = this;
                opt.fieldName = opt.button.id.replace("Adapter", "");
                opt.spFieldType = $.spEasyForms.containerCollection.rows[opt.fieldName].spFieldType;
                adapterCollection.launchDialog(opt);
                return false;
            });

            if ($("#spEasyFormsAdapterTable tr.speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#adapterTab").addClass("speasyforms-fieldmissing");
            }
            else {
                $("#adapterTab").removeClass("speasyforms-fieldmissing");
            }
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.dialogLaunched = false;
            opt.adapters = opt.currentConfig.adapters.def;
            opt.adapter = undefined;
            if (opt.fieldName in opt.adapters) {
                opt.adapter = opt.adapters[opt.fieldName];
            }
            if (opt.adapter) {
                var a = opt.adapters[opt.fieldName];
                if (a.type in adapterCollection.adapterImplementations) {
                    adapterCollection.adapterImplementations[a.type].launchDialog(opt);
                    opt.dialogLaunced = true;
                }
            }
            if (!opt.dialogLaunced) {
                opt.typeAdapters = [];
                $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                    if ($.inArray(opt.spFieldType, impl.supportedTypes(opt)) >= 0) {
                        opt.typeAdapters.push({
                            impl: impl,
                            type: opt.spFieldType
                        });
                    }
                });
                if (opt.typeAdapters.length === 1) {
                    opt.typeAdapters[0].impl.launchDialog(opt);
                } else {
                    // ask what type of adapter they want
                    $("#adapterFieldType").text(opt.spFieldType);
                    $("#adapterType").find("option:not(:first)").remove();
                    $.each(opt.typeAdapters, function (idx, current) {
                        $("#adapterType").append("<option value='" + idx + "'>" + current.impl.type + "</option>");
                    });
                    $("#adapterTypeDialog").dialog("open");
                }
            }
            $(".tabs-min").hide();
            $("#tabs-min-adapters").show();
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            result = true;
            $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                if (typeof (impl.preSaveItem) === "function") {
                    result = result && impl.preSaveItem(opt);
                }
            });
            return result;
        },

        drawAdapter: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var displayName = opt.fieldName;
            var klass = "speasyforms-adapter-static speasyforms-dblclickdialog";
            var title = JSON.stringify(opt.adapter);
            var config = "";

            $.each(Object.keys(opt.adapter).sort(), function (idx, key) {
                if (key != "type" && key != "columnNameInternal") {
                    if (config.length > 0) {
                        config += "<br />";
                    }
                    config += "<b>" + $.spEasyForms.utilities.titleCase(key) + "</b> = " + opt.adapter[key];
                }
            });

            if ($.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal] &&
                !$.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].fieldMissing) {
                displayName = $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].displayName;
            }
            else {
                klass += " speasyforms-fieldmissing";
                title = "This field was not found in the form and may have been deleted.";
            }

            if (opt.verbose && klass.indexOf("speasyforms-fieldmissing") >= 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='" + klass + "' " +
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='" + title + "'>" +
                    "<td class='" + klass + "'>" + displayName + "</td>" +
                    "<td class='" + klass + " speasyforms-hidden' style='display:none'>" + opt.adapter.columnNameInternal + "</td>" +
                    "<td class='" + klass + "'>" + opt.adapter.type + "</td>" +
                    "<td class='" + klass + "'>" + config + "</td>" +
                    "</tr>");
            }
            else if (klass.indexOf("speasyforms-fieldmissing") < 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='" + klass + "' " +
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='" + title + "'>" +
                    "<td class='" + klass + "'>" + displayName + "</td>" +
                    "<td class='" + klass + " speasyforms-hidden' style='display:none'>" + opt.adapter.columnNameInternal + "</td>" +
                    "<td class='" + klass + "'>" + opt.adapter.type + "</td>" +
                    "<td class='" + klass + "'>" + config + "</td>" +
                    "</tr>");
            }
            else {
                $("#spEasyFormsAdapterTable").append("<tr class='" + klass + "' " +
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='" + title + "' style='display:none'>" +
                    "<td class='" + klass + "'>" + displayName + "</td>" +
                    "<td class='" + klass + " speasyforms-hidden' style='display:none'>" + opt.adapter.columnNameInternal + "</td>" +
                    "<td class='" + klass + "'>" + opt.adapter.type + "</td>" +
                    "<td class='" + klass + "'>" + config + "</td>" +
                    "</tr>");
            }
        },

        compareAdapters: function (a, b) {
            var listctx = $.spEasyForms.sharePointContext.getListContext();
            var display1 = a;
            var display2 = b;
            if (a in listctx.fields) {
                a = listctx.fields[a].displayName;
            }
            if (b in listctx.fields) {
                b = listctx.fields[b].displayName;
            }
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        },

        validateRequired: function (options) {
            var control = $("#" + options.id);
            control.parent().find(".speasyforms-error").remove();
            if (!control.val()) {
                control.parent().append(
                    "<div class='speasyforms-error'>'" + options.displayName +
                    "' is a required field!</div>");
            }
        }
    };
    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for configuring cascading lookup fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.cascadingLookupAdapter = {
        type: "Cascading Lookup",

        supportedTypes: function (options) {
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
                    width: 500
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
                $("#cascadingRelationshipListSelect").change(function (e) {
                    opt.listId = $("#cascadingRelationshipListSelect").val().toLowerCase();
                    cascadingLookupAdapter.initRelationshipFields({
                        listId: $("#cascadingRelationshipListSelect").val().toLowerCase()
                    });
                });
                $("#cascadingLookupRelationshipParentSelect").change(function (e) {
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
                    if (listctx.fields[field].spFieldType == "SPFieldLookup") {
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

        clearDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

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
                if (fields[field].spFieldType == "SPFieldLookup") {
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

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for autocomplete on text fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.autocompleteAdapter = {
        type: "Autocomplete",

        supportedTypes: function (options) {
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
                                    sourceField: $("#autocompleteFieldSelect").val(),
                                    columnNameInternal: $("#autocompleteChildSelect").val()
                                };
                                opt.adapters[result.columnNameInternal] = result;
                                $.spEasyForms.configManager.set(opt);
                                $('#autocompleteAdapterDialog').dialog("close");
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                        } else {
                            if ($("#autoCompleteHiddenFieldName").val() in opt.adapters) {
                                delete opt.adapters[$("#autoCompleteHiddenFieldName").val()];
                                $.spEasyForms.configManager.set(opt);
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

            // add a change listener to reinitialize on change of the lookup list
            if ($("#autocompleteListSelect").attr("data-changelistener") !== "true") {
                $("#autocompleteListSelect").attr("data-changelistener", "true");
                $("#autocompleteListSelect").change(function (e) {
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
