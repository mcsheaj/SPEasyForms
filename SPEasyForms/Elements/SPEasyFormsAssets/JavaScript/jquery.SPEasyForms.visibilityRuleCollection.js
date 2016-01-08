/*
 * SPEasyForms.visibilityRuleCollection - object to hold and manage all field visibility rules.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var utils = $.spEasyForms.utilities;

    ////////////////////////////////////////////////////////////////////////////
    // Enforcer of field visibility rules.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.visibilityRuleCollection = {
        initialized: false,
        setTimeoutCalled: false,
        siteGroups: [],

        /*********************************************************************
        * Each method implements a comparison operator for a conditional expression.
        *********************************************************************/
        comparisonOperators: {
            equals: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) === (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) === Number(test);
                }
                return (value.toLowerCase() === test.toLowerCase());
            },
            matches: function (value, test) {
                var regex = new RegExp(test, "i");
                return regex.test(value);
            },
            notMatches: function (value, test) {
                var regex = new RegExp(test, "i");
                return !regex.test(value);
            },
            greaterThan: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) > (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) > Number(test);
                }
                return (value > test);
            },
            greaterThanOrEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) >= (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) >= Number(test);
                }
                return (value >= test);
            },
            lessThan: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) < (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) < Number(test);
                }
                return (value < test);
            },
            lessThanOrEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) <= (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) <= Number(test);
                }
                return (value <= test);
            },
            notEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) > (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) !== Number(test);
                }
                return (value !== test);
            }
        },

        /*********************************************************************
        * Each method implements a state transformation for a field.
        *********************************************************************/
        stateHandlers: {
            hidden: function (options) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var row = opt.row;
                if (row.row.attr("data-visibilityhidden") !== "true") {
                    row.row.attr("data-visibilityhidden", "true").hide();
                }
            },
            readOnly: function (options) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var row = opt.row;
                var formType = visibilityRuleCollection.getFormType(opt);
                if (formType !== "display") {
                    var value = $.spEasyForms.sharePointFieldRows.value(opt);
                    if (!value && !visibilityRuleCollection.setTimeoutCalled) {
                        if (!opt.noRecurse) {
                            visibilityRuleCollection.setTimeoutCalled = true;
                            setTimeout(function () {
                                var o = $.extend({}, $.spEasyForms.defauts, opt);
                                o.row = row;
                                var v = $.spEasyForms.sharePointFieldRows.value(o);
                                $("#readOnly" + row.internalName).html(v);
                                opt.noRecurse = true;
                                visibilityRuleCollection.transform(opt);
                                $.spEasyForms.adapterCollection.transform(opt);
                                $.spEasyForms.containerCollection.postTransform(opt);
                            }, 1000);
                        }
                        value = "&nbsp;";
                    }
                    var html;
                    if (row.row.attr("data-headerontop") === "true") {
                        html = $("<tr/>", { "data-visibilityadded": "true" });
                        html.append($("<td/>", { "valign": "top", "class": "ms-formbody" }));
                        html.children("td").append("<div/>");
                        html.find("div").html("<nobr class='speasyforms-columnheader'>" + row.displayName + "</nobr>");
                        html.children("td").append((value.length > 0 ? value : "&nbsp;"));
                    }
                    else {
                        html = '<tr data-visibilityadded="true">' +
                            '<td valign="top" width="350px" ' +
                            'class="ms-formlabel">' +
                            '<div><nobr class="speasyforms-columnheader">' +
                            row.displayName +
                            '</nobr></td><td class="ms-formbody">' +
                            '<span id="readOnly' + row.internalName + '">' + value + '</span></td></tr>';
                        if (row.row.find("td.ms-formbody h3.ms-standardheader").length > 0) {
                            html = '<tr data-visibilityadded="true">' +
                                '<td valign="top" ' +
                                'width="350px" class="ms-formbody">' +
                                '<h3 class="ms-standardheader"><nobr>' +
                                row.displayName + '</nobr></h3>' +
                                value + '</td></tr>';
                        }
                    }
                    if (row.row.attr("data-visibilityhidden") !== "true") {
                        row.row.attr("data-visibilityhidden", "true").hide();
                    }
                    if (row.row.next().attr("data-visibilityadded") !== "true") {
                        $(html).insertAfter(row.row);
                    }
                }
            },
            editable: function () { /*do nothing*/ },
            highlightRed: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "LightPink");
            },
            highlightYellow: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "Yellow");
            },
            highlightGreen: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "SpringGreen");
            },
            highlightBlue: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "Aqua");
            }
        },

        /*********************************************************************
        * Undo anything that was done by a previous invocation of transform. i.e.
        * show anything marked data-visibilityhidden, remove anything marked
        * data-visibilityadded, and remove any classes in data-visibilityclassadded.
        *********************************************************************/
        scrubCollection: function (collection) {
            collection.each(function (idx, current) {
                if ($(current).attr("data-visibilityadded") === "true") {
                    $(current).remove();
                }
                else {
                    if ($(current).next().attr("data-visibilityadded") === "true") {
                        $(current).next().remove();
                    }
                    if ($(current).attr("data-visibilityhidden") === "true") {
                        $(current).attr("data-visibilityhidden", "false").show();
                    }
                    if ($(current).attr("data-visibilityclassadded")) {
                        $(current).removeClass($(current).attr("data-visibilityclassadded"));
                        $(current).attr("data-visibilityclassadded", "");
                    }
                    $(current).find("[data-visibilityadded='true']").remove();
                    $(current).find("[data-visibilityhidden='true']").attr("data-visibilityhidden", "false").show();
                    $(current).find("[data-visibilityclassadded!=''][data-visibilityclassadded]").each(function () {
                        var klass = $(this).attr("data-visibilityclassadded");
                        $(this).removeClass(klass).attr("data-visibilityclassadded", "");
                    });
                }
            });
        },

        /*********************************************************************
        * Transform the current form by hiding fields or makin them read-only
        * as required by the current configuration and the group membership
        * of the current user.
        *
        * @param {object} options - {
        *     config: {object}
        * }
        *********************************************************************/
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentConfig && opt.currentConfig.visibility && opt.currentConfig.visibility.def &&
                Object.keys(opt.currentConfig.visibility.def).length > 0) {
                $.each($.spEasyForms.containerCollection.rows, function (idx, row) {
                    opt.row = row;
                    if (row.internalName in opt.currentConfig.visibility.def) {
                        var ruleHandled = false;
                        $.each(opt.currentConfig.visibility.def[row.internalName], function (index, rule) {
                            opt.rule = rule;
                            if (!ruleHandled) {
                                var formMatch = visibilityRuleCollection.checkForm(opt);
                                var appliesMatch = visibilityRuleCollection.checkAppliesTo(opt);
                                var conditionalMatch = visibilityRuleCollection.checkConditionals(opt);
                                if (formMatch && appliesMatch && conditionalMatch) {
                                    var stateHandler = $.spEasyForms.utilities.jsCase(rule.state);
                                    if (stateHandler in visibilityRuleCollection.stateHandlers) {
                                        visibilityRuleCollection.scrubCollection(opt.row.row);
                                        visibilityRuleCollection.stateHandlers[stateHandler](opt);
                                        ruleHandled = true;
                                    }
                                }
                            }
                            if (rule.conditions) {
                                $.each(rule.conditions, function (idx, condition) {
                                    var tr = $.spEasyForms.containerCollection.rows[condition.name];
                                    if (tr === undefined) {
                                        tr = {
                                            displayName: condition.name,
                                            internalName: condition.name,
                                            spFieldType: condition.name,
                                            value: "",
                                            row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                                            fieldMissing: true
                                        };
                                    }
                                    tr.row.find("input").addClass("speasyforms-visibilitychangelistener");
                                    tr.row.find("select").addClass("speasyforms-visibilitychangelistener");
                                    tr.row.find("textarea").addClass("speasyforms-visibilitychangelistener");
                                });
                            }
                        });
                        if (!ruleHandled) {
                            visibilityRuleCollection.scrubCollection(opt.row.row);
                        }
                    }
                });
                var body = $("#s4-bodyContainer");
                if (body.attr("data-visibilitychangelistener") !== "true") {
                    body.attr("data-visibilitychangelistener", "true");
                    body.on("change", ".speasyforms-visibilitychangelistener", function () {
                        visibilityRuleCollection.transform(opt);
                        $.spEasyForms.adapterCollection.transform(opt);
                        $.spEasyForms.containerCollection.postTransform(opt);
                    });
                }
            }
        },

        /*********************************************************************
        * Convert the conditional visibility rules for the current config into
        * an editor.
        *
        * @param {object} options - {
        *     // see the definition of defaults for options
        * }
        *********************************************************************/
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!this.initialized) {
                this.wireDialogEvents(opt);
            }
            this.drawRuleTableTab(opt);
            this.initialized = true;

            if (!opt.verbose) {
                $("#staticVisibilityRules .speasyforms-fieldmissing").hide();
            }

            if ($("#staticVisibilityRules .speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#staticVisibilityRules .speasyforms-fieldmissing").addClass("ui-state-error");
            }
        },

        /*********************************************************************
        * Convert the editor back into a set of conditional visibility rules.
        *
        * @param {object} options - {
        *     // see the definition of defaults for options
        * }
        *********************************************************************/
        toConfig: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var rules = [];
            var fieldName = $("#conditionalVisibilityField").val();
            $("#conditionalVisibilityRules tr:not(:first)").each(function (idx, tr) {
                var tds = $(tr).find("td");
                var appliesTo = tds[1].innerHTML !== "Everyone" ? tds[1].innerHTML : "";
                var rule = {
                    state: tds[0].innerHTML,
                    appliesTo: appliesTo,
                    forms: tds[2].innerHTML,
                    conditions: []
                };
                $.each($(tds[3]).find("div.speasyforms-conditiondisplay"), function (idx, div) {
                    var conditionArray = $(div).text().split(";");
                    if (conditionArray.length >= 2) {
                        var condition = {
                            name: conditionArray[0],
                            type: conditionArray[1],
                            value: conditionArray.length === 3 ? conditionArray[2] : ""
                        };
                        if (condition.name) {
                            rule.conditions.push(condition);
                        }
                    }
                });
                rules.push(rule);
            });
            var config = $.spEasyForms.configManager.get(opt);
            config.visibility.def[fieldName] = rules;
            return config;
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var displayName = opt.fieldName;
            if (opt.fieldName in opt.currentListContext.fields) {
                displayName = opt.currentListContext.fields[opt.fieldName].displayName;
            }
            $("#conditionalVisibilityField").val(opt.fieldName);
            $('#conditionalVisibilityDialogHeader').text(
                "Rules for Column '" + displayName +
                "'");
            $("#conditonalVisibilityRulesDialog").dialog('open');
            opt.currentConfig.visibility = visibilityRuleCollection.getVisibility(opt);
            opt.stat = false;
            visibilityRuleCollection.drawRuleTable(opt);
        },

        /*********************************************************************
        * Draw a set of rules for a single field as a table. This function draws
        * the rules table for the conditional visibility dialog.
        *********************************************************************/
        drawRuleTable: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#conditionalVisibilityRules").html("");
            if (opt.currentConfig.visibility.def[opt.fieldName].length === 0) {
                $("#conditionalVisibilityRules").html(
                    "There are currently no rules for this field. Click " +
                    "the plus sign to add one.");
            } else {
                var table = $("#spEasyFormsTemplates .speasyforms-visibilityrulestabletemplate").
                    clone().
                    attr("id", "conditionalVisibilityRulesTable");
                $("#conditionalVisibilityRules").append(table);

                $.each(opt.currentConfig.visibility.def[opt.fieldName], function (idx, rule) {
                    var tableRow = $("#spEasyFormsTemplates .speasyforms-visibilityrulesrowtemplate").clone();

                    var conditions = "";
                    if (rule.conditions) {
                        $.each(rule.conditions, function (i, condition) {
                            conditions += "<div class='speasyforms-conditiondisplay'>" +
                                condition.name + ";" + condition.type + ";" +
                                condition.value + "</div>";
                            if (!$.spEasyForms.containerCollection.rows[condition.name] || $.spEasyForms.containerCollection.rows[condition.name].fieldMissing) {
                                conditionalFieldsMissing.push(condition.name);
                            }
                        });
                    } else {
                        conditions = "&nbsp;";
                    }

                    tableRow.find(".speasyforms-state").text(rule.state);
                    tableRow.find(".speasyforms-appliesto").text(rule.appliesTo);
                    tableRow.find(".speasyforms-forms").text(rule.forms);
                    tableRow.find(".speasyforms-when").html(conditions);
                    tableRow.find("button[title='Edit Rule']").attr("id", "addVisililityRuleButton" + idx);
                    tableRow.find("button[title='Delete Rule']").attr("id", "delVisililityRuleButton" + idx);

                    table.append(tableRow);
                });
                this.wireVisibilityRulesTable(opt);
            }
        },

        /*********************************************************************
        * Draw a the table with all rule for the conditional visibility tab of 
        * the main editor.
        *********************************************************************/
        drawRuleTableTab: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#staticVisibilityRules").remove();
            var table = $("#spEasyFormsTemplates .speasyforms-staticrulestabletemplate").
                clone().
                attr("id", "staticVisibilityRules");
            $.each(Object.keys(opt.currentConfig.visibility.def).sort(), function (idx, key) {
                $.each(opt.currentConfig.visibility.def[key], function (i, rule) {
                    opt.index = idx + "_" + i;

                    opt.rowInfo = $.spEasyForms.containerCollection.rows[key];
                    if (!opt.rowInfo) {
                        $.spEasyForms.containerCollection.rows[key] = {
                            displayName: key,
                            internalName: key,
                            spFieldType: key,
                            value: "",
                            row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                            fieldMissing: true
                        };
                        opt.rowInfo = $.spEasyForms.containerCollection.rows[key];
                    }

                    var tr = $("#spEasyFormsTemplates .speasyforms-staticrulesrowtemplate").
                        clone().
                        attr("id", "visibilityRule" + opt.index);

                    if ($.spEasyForms.containerCollection.rows[key].fieldMissing) {
                        tr.addClass("speasyforms-fieldmissing").addClass("ui-state-error");
                    }
                    var conditions = "";
                    var conditionalFieldsMissing = [];
                    if (rule.conditions && rule.conditions.length > 0) {
                        $.each(rule.conditions, function (i, condition) {
                            conditions += "<div class='speasyforms-conditiondisplay'>" +
                                condition.name + ";" + condition.type + ";" +
                                condition.value + "</div>";
                            if (!$.spEasyForms.containerCollection.rows[condition.name] ||
                                $.spEasyForms.containerCollection.rows[condition.name].fieldMissing) {
                                conditionalFieldsMissing.push(condition.name);
                                tr.addClass("speasyforms-fieldmissing").addClass("ui-state-error");
                            }
                        });
                    }

                    tr.find(".speasyforms-displayname").text(opt.rowInfo.displayName);
                    tr.find(".speasyforms-internalname").text(opt.rowInfo.internalName);
                    tr.find(".speasyforms-state").text(rule.state);
                    tr.find(".speasyforms-appliesto").text(rule.appliesTo.length > 0 ? rule.appliesTo : "Everyone");
                    tr.find(".speasyforms-forms").text(rule.forms);
                    tr.find(".speasyforms-when").html(conditions);

                    if (opt.rowInfo.fieldMissing) {
                        tr.find("td").addClass("speasyforms-fieldmissing");
                    }

                    table.append(tr);
                });
            });
            $("#tabs-min-visibility").append(table);
            if ($("tr.speasyforms-staticrules").length === 0) {
                $("#staticVisibilityRules").append("<td class='ui-widget-content ui-corner-all nobr' colspan='5'>There are no conditional visibility rules for the current form.</td>");
            }
        },

        /*********************************************************************
        * Wire up the buttons for a rules table (only applicable to the conditional
        * visibility dialog since the rules tables on the main editor are static)
        *********************************************************************/
        wireVisibilityRulesTable: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("[id^='delVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function () {
                opt.index = this.id.replace("delVisililityRuleButton", "");
                opt.fieldName = $("#conditionalVisibilityField").val();
                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                opt.currentConfig.visibility.def[opt.fieldName].splice(opt.index, 1);
                $.spEasyForms.configManager.set(opt);
                visibilityRuleCollection.drawRuleTable(opt);
                opt.refresh = $.spEasyForms.refresh.visibility;
                $.spEasyForms.containerCollection.toEditor(opt);
            });

            $("[id^='addVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-gear"
                },
                text: false
            }).click(function () {
                visibilityRuleCollection.clearRuleDialog(opt);
                opt.index = this.id.replace("addVisililityRuleButton", "");
                $("#visibilityRuleIndex").val(opt.index);
                opt.fieldName = $("#conditionalVisibilityField").val();
                $("#addVisibilityRuleField").val(opt.fieldName);
                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                var rule = opt.currentConfig.visibility.def[opt.fieldName][opt.index];
                $("#addVisibilityRuleState").val(rule.state);
                $.each(rule.appliesTo.split(';'), function (idx, entity) {
                    if (entity === "AUTHOR") {
                        $("#addVisibilityRuleApplyToAuthor")[0].checked = true;
                    } else if (entity.length > 0) {
                        var span = $("<span>").addClass("speasyforms-entity").
                        attr('title', entity).text(entity);
                        $("<a>").addClass("speasyforms-remove").attr({
                            "href": "#",
                            "title": "Remove " + entity
                        }).
                        text("x").appendTo(span);
                        $("#spEasyFormsEntityPicker").prepend(span);
                        $("#addVisibilityRuleApplyTo").val("").css("top", 2);
                        visibilityRuleCollection.siteGroups.splice($.inArray(entity,
                            visibilityRuleCollection.siteGroups), 1);
                    }
                });
                if (rule.forms.indexOf('New') >= 0) {
                    $("#addVisibilityRuleNewForm")[0].checked = true;
                } else if (rule.forms.indexOf('Edit') >= 0) {
                    $("#addVisibilityRuleEditForm")[0].checked = true;
                } else if (rule.forms.indexOf('Display') >= 0) {
                    $("#addVisibilityRuleDisplayForm")[0].checked = true;
                }
                if (rule.conditions) {
                    $.each(rule.conditions, function (index, condition) {
                        $("#conditionalField" + (index + 1)).val(condition.name);
                        $("#conditionalType" + (index + 1)).val(condition.type);
                        $("#conditionalValue" + (index + 1)).val(condition.value);
                        $("#condition" + (index + 1)).show();
                        if ($(".speasyforms-condition:hidden").length === 0) {
                            $("#spEasyFormsAddConditionalBtn").hide();
                        }
                    });
                }
                $('#addVisibilityRuleDialog').dialog("open");
                return false;
            });

            // make the visibility rules sortable
            $("tbody.speasyforms-sortablerules").sortable({
                connectWith: ".speasyforms-rulestable",
                items: "> tr:not(:first)",
                helper: "clone",
                placeholder: "speasyforms-placeholder",
                zIndex: 990,
                update: function (event) {
                    if (!event.handled) {
                        opt.currentConfig = visibilityRuleCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        visibilityRuleCollection.drawRuleTable(opt);
                        opt.refresh = $.spEasyForms.refresh.visibility;
                        $.spEasyForms.containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                }
            });
        },

        /*********************************************************************
        * Wire up the conditional visibility dialog boxes.
        *********************************************************************/
        wireDialogEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // wire the conditional visilibity dialog
            var conditionalVisibilityOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        $('#conditonalVisibilityRulesDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 800
            };
            $('#conditonalVisibilityRulesDialog').dialog(conditionalVisibilityOpts);

            // wire the add/edit visibility rule dialog
            var addVisibilityRuleOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        opt.state = $('#addVisibilityRuleState').val();
                        if (opt.state === '') {
                            $('#addVisibilityRuleStateError').text(
                                "You must select a value for state!");
                        } else {
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
                            opt.fieldName = $("#addVisibilityRuleField").val();
                            opt.currentConfig.visibility = visibilityRuleCollection.getVisibility(opt);
                            opt.index = $("#visibilityRuleIndex").val();
                            if (opt.index.length === 0) {
                                var newRule = visibilityRuleCollection.getRule(opt);
                                opt.currentConfig.visibility.def[opt.fieldName].push(newRule);
                            } else {
                                var rule = visibilityRuleCollection.getRule(opt);
                                opt.currentConfig.visibility.def[opt.fieldName][opt.index] = rule;
                            }
                            $.spEasyForms.configManager.set(opt);
                            $('#addVisibilityRuleDialog').dialog("close");
                            $("#conditonalVisibilityRulesDialog").dialog("open");
                            visibilityRuleCollection.drawRuleTable(opt);
                            opt.refresh = $.spEasyForms.refresh.visibility;
                            $.spEasyForms.containerCollection.toEditor(opt);
                        }
                        return false;
                    },
                    "Cancel": function () {
                        $('#addVisibilityRuleDialog').dialog("close");
                        $("#conditonalVisibilityRulesDialog").dialog("open");
                        return false;
                    }
                },
                autoOpen: false,
                width: 750
            };
            $('#addVisibilityRuleDialog').dialog(addVisibilityRuleOpts);

            // wire the button to launch the add/edit rule dialog
            $("#addVisibilityRule").button({
                icons: {
                    primary: "ui-icon-plusthick"
                },
                text: false
            }).click(function () {
                $("#conditonalVisibilityRulesDialog").dialog("close");
                visibilityRuleCollection.clearRuleDialog(opt);
                $('#addVisibilityRuleDialog').dialog("open");
                return false;
            });

            // wire the button to launch the add/edit rule dialog
            $("#spEasyFormsAddConditionalBtn").button({
                icons: {
                    primary: "ui-icon-plusthick"
                },
                text: false
            }).click(function () {
                $(".speasyforms-condition:hidden").first().show();
                if ($(".speasyforms-condition:hidden").length === 0) {
                    $("#spEasyFormsAddConditionalBtn").hide();
                }
                return false;
            });

            // wire the entity picker on the add/edit rule dialog
            $("input.speasyforms-entitypicker").autocomplete({
                source: this.siteGroups.sort(),

                select: function (e, ui) {
                    var group = ui.item.value;
                    var span = $("<span>").addClass("speasyforms-entity").
                    attr('title', group).text(group);
                    $("<a>").addClass("speasyforms-remove").attr({
                        "href": "#",
                        "title": "Remove " + group
                    }).
                    text("x").appendTo(span);
                    span.insertBefore(this);
                    $(this).val("").css("top", 2);
                    visibilityRuleCollection.siteGroups.splice(
                        $.inArray(group, visibilityRuleCollection.siteGroups), 1);
                    $(this).autocomplete(
                        "option", "source", visibilityRuleCollection.siteGroups.sort());
                    return false;
                }
            });
            $(".speasyforms-entitypicker").click(function () {
                $(this).find("input").focus();
            });
            $("#spEasyFormsEntityPicker").on("click", ".speasyforms-remove", function () {
                visibilityRuleCollection.siteGroups.push($(this).parent().attr("title"));
                $(this).closest("div").find("input").
                autocomplete("option", "source", visibilityRuleCollection.siteGroups.sort()).
                focus();
                $(this).parent().remove();
            });
        },

        /*********************************************************************
        * Get the current visibility rules.
        *
        * @return {object} - the current visibility rules.
        *********************************************************************/
        getVisibility: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!opt.currentConfig.visibility) {
                opt.currentConfig.visibility = {
                    def: {}
                };
            }
            if (!opt.currentConfig.visibility.def[opt.fieldName]) {
                opt.currentConfig.visibility.def[opt.fieldName] = [];
            }
            return opt.currentConfig.visibility;
        },

        /*********************************************************************
        * Construct a rule from the add/edit rule dialog box.
        *
        * @return {object} - the new rule.
        *********************************************************************/
        getRule: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {};
            result.state = opt.state;
            result.forms = "";
            $(".speasyforms-formcb").each(function (idx, cb) {
                if (cb.checked) {
                    if (result.forms.length > 0) {
                        result.forms += ";";
                    }
                    result.forms += this.id.replace("addVisibilityRule", "").replace("Form", "");
                }
            });
            result.appliesTo = "";
            $('#spEasyFormsEntityPicker .speasyforms-entity').each(function (idx, span) {
                if (result.appliesTo.length > 0) {
                    result.appliesTo += ";";
                }
                result.appliesTo += $(span).attr("title");
            });
            var author = $("#addVisibilityRuleApplyToAuthor")[0].checked;
            if (author) {
                if (result.appliesTo.length > 0) {
                    result.appliesTo = ";" + result.appliesTo;
                }
                result.appliesTo = "AUTHOR" + result.appliesTo;
            }
            var conditions = $(".speasyforms-conditionalvalue");
            result.conditions = [];
            conditions.each(function () {
                if ($(this).val().length >= 0 && $(this).prev().prev().val().length > 0) {
                    var newCondition = {};
                    newCondition.name = $(this).prev().prev().val();
                    newCondition.type = $(this).prev().val();
                    newCondition.value = $(this).val();
                    result.conditions.push(newCondition);
                }
            });
            return result;
        },

        /*********************************************************************
        * Reset the add/edit rule dialog box.
        *********************************************************************/
        clearRuleDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#addVisibilityRuleField").val($("#conditionalVisibilityField").val());
            $("#visibilityRuleIndex").val("");
            $('#addVisibilityRuleState').val('');
            $('#addVisibilityRuleStateError').text('');
            $('#addVisibilityRuleApplyToAuthor').attr('checked', false);
            $('#addVisibilityRuleApplyTo').val('');
            $('#spEasyFormsEntityPicker .speasyforms-entity').remove();
            $('#addVisibilityRuleNewForm').attr('checked', true);
            $('#addVisibilityRuleEditForm').attr('checked', true);
            $('#addVisibilityRuleDisplayForm').attr('checked', true);
            $(".speasyforms-conditionalvalue").val("").not(":first").parent().hide();
            $(".speasyforms-conditionalfield").val("");
            $("#spEasyFormsAddConditionalBtn").show();
            var siteGroups = $.spEasyForms.sharePointContext.getSiteGroups(opt);
            $.each(siteGroups, function (idx, group) {
                if ($.inArray(group.name, visibilityRuleCollection.siteGroups) < 0) {
                    visibilityRuleCollection.siteGroups.push(group.name);
                }
            });
        },

        /*********************************************************************
        * Get the current form type. This function looks for the word new, edit,
        * or display in the current page name (case insensative.
        *
        * @return {string} - new, edit, display, or "".
        *********************************************************************/
        getFormType: function () {
            var result = "";
            var page = window.location.pathname;
            page = page.substring(page.lastIndexOf("/") + 1).toLowerCase();
            if (page === "start.aspx") {
                page = window.location.href.substring(
                    window.location.href.indexOf("#") + 1);
                page = page.substring(page.lastIndexOf("/") + 1,
                    page.indexOf("?")).toLowerCase();
            }
            if (page.indexOf("new") >= 0) {
                result = "new";
            } else if (page.indexOf("edit") >= 0 &&
                page.toLocaleLowerCase().indexOf("listedit.aspx") &&
                page.toLocaleLowerCase().indexOf("fldnew.aspx") &&
                page.toLocaleLowerCase().indexOf("fldedit.aspx")
                ) {
                result = "edit";
            } else if (page.indexOf("disp") >= 0 || page.indexOf("display") >= 0) {
                result = "display";
            }
            return result;
        },

        /*********************************************************************
        * Check if a rule passes based solely on which form we're on.
        *********************************************************************/
        checkForm: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var formType = visibilityRuleCollection.getFormType(opt);
            var ruleForms = $(opt.rule.forms.split(';')).map(function () {
                return this.toLowerCase();
            });
            return $.inArray(formType, ruleForms) >= 0;
        },

        /*********************************************************************
        * Check if a rule passes based solely on who it applies to.
        *********************************************************************/
        checkAppliesTo: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var appliesMatch = false;
            if (opt.rule.appliesTo.length === 0) {
                appliesMatch = true;
            } else {
                var appliesToGroups = opt.rule.appliesTo.split(';');
                var formType = visibilityRuleCollection.getFormType(opt);
                if (appliesToGroups[0] === "AUTHOR" && formType === "new") {
                    appliesMatch = true;
                } else {
                    if (appliesToGroups[0] === "AUTHOR") {
                        var authorHref = $("span:contains('Created  at')").
                            find("a.ms-subtleLink").attr("href");
                        if (!authorHref) {
                            authorHref = $("td.ms-descriptiontext span a").attr("href");
                        }
                        if (authorHref) {
                            var authorId = parseInt(
                                authorHref.substring(authorHref.indexOf("ID=") + 3), 10);
                            if (authorId === opt.currentContext.userId) {
                                appliesMatch = true;
                            }
                        }
                    }
                    if (!appliesMatch) {
                        var userGroups = $.spEasyForms.sharePointContext.getUserGroups(opt);
                        $.each(userGroups, function (i, group) {
                            if ($.inArray(group.name, appliesToGroups) >= 0) {
                                appliesMatch = true;
                                return false;
                            }
                        });
                    }
                }
            }
            return appliesMatch;
        },

        /*********************************************************************
        * Check if a rule passes based solely on its conditional expressions.
        *********************************************************************/
        checkConditionals: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = false;
            if (!opt.rule.conditions || opt.rule.conditions.length === 0) {
                result = true;
            } else {
                result = true;
                $.each(opt.rule.conditions, function (idx, condition) {
                    opt.row = $.spEasyForms.containerCollection.rows[condition.name];
                    if (opt.row) {
                        var currentValue = $.spEasyForms.sharePointFieldRows.value(opt);
                        var type = $.spEasyForms.utilities.jsCase(condition.type);
                        var comparisonOperator = $.spEasyForms.visibilityRuleCollection.comparisonOperators[type];
                        opt.condition = condition;
                        var expandedValue = $.spEasyForms.visibilityRuleCollection.expandRuleValue(opt);
                        result = comparisonOperator(currentValue, expandedValue);
                        if (result === false)
                            return false; // return from $.each
                    }
                    else {
                        result = false;
                        return false; // return from $.each
                    }
                });
            }
            return result;
        },

        /*********************************************************************
        * Search and substitue for variables in the conditional value. Possible
        * variables include:
        * 
        * [CurrentUser] - epands to ctx.userId
        * [CurrentUserId] - epands to ctx.userId
        * [CurrentUserLogin] - epands to ctx.userInformation.userName
        * [CurrentUserEmail] - epands to ctx.userInformation.eMail
        * [Today] - expands to the current date
        * [Today[+-]X] - expands to the current date plus or minus X days
        * [Now] - expands to the current datetime
        * [Now[+-]X] - expands to the current datetime plus or minus X minutes
        *********************************************************************/
        expandRuleValue: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var expandedValue = opt.condition.value;
            // expand current user variables
            if (opt.condition.value.indexOf("[CurrentUser") >= 0) {
                var ctx = $.spEasyForms.sharePointContext.get(opt);
                expandedValue = expandedValue.replace(/\[CurrentUser\]/g, "userdisp.aspx\\?ID=" + ctx.userId + "[$&]");
                expandedValue = expandedValue.replace(/\[CurrentUserId\]/g, ctx.userId);
                expandedValue = expandedValue.replace(/\[CurrentUserLogin\]/g, ctx.userInformation.userName);
                expandedValue = expandedValue.replace(/\[CurrentUserEmail\]/g, ctx.userInformation.eMail);
            }
            // expand [Today] variables
            var date = new Date();
            var parts;
            if (opt.condition.value.indexOf("[Today") >= 0) {
                expandedValue = expandedValue.replace(/\[Today\]/g, $.datepicker.formatDate("mm-dd-yy", date));
                parts = expandedValue.match(/(\[Today[+-][0-9]*\])/g);
                if (parts) {
                    $.each($(parts), function (idx, part) {
                        try {
                            var i = Number(part.match(/\[Today[+-]([0-9]*)\]/)[1]);
                            var newDate = new Date();
                            if (part.indexOf("+") >= 0) {
                                newDate.setTime(date.getTime() + i * 86400000);
                            }
                            else {
                                newDate.setTime(date.getTime() - i * 86400000);
                            }
                            expandedValue = expandedValue.replace(part, $.datepicker.formatDate("mm/dd/yy", newDate));
                        } catch (e) { }
                    });
                }
            }
            // expand [Now] variables
            if (opt.condition.value.indexOf("[Now") >= 0) {
                expandedValue = expandedValue.replace(/\[Now\]/g,
                    $.datepicker.formatDate("mm-dd-yy", date) + " " + date.getHours() + ":" + date.getMinutes());
                parts = expandedValue.match(/(\[Now[+-][0-9]*\])/g);
                if (parts) {
                    $.each($(parts), function (idx, part) {
                        try {
                            var i = Number(part.match(/\[Now[+-]([0-9]*)\]/)[1]);
                            var newDate = new Date();
                            if (part.indexOf("+") >= 0) {
                                newDate.setTime(date.getTime() + i * 60000);
                            } else {
                                newDate.setTime(date.getTime() - i * 60000);
                            }
                            expandedValue = expandedValue.replace(part,
                                $.datepicker.formatDate("mm/dd/yy", newDate) + " " + newDate.getHours() + ":" + newDate.getMinutes());
                        } catch (e) { }
                    });
                }
            }
            return expandedValue;
        }
    };
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;

})(spefjQuery);
