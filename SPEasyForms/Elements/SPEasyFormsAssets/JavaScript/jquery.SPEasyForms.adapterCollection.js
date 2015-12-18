/*
 * SPEasyForms.adapterCollection - collection of field control adapters.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2015 Joe McShea
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

            if ($("#spEasyFormsAdapterTable tr.speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#adapterTab").addClass("speasyforms-fieldmissing");
            }
            else {
                $("#adapterTab").removeClass("speasyforms-fieldmissing");
            }

            $("tr.speasyforms-adapter-static").each(function (idx, r) {
                var row = $(r);
                var internalName = $(row.find("td")[1]).text();
                if (row.find("td").length > 1) {
                    row.append("<td><button id='" + internalName + "Delete' title='Delete' class='speasyforms-containerbtn speasyforms-deleteadapter' style='height: 25px;'></button></td>");
                }
            });

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
            var klass = "speasyforms-adapter-static speasyforms-dblclickdialog";
            var title = JSON.stringify(opt.adapter);
            var config = "";

            $.each(Object.keys(opt.adapter).sort(), function (idx, key) {
                if (key !== "type" && key !== "columnNameInternal") {
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

})(spefjQuery);
