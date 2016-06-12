/*
 * SPEasyForms.adapterCollection - collection of field control adapters.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
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
                    return $.inArray(item, result) === pos;
                });
            }
            return result;
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!$.spEasyForms.isSettingsPage(opt)) {
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

            $("#spEasyFormsAdapterTable tr.speasyforms-adapter-static").remove();
            $.each(Object.keys(opt.adapters).sort(this.compareAdapters), function (idx, adapterField) {
                opt.adapter = opt.adapters[adapterField];
                opt.fieldName = adapterField;
                if (opt.adapter.type in adapterCollection.adapterImplementations) {
                    adapterCollection.drawAdapter(opt);
                }
            });
            if ($("#spEasyFormsAdapterTable tr.speasyforms-adapter-static").length === 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='speasyforms-adapter-static'>" +
                    "<td class='ui-widget-content ui-corner-all nobr' colspan='5'>" +
                    "There are no adpaters configured for the current form.</td></tr>");
            }

            $(".speasyforms-deleteadapter").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function () {
                var internalName = $($(this).closest("tr").find("td")[1]).text();
                opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                delete opt.currentConfig.adapters.def[internalName];
                $.spEasyForms.configManager.set(opt);
                opt.refresh = $.spEasyForms.refresh.adapters;
                $.spEasyForms.containerCollection.toEditor(opt);
                return false;
            });
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

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

        getSupportedTypes: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                if ($.inArray(opt.spFieldType, impl.supportedTypes(opt)) >= 0) {
                    result.push(impl.type);
                }
            });
            return result;
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = true;
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
            var config = "";

            $.each(Object.keys(opt.adapter).sort(), function (idx, key) {
                if (key !== "type" && key !== "columnNameInternal") {
                    if (config.length > 0) {
                        config += "<br />";
                    }
                    config += "<b>" + $.spEasyForms.utilities.titleCase(key) + "</b> = " + opt.adapter[key];
                }
            });
    
            var tableRow = $("#spEasyFormsTemplates .speasyforms-adapterrowtemplate").
                clone().
                attr("data-fieldname", opt.adapter.columnNameInternal);
            $("#spEasyFormsAdapterTable").append(tableRow);

            if ($.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal] &&
                !$.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].fieldMissing) {
                displayName = $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].displayName;
            }
            else {
                tableRow.addClass("speasyforms-fieldmissing").find("td").addClass("speasyforms-fieldmissing");
            }

            tableRow.find(".speasyforms-displayname").text(displayName);
            tableRow.find(".speasyforms-internalname").text(opt.adapter.columnNameInternal);
            tableRow.find(".speasyforms-adaptertype").text(opt.adapter.type);
            tableRow.find(".speasyforms-adapterconfig").html(config);
            tableRow.find("button.speasyforms-deleteadapter").attr("id", opt.adapter.columnNameInternal + "Delete");

            if (opt.verbose && tableRow.hasClass("speasyforms-fieldmissing")) {
                tableRow.find("td.speasyforms-adapter-static").addClass("ui-state-error");
            }
            else if (tableRow.hasClass("speasyforms-fieldmissing")) {
                tableRow.addClass("speasyforms-hidden").find("td").addClass("speasyforms-hidden");
            }
        },

        compareAdapters: function (a, b) {
            var listctx = $.spEasyForms.sharePointContext.getListContext();
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
                var div = $("<div/>", { "class": "speasyforms-error" }).text("'" + options.displayName + "' is a required field!");
                control.parent().append(div);
            }
        }
    };
    var adapterCollection = $.spEasyForms.adapterCollection;

})(spefjQuery);
