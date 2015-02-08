/*
 * SPEasyForms HotFixes - cumulative update for reported bugs.
 *
 * @version 2015.00.07
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, _spPageContextInfo, SP */
(function ($, undefined) {
    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // add a version to the about page for the AddOns solution
    $.spEasyForms.ShowAddOnsVersion_Original_InsertSettingsLink = $.spEasyForms.insertSettingsLink;
    $.spEasyForms.insertSettingsLink = function (opt) {
        var permissionsLink = $("a:contains('Permissions for this list')");
        if (permissionsLink.length > 0) {
            $.spEasyForms.ShowAddOnsVersion_Original_InsertSettingsLink(opt);
        }
    };

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    // save a reference to the original SPEasyForms init method
    $.spEasyForms.ResizeModalDialog_originalInit = $.spEasyForms.init;

    // replace the original SPEasyForms init method
    $.spEasyForms.init = function (options) {
        // call the original SPEasyForms init method
        $.spEasyForms.ResizeModalDialog_originalInit(options);

        var formHidden = $(".ms-formtable").css("display") === "none";

        ExecuteOrDelayUntilScriptLoaded(function () {
            var dlg = SP.UI.ModalDialog.get_childDialog();
            if (dlg !== null) {
                setTimeout(function () {
                    if (formHidden || $("#spEasyFormsContainersPre").length > 0) {
                        SP.UI.ModalDialog.get_childDialog().autoSize();
                        var dlgContent = $(".ms-dlgContent", window.parent.document);
                        dlgContent.css({ top: ($(window.top).height() / 2 - dlgContent.height() / 2) });
                        dlgContent.prev().css({ top: ($(window.top).height() / 2 - dlgContent.height() / 2) });
                    }
                }, (_spPageContextInfo.webUIVersion === 4 ? 2000 : 3000));
            }
        }, "sp.ui.dialog.js");
    };

    // override the checkConditionals method of visibilityRuleCollection to handle multiple
    // conditions correctly
    $.spEasyForms.visibilityRuleCollection.checkConditionals = function (options) {
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
                    result = comparisonOperator(currentValue, condition.value);
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
    };

    // create a posttransform method in the container collection to call all of the
    // individual posttransform methods of the containers
    $.spEasyForms.containerCollection.postTransform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        opt.prepend = true;
        $.each(opt.currentConfig.layout.def, function (index, layout) {
            var implementation = $.spEasyForms.utilities.jsCase(layout.containerType);
            if (implementation in containerCollection.containerImplementations) {
                var impl = containerCollection.containerImplementations[implementation];
                if (typeof (impl.postTransform) === 'function') {
                    opt.index = index;
                    opt.currentContainerLayout = layout;
                    opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");
                    impl.postTransform(opt);
                }
            }
            if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                if ($("#" + opt.containerId).children().last().find("td.ms-formbody").length === 0) {
                    $("#" + opt.containerId).children().last().hide();
                }
            }
            else {
                opt.prepend = false;
            }
        });
    };
    var containerCollection = $.spEasyForms.containerCollection;

    // replace tabs.postTransform to fix the issue with hidden parts of containers not dynamically
    // being shown when a field changes causing one of it's fields to be shown
    containerCollection.containerImplementations.tabs.postTransform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        opt.divId = "spEasyFormsTabDiv" + opt.index;
        $("#" + opt.divId + " table.speasyforms-tabs").each(function () {
            var index = $(this)[0].id.replace("spEasyFormsTabsTable", "");
            if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                if ($(this).parent().css("display") !== "none") {
                    var nextIndex = -1;
                    if ($(this).parent().next().length > 0) {
                        nextIndex = $(this).parent().next()[0].id.replace("spEasyFormsTabsDiv", "");
                        $(this).parent().next().show();
                        $("li.speasyforms-tabs" + nextIndex).addClass("ui-tabs-active").addClass("ui-state-active");
                    }
                    $(this).parent().hide();
                }
                $(".speasyforms-tabs" + index).hide();
            }
            else {
                $(".speasyforms-tabs" + index).show();
            }
        });
    };

    // replace accordion.postTransform to fix the issue with hidden parts of containers not dynamically
    // being shown when a field changes causing one of it's fields to be shown
    containerCollection.containerImplementations.accordion.postTransform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        $("#" + divId + " table.speasyforms-accordion").each(function () {
            var index = $(this)[0].id.replace("spEasyFormsAccordionTable", "");
            if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                $("#spEasyFormsAccordionHeader" + index).hide();
                $("#spEasyFormsAccordionHeader" + index).next().hide();
            }
            else {
                $("#spEasyFormsAccordionHeader" + index).show();
            }
        });
    };

    // replace columns.postTransform to fix the issue with hidden parts of containers not dynamically
    // being shown when a field changes causing one of it's fields to be shown
    containerCollection.containerImplementations.columns.postTransform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
        $("#" + outerTableId + " tr.speasyforms-columnrow").each(function () {
            if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                $(this).hide();
            }
            else {
                $(this).show();
            }
        });
    };

    // replace the visibility rules collection transform method to call the container collection 
    // posttransform method in the event hadlers for rules based on the value of another field
    $.spEasyForms.visibilityRuleCollection.transform = function (options) {
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
                                if (!tr.fieldMissing && tr.row.attr("data-visibilitychangelistener") !== "true") {
                                    tr.row.find("input").change(function () {
                                        visibilityRuleCollection.transform(opt);
                                        $.spEasyForms.adapterCollection.transform(opt);
                                        $.spEasyForms.containerCollection.postTransform(opt);
                                    });
                                    tr.row.find("select").change(function () {
                                        visibilityRuleCollection.transform(opt);
                                        $.spEasyForms.adapterCollection.transform(opt);
                                        $.spEasyForms.containerCollection.postTransform(opt);
                                    });
                                    tr.row.find("textarea").change(function () {
                                        visibilityRuleCollection.transform(opt);
                                        $.spEasyForms.adapterCollection.transform(opt);
                                        $.spEasyForms.containerCollection.postTransform(opt);
                                    });
                                    tr.row.attr("data-visibilitychangelistener", "true");
                                }
                            });
                        }
                    });
                    if (!ruleHandled) {
                        visibilityRuleCollection.scrubCollection(opt.row.row);
                    }
                }
            });
        }
    };
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;

    // replace toEditor to fix the overlap/scroll issues caused by hard coding the header height
    $.spEasyForms.toEditor = function (opt) {
        opt.currentConfig = $.spEasyForms.configManager.get(opt);
        if (_spPageContextInfo.webUIVersion === 4) {
            $("#spEasyFormsContent").css({
                position: "static",
                "overflow-y": "visible",
                "overflow-x": "visible"
            });
            $("div.speasyforms-panel").css({
                width: "auto",
                height: "auto",
                position: "static",
                "overflow-y": "visible",
                "overflow-x": "visible"
            });
            $("td.speasyforms-form").css("padding-left", "0px");
            $(".s4-title-inner").css("display", "none");
            $(".speasyforms-ribbon").css("position", "fixed");
            $("#s4-bodyContainer").css("overflow-x", "visible");
            $(".s4-notdlg").hide();
            $("#spEasyFormsOuterDiv").css({
                "margin-left": "-160px",
                "margin-top": "88px"
            });
            $("#RibbonContainer").append("<h3 class='speasyforms-breadcrumbs' style='position:fixed;top:0px;color:white;'><a href='" + opt.source + "' style='color:white;'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h3>");
            $("tr.speasyforms-sortablefields, tr.speasyforms-sortablerules").css("font-size", "0.9em");
        }
        else {
            $(".ms-cui-topBar2").prepend("<h2 class='speasyforms-breadcrumbs'><a href='" + opt.source + "'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h2>");
        }
        $.each(opt.currentListContext.contentTypes.order, function (i, ctid) {
            if (ctid.indexOf("0x0120") !== 0) {
                $("#spEasyFormsContentTypeSelect").append("<option value='" +
                    opt.currentListContext.contentTypes[ctid].id + "'>" +
                    opt.currentListContext.contentTypes[ctid].name + "</option>");
            }
        });
        $("#spEasyFormsContentTypeSelect").change(function () {
            delete $.spEasyForms.containerCollection.rows;
            delete $.spEasyForms.sharePointContext.formCache;
            opt.contentTypeChanged = true;
            $.spEasyForms.containerCollection.toEditor(opt);
        });
        $.spEasyForms.containerCollection.toEditor(opt);
        $(window).on("beforeunload", function () {
            if (!$("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled")) {
                return "You have unsaved changes, are you sure you want to leave the page?";
            }
        });
        $.spEasyForms.appendContext(opt);
        var bannerHeight = 5;
        if (_spPageContextInfo.webUIVersion === 4) {
            bannerHeight += $("#s4-ribbonrow").height();
        }
        else {
            bannerHeight += $("#suiteBarTop").height() + $("#suitBar").height() + $("#s4-ribbonrow").height() + $("#spEasyFormsRibbon").height();
        }
        $("div.speasyforms-panel").height($(window).height() - bannerHeight);
        if (_spPageContextInfo.webUIVersion === 4) {
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 445);
        }
        else {
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 405);
        }
        $(window).resize(function () {
            $("div.speasyforms-panel").height($(window).height() - bannerHeight);
            if (_spPageContextInfo.webUIVersion === 4) {
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 445);
            }
            else {
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 405);
            }
        });
        $('#spEasyFormsRibbon').show;
    };

    // only operate on the settings page
    if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") > -1) {
        $().ready(function () {
            $("b:contains('Version: 2014.01')").parent().append("<br /><b>AddOns: 2015.00.07</b>");
        });
    }

    var spContext = $.spEasyForms.sharePointContext;

    containerCollection.containerImplementations.tabs.transform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        opt.divId = "spEasyFormsTabDiv" + opt.index;
        var divClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
            opt.index + " ui-tabs ui-widget ui-widget-content ui-corner-all";
        var listId = "spEasyFormsTabsList" + opt.index;
        var listClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
            opt.index +
            " ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all";
        var containerDiv = $("#" + opt.containerId);
        containerDiv.append("<div id='" + opt.divId + "' class='" + divClass +
            "' style='width: 99%;'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
        var mostFields = 0;
        $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
            if (fieldCollection.fields.length > mostFields) {
                mostFields = fieldCollection.fields.length;
            }
        });
        $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
            var itemClass = "speasyforms-tabs speasyforms-tabs" + opt.index + "" + idx +
                " ui-state-default ui-corner-top";
            var tableClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
                opt.index + "" + idx;
            var innerDivId = "spEasyFormsTabsDiv" + opt.index + "" + idx;
            var tableId = "spEasyFormsTabsTable" + opt.index + "" + idx;
            $("#" + listId).append("<li class='" + itemClass +
                "'><a href='#" + innerDivId + "'>" + fieldCollection.name +
                "</a></li>");
            $("#" + opt.divId).append(
                "<div id='" + innerDivId +
                "' class='ui-tabs-panel ui-widget-content ui-corner-bottom'>" +
                "<table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldCollection.fields, function (fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                if (currentRow) {
                    var rtePresent = currentRow.row.find("iframe[id$='TextField_iframe']").length > 0;
                    if (!rtePresent && !currentRow.fieldMissing) {
                        result.push(field.fieldInternalName);
                        if (currentRow) {
                            currentRow.row.appendTo("#" + tableId);
                        }
                    }
                }
            });
        });
        $("#" + listId).find("li:first").addClass("ui-tabs-active").addClass("ui-state-active");
        $("#" + opt.divId).find("div.ui-tabs-panel").hide();
        $("#" + opt.divId).find("div.ui-tabs-panel:first").show();
        $("#" + listId).find("a").click(function () {
            $("#" + listId).find("li").removeClass("ui-tabs-active").removeClass("ui-state-active");
            $(this).closest("li").addClass("ui-tabs-active").addClass("ui-state-active");
            $("#" + opt.divId).find("div.ui-tabs-panel").hide();
            $($(this).attr("href")).show();
            return false;
        });

        return result;
    };

    containerCollection.containerImplementations.columns.transform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
        var outerTableClass = "speasyforms-container speasyforms-columns";
        $("#" + opt.containerId).append("<table id='" + outerTableId +
            "' class='" + outerTableClass + "'></table>");

        var condensedFieldCollections = [];
        $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
            var newCollection = {};
            newCollection.name = fieldCollection.name;
            newCollection.fields = [];
            $.each(fieldCollection.fields, function (i, field) {
                var row = containerCollection.rows[field.fieldInternalName];
                if (row && !row.fieldMissing) {
                    newCollection.fields.push(field);
                }
            });
            if (newCollection.fields.length > 0) {
                condensedFieldCollections.push(newCollection);
            }
        });

        var rowCount = 0;
        $.each(condensedFieldCollections, function (idx, fieldCollection) {
            if (fieldCollection.fields.length > rowCount) rowCount = fieldCollection.fields.length;
        });

        for (var i = 0; i < rowCount; i++) {
            var rowId = "spEasyFormsColumnRow" + opt.index + "" + i;
            $("#" + outerTableId).append("<tr id='" + rowId +
                "' class='speasyforms-columnrow'></tr>");
            for (var idx = 0; idx < condensedFieldCollections.length; idx++) {
                var fieldCollection = condensedFieldCollections[idx];
                var tdId = "spEasyFormsColumnCell" + opt.index + "" + i +
                    "" + idx;
                var innerTableId = "spEasyFormsInnerTable" + opt.index + "" +
                    i + "" + idx;
                if (fieldCollection.fields.length > i) {
                    var field = fieldCollection.fields[i];
                    var currentRow = containerCollection.rows[field.fieldInternalName];
                    var rtePresent = currentRow.row.find("iframe[id$='TextField_iframe']").length > 0;
                    if (!rtePresent && currentRow && !currentRow.fieldMissing) {
                        result.push(field.fieldInternalName);
                        if (currentRow) {
                            if (currentRow.row.find("td.ms-formbody").find("h3.ms-standardheader").length === 0) {
                                var tdh = currentRow.row.find("td.ms-formlabel");
                                if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") >= 0) {
                                    currentRow.row.find("td.ms-formbody").prepend(
                                        "<div data-transformAdded='true'>&nbsp;</div>");
                                }
                                if (tdh.html() === "Content Type") {
                                    currentRow.row.find("td.ms-formbody").prepend(
                                        "<h3 class='ms-standardheader'><nobr>" + tdh.html() + "</nobr></h3>");
                                } else {
                                    currentRow.row.find("td.ms-formbody").prepend(
                                        tdh.html());
                                }
                                currentRow.row.find("td.ms-formbody").find(
                                    "h3.ms-standardheader").
                                attr("data-transformAdded", "true");
                                tdh.hide();
                                tdh.attr("data-transformHidden", "true");
                            }
                            $("#" + rowId).append(
                                "<td id='" + tdId +
                                "' class='speasyforms-columncell'><table id='" +
                                innerTableId + "' style='width: 100%'></table></td>");
                            currentRow.row.appendTo("#" + innerTableId);
                        } else {
                            $("#" + rowId).append("<td id='" + tdId +
                                "' class='speasyforms-columncell'>&nbsp;</td>");
                        }
                    }
                } else {
                    $("#" + rowId).append("<td id='" + tdId +
                        "' class='speasyforms-columncell'>&nbsp;</td>");
                }
            }
        }

        return result;
    };

    containerCollection.containerImplementations.accordion.transform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var divClass =
            "speasyforms-container speasyforms-accordion speasyforms-accordion" +
            opt.index;
        $("#" + opt.containerId).append("<div id='" + divId + "' class='" +
            divClass + "'></div>");
        $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
            var tableClass = "speasyforms-accordion " +
                "speasyforms-accordion" + opt.index + "" + idx;
            var tableId = "spEasyFormsAccordionTable" + opt.index + "" + idx;
            var headerId = "spEasyFormsAccordionHeader" + opt.index + "" + idx;
            $("#" + divId).append("<h3 id='" + headerId + "' class='" +
                tableClass + "'>" + fieldCollection.name + "</h3>");
            $("#" + divId).append(
                "<div><table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldCollection.fields, function (fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                if (currentRow) {
                    var rtePresent = currentRow.row.find("iframe[id$='TextField_iframe']").length > 0;
                    if (!rtePresent && !currentRow.fieldMissing) {
                        result.push(field.fieldInternalName);
                        currentRow.row.appendTo("#" + tableId);
                    }
                }
            });
        });
        $("#" + divId).accordion({
            heightStyle: "auto",
            active: false,
            collapsible: true
        });

        return result;
    };

    $.spEasyForms.sharePointContext.getListContext = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        if (!opt.currentContext) {
            opt.currentContext = spContext.get();
        }
        if (!opt.listId) {
            opt.listId = this.getCurrentListId(opt);
        }
        if (!opt.listId) {
            return undefined;
        }
        var result = {};
        if (opt.useCache && opt.listId in opt.currentContext.listContexts) {
            result = opt.currentContext.listContexts[opt.listId];
        } else {
            result.title = "Unknow List Title";
            result.fields = {};
            if (opt.listId in opt.currentContext.listContexts) {
                result = opt.currentContext.listContexts[opt.listId];
            }
            var rows = {};
            if (opt.listId === spContext.getCurrentListId($.spEasyForms.defaults)) {
                opt.dontIncludeNodes = true;
                rows = $.spEasyForms.sharePointFieldRows.init(opt);
            }
            if (Object.keys(rows).length === 0) {
                $.ajax({
                    async: false,
                    url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/listform.aspx") +
                        "?PageType=6&ListId=" +
                        opt.listId +
                        ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") +
                        "&RootFolder=",
                    complete: function (xData) {
                        if (opt.listId === spContext.getCurrentListId(opt)) {
                            spContext.formCache = xData.responseText;
                        }
                        opt.input = $(xData.responseText);
                        rows = $.spEasyForms.sharePointFieldRows.init(opt);
                        $.each(rows, function (idx, row) {
                            result.fields[row.internalName] = row;
                        });
                    }
                });
            }
            else {
                $.each(rows, function (idx, row) {
                    result.fields[row.internalName] = row;
                });
            }
            $().SPServices({
                async: false,
                webURL: spContext.getCurrentSiteUrl(opt),
                operation: "GetList",
                listName: opt.listId,
                debug: opt.verbose,
                completefunc: function (xData) {
                    result.title =
                        $(xData.responseText).find("List").attr("Title");
                    result.template =
                        $(xData.responseText).find("List").attr("ServerTemplate");
                    result.feature =
                        $(xData.responseText).find("List").attr("FeatureId");
                    result.baseType =
                        $(xData.responseText).find("List").attr("BaseType");
                    result.defaultUrl =
                        $(xData.responseText).find("List").attr("DefaultViewUrl");
                    result.schema = {};
                    $.each($(xData.responseText).find("Field"), function (idx, field) {
                        if ($(field).attr("Hidden") !== "hidden") {
                            var newField = {};
                            newField.name = $(field).attr("Name");
                            newField.staticName = $(field).attr("StaticName");
                            newField.id = $(field).attr("ID");
                            newField.displayName = $(field).attr("DisplayName");
                            newField.type = $(field).attr("Type");
                            newField.required = $(field).attr("Required");
                            result.schema[newField.displayName] = newField;
                            result.schema[newField.name] = newField;
                        }
                    });
                }
            });
            $().SPServices({
                webURL: spContext.getCurrentSiteUrl(opt),
                operation: "GetListContentTypes",
                listName: opt.listId,
                async: false,
                debug: opt.verbose,
                completefunc: function (xData) {
                    var contentTypes = {};
                    if ($(xData.responseText).find("ContentTypes").attr("ContentTypeOrder")) {
                        contentTypes.order = $(xData.responseText).find("ContentTypes").attr("ContentTypeOrder").split(",");
                    }
                    var order = [];
                    $.each($(xData.responseText).find("ContentType"), function (idx, ct) {
                        var newCt = {};
                        newCt.name = $(ct).attr("Name");
                        newCt.id = $(ct).attr("ID");
                        newCt.description = $(ct).attr("Description");
                        contentTypes[newCt.id] = newCt;
                        order.push(newCt.id);
                    });
                    if (!contentTypes.order) {
                        contentTypes.order = order;
                    }
                    result.contentTypes = contentTypes;
                }
            });
            var listCount = Object.keys(opt.currentContext.listContexts).length;
            if (!(opt.listId in opt.currentContext.listContexts) &&
                listCount >= opt.maxListCache) {
                delete opt.currentContext.listContexts[Object.keys(opt.currentContext.listContexts)[0]];
            }
            opt.currentContext.listContexts[opt.listId] = result;
            $.spEasyForms.writeCachedContext(opt);
        }
        return result;
    };


})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
