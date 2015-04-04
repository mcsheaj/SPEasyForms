/*
 * SPEasyForms HotFixes - cumulative update for reported bugs.
 *
 * @version 2014.01.15
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, _spPageContextInfo, SPClientForms, PreSaveItem:true */
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

    $.spEasyForms.Hotfixes_originalInit = $.spEasyForms.init;
    $.spEasyForms.init = function (options) {
        // call the original SPEasyForms init method
        $.spEasyForms.Hotfixes_originalInit(options);
        if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") > -1) {
            $(".ms-formtable").width(600);
            $("table.ms-formtable").css({ padding: "0" });
        }
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
            $("b:contains('Version: 2014.01')").parent().append("<br /><b>AddOns: 2014.01.15</b>");
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
            "'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
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
        $.spEasyForms.initCacheLibrary(opt);
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
                        opt.skipCalculatedFields = true;
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
                            if (newField.type === "Calculated") {
                                newField.hasFormula = $(field).find("formula").length > 0;
                                if (newField.hasFormula) {
                                    newField.formula = $(field).find("formula").text();
                                }
                            }
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

    $.spEasyForms.containerCollection.preSaveItem = function () {
        var opt = $.extend({}, $.spEasyForms.defaults);

        if (!$.spEasyForms.adapterCollection.preSaveItem(opt)) {
            this.highlightValidationErrors(opt);
            return false;
        }

        if (typeof (SPClientForms) !== 'undefined' &&
            typeof (SPClientForms.ClientFormManager) !== 'undefined' &&
            typeof (SPClientForms.ClientFormManager.SubmitClientForm) === "function") {
            if (SPClientForms.ClientFormManager.SubmitClientForm('WPQ2')) {
                this.highlightValidationErrors(opt);
                return false;
            }
        }

        return true;
    };

    $.spEasyForms.transform = function (opt) {
        opt.currentConfig = $.spEasyForms.configManager.get(opt);
        // convert all lookups to simple selects, only for 2010 and
        // earlier, from Marc Anderson's SPServices documentation and 
        // attributed to Dan Kline
        $('.ms-lookuptypeintextbox').each(function () {
            $().SPServices.SPComplexToSimpleDropdown({
                columnName: $(this).attr('title'),
                debug: opt.verbose
            });
        });
        // add ms-formtable to the...um, form table. For some reason 
        // designer does not put this in custom forms.
        if ($("table.ms-formtable").length === 0) {
            $("td.ms-formlabel h3.ms-standardheader").closest("table").addClass("ms-formtable");
        }
        $.spEasyForms.containerCollection.transform(opt);
        // Override the core.js PreSaveItem function, to allow containers 
        // and/or adapters to react to validation errors.
        if (typeof (PreSaveItem) !== 'undefined') {
            var originalPreSaveItem = PreSaveItem;
            PreSaveItem = function () {
                var result = originalPreSaveItem();
                if (result) {
                    result = spefjQuery.spEasyForms.containerCollection.preSaveItem();
                }
                return result;
            };
        }
        // override the save button in 2013/O365 so validation 
        // occurs before PreSaveAction, like it did in previous
        // version of SharePoint
        $("input[value='Save']").each(function () {
            if (null !== this.getAttributeNode("onclick")) {
                var onSave = this.getAttributeNode("onclick").nodeValue;
                onSave = onSave.replace(
                    "if (SPClientForms.ClientFormManager.SubmitClientForm('WPQ2')) return false;", "");
                var newOnSave = document.createAttribute('onclick');
                newOnSave.value = onSave;
                this.setAttributeNode(newOnSave);
            }
        });
        $.spEasyForms.appendContext(opt);
        if (_spPageContextInfo.webUIVersion === 4) {
            $(".ui-widget input").css("font-size", "8pt");
        }
    };

    containerCollection.transform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var fieldsInUse = [];

        this.initializeRows(opt);

        // if it looks like a form, apply transforms
        if (Object.keys(containerCollection.rows).length > 0) {
            $("#spEasyFormsContainersPre").remove();
            $("#spEasyFormsContainersPost").remove();

            $('<div id="spEasyFormsContainersPre"></div>').insertBefore(
                "table.ms-formtable");
            $('<div id="spEasyFormsContainersPost"></div>').insertAfter(
                "table.ms-formtable");

            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            opt.prepend = true;
            $.each(opt.currentConfig.layout.def, function (index, layout) {
                var implementation = $.spEasyForms.utilities.jsCase(layout.containerType);
                if (implementation in containerCollection.containerImplementations) {
                    var impl = containerCollection.containerImplementations[implementation];
                    if (typeof (impl.transform) === 'function') {
                        opt.index = index;
                        opt.currentContainerLayout = layout;
                        opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");
                        $.merge(fieldsInUse, impl.transform(opt));
                    }
                    if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                        if (impl.fieldCollectionsDlgTitle && $("#" + opt.containerId).children().last().find("td.ms-formbody").length === 0) {
                            $("#" + opt.containerId).children().last().hide();
                        }
                    }
                    else {
                        opt.prepend = false;
                    }
                }
            });

            if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                $.spEasyForms.visibilityRuleCollection.transform(opt);
                $.spEasyForms.adapterCollection.transform(opt);
            }

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
            });

            this.highlightValidationErrors(opt);

        }

        return fieldsInUse;
    };

    containerCollection.initContainers = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var fieldsInUse = [];
        var defaultFormContainerId;
        var nextIndex = Object.keys(opt.currentConfig.layout.def).length - 1;
        $.each(opt.currentConfig.layout.def, function (index, layout) {
            if (layout.index && $.isNumeric(layout.index) && parseInt(layout.index) >= nextIndex) {
                nextIndex = parseInt(layout.index) + 1;
            }
        });
        $.each(opt.currentConfig.layout.def, function (index, layout) {
            opt.id = "spEasyFormsContainer" + index;
            opt.title = layout.containerType;
            opt.currentContainerLayout = layout;
            if (!layout.index) {
                if (layout.containerType === "DefaultForm") {
                    layout.index = "d";
                    nextIndex++;
                }
                else {
                    layout.index = nextIndex++;
                    layout.index = layout.index.toString();
                }
                $.spEasyForms.configManager.set(opt);
            }
            opt.containerIndex = layout.index;
            containerCollection.appendContainer(opt);
            if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                var implementation = layout.containerType[0].toLowerCase() +
                    layout.containerType.substring(1);
                if (implementation in containerCollection.containerImplementations) {
                    var impl = containerCollection.containerImplementations[implementation];
                    if (typeof (impl.toEditor) === 'function') {
                        opt.index = index;
                        opt.currentContainerLayout = layout;
                        var tmp = impl.toEditor(opt);
                        $.merge(fieldsInUse, tmp);
                    }
                }
            }
            else {
                defaultFormContainerId = opt.id;
            }
            if (!opt.verbose) {
                $("#" + opt.id).find("tr.speasyforms-fieldmissing").hide();
            }
        });
        opt.id = defaultFormContainerId;
        opt.fieldsInUse = fieldsInUse;
        $.spEasyForms.defaultFormContainer.toEditor(opt);
        return fieldsInUse;
    };

    $.spEasyForms.configManager.original_set = $.spEasyForms.configManager.set;
    $.spEasyForms.configManager.set = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        if (!opt.currentConfig) {
            opt.currentConfig = {
                layout: {
                    def: [{
                        "containerType": $.spEasyForms.defaultFormContainer.containerType
                    }]
                },
                visibility: {
                    def: {}
                },
                adapters: {
                    def: {}
                }
            };
        }
        $.spEasyForms.configManager.original_set(opt);
    };

    $.spEasyForms.configManager.save = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var listId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
        $.ajax({
            url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/SiteAssets") +
                "/spef-layout-" +
                listId.replace("{", "").replace("}", "") + ".txt",
            type: "PUT",
            headers: {
                "Content-Type": "text/plain",
                "Overwrite": "T"
            },
            data: $("#spEasyFormsJson pre").text(),
            success: function () {
                opt.listId = listId;
                opt.currentConfig = $.spEasyForms.utilities.parseJSON($("#spEasyFormsJson pre").text());
                $.spEasyForms.sharePointContext.setConfig(opt);
                $("#spEasyFormsSaveButton img").addClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsSaveButton div").addClass("speasyforms-buttontextdisabled");
                $("#spEasyFormsExportButton img").removeClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsExportButton div").removeClass("speasyforms-buttontextdisabled");
                $("#spEasyFormsImportButton img").removeClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsImportButton div").removeClass("speasyforms-buttontextdisabled");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status === 409) {
                    alert("The web service returned 409 - CONFLICT. " +
                        "This most likely means you do not have a 'Site Assets' " +
                        "library in the current site with a URL of SiteAssets. " +
                        "This is required before you can load and save " +
                        "SPEasyForms configuration files.");
                } else {
                    alert("Error uploading configuration.\nStatus: " + xhr.status +
                        "\nStatus Text: " + thrownError);
                }
            }
        });
    };

    /*v2014-01-11*/
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
                            if (condensedFieldCollections.length > 1 &&
                                currentRow.row.find("td.ms-formbody").find("h3.ms-standardheader").length === 0) {
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
                            if (condensedFieldCollections.length > 1) {
                                $("#" + rowId).append(
                                    "<td id='" + tdId +
                                    "' class='speasyforms-columncell'><table id='" +
                                    innerTableId + "' style='width: 100%'></table></td>");
                                currentRow.row.appendTo("#" + innerTableId);
                            }
                            else {
                                currentRow.row.appendTo("#" + outerTableId);
                            }
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

    /*v2014-01-12*/
    $.spEasyForms.visibilityRuleCollection.toConfig = function (options) {
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
    };

    /*v2014-01-13*/
    $.spEasyForms.adapterCollection.hotfixes_toEditor_Original = $.spEasyForms.adapterCollection.toEditor;
    $.spEasyForms.adapterCollection.toEditor = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);

        $.spEasyForms.adapterCollection.hotfixes_toEditor_Original(opt);

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
            opt.currentConfig = containerCollection.toConfig(opt);
            delete opt.currentConfig.adapters.def[internalName];
            $.spEasyForms.configManager.set(opt);
            containerCollection.toEditor(opt);
            return false;
        });
    };

    ////////////////////////////////////////////////////////////////////////////
    // Constructor for a helper class for dialogs to define a relationship list 
    // (i.e. as used by the cascadingLookupAdapter and lookupDetailAdapter.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.relationshipListAdapterHelper = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var instance = this;

        this.initDialog = function () {
            // initialize the jQuery UI dialog
            var lookupDetailOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        if (opt.relationship.relationshipParentColumn) {
                            $.spEasyForms.adapterCollection.validateRequired({
                                id: opt.relationship.relationshipParentColumn.id,
                                displayName: opt.relationship.relationshipParentColumn.displayName
                            });
                        }
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.relationshipChildColumn.id,
                            displayName: opt.relationship.relationshipChildColumn.displayName
                        });
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.formParentColumn.id,
                            displayName: opt.relationship.formParentColumn.displayName
                        });
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.formChildColumn.id,
                            displayName: opt.relationship.formChildColumn.displayName
                        });
                        if ($("#" + opt.relationship.dialogDiv).find(".speasyforms-error").length === 0) {
                            if (!opt.currentConfig.adapters) {
                                opt.currentConfig.adapters = {};
                            }
                            if (!opt.currentConfig.adapters.def) {
                                opt.currentConfig.adapters.def = {};
                            }
                            opt.adapters = opt.currentConfig.adapters.def;
                            if ($("#" + opt.relationship.relationshipListColumn.id).val().length === 0) {
                                if (opt.adapterField in opt.adapters) {
                                    delete opt.adapters[opt.adapterField];
                                }
                                $.spEasyForms.configManager.set(opt);
                                $("#" + opt.relationship.dialogDiv).dialog("close");
                                $.spEasyForms.containerCollection.toEditor(opt);
                            } else {
                                var adapter = {};
                                if (opt.fieldName && opt.fieldName in opt.adapters) {
                                    adapter = opt.adapters[opt.fieldName];
                                } else {
                                    opt.adapters[opt.fieldName] = adapter;
                                }
                                adapter.type = opt.relationship.type;
                                adapter.relationshipList =
                                    $("#" + opt.relationship.relationshipListColumn.id).val();
                                adapter.relationshipListTitle =
                                    $("#" + opt.relationship.relationshipListColumn.id + " option:selected").text();
                                if (opt.relationship.relationshipParentColumn) {
                                    adapter.relationshipListParentColumn =
                                        $("#" + opt.relationship.relationshipParentColumn.id).val();
                                }
                                adapter.relationshipListChildColumn =
                                    $("#" + opt.relationship.relationshipChildColumn.id).val();
                                adapter.parentColumnInternal =
                                    $("#" + opt.relationship.formParentColumn.id).val();
                                adapter.columnNameInternal =
                                    $("#" + opt.relationship.formChildColumn.id).val();
                                if (opt.relationship.updateCallback) {
                                    opt.relationship.updateCallback(adapter);
                                }
                                $.spEasyForms.configManager.set(opt);
                                $("#" + opt.relationship.dialogDiv).dialog("close");
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                            return false;
                        }
                    },
                    "Cancel": function () {
                        $("#" + opt.relationship.dialogDiv).dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 650
            };
            $("#" + opt.relationship.dialogDiv).dialog(lookupDetailOpts);
        };

        this.initControls = function () {
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
                $("#" + opt.relationship.relationshipListColumn.id).append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });
            $("#" + opt.relationship.formListColumn.id).val(opt.currentListContext.title);
            if ($("#" + opt.relationship.relationshipListColumn.id).attr("data-change") !== "true") {
                $("#" + opt.relationship.relationshipListColumn.id).attr("data-change", "true");
                $("#" + opt.relationship.relationshipListColumn.id).change(function () {
                    instance.initRelationshipFields(opt);
                });
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).change(function () {
                        if ($("#" + opt.relationship.relationshipChildColumn.id).find("option[value='" +
                            $("#" + opt.relationship.relationshipParentColumn.id).val() + "']").length > 0) {
                            $("#" + opt.relationship.relationshipChildColumn.id).find("option[text='" +
                                $("#" + opt.relationship.relationshipParentColumn.id).text() + "']");
                        }
                    });
                }
            }
            $("#" + opt.relationship.formChildColumn.id).val(opt.fieldName);
            opt.adapters = opt.currentConfig.adapters.def;
            if (opt.fieldName in opt.adapters) {
                var a = opt.adapters[opt.fieldName];
                $("#" + opt.relationship.relationshipListColumn.id).val(
                    a.relationshipList);
                instance.initRelationshipFields(opt);
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).val(
                        a.relationshipListParentColumn);
                }
                $("#" + opt.relationship.relationshipChildColumn.id).val(
                    a.relationshipListChildColumn);
                $("#" + opt.relationship.formParentColumn.id).val(
                    a.parentColumnInternal);
            }
        };

        this.initRelationshipFields = function () {
            if (opt.relationship.relationshipParentColumn) {
                $("#" + opt.relationship.relationshipParentColumn.id).find("option").remove();
                $("#" + opt.relationship.relationshipParentColumn.id).append("<option></option>");
                $("#" + opt.relationship.relationshipParentColumn.id).val("");
                $("#" + opt.relationship.relationshipParentColumn.id).attr("disabled", "disabled");
            }

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");
            $("#" + opt.relationship.relationshipChildColumn.id).attr("disabled", "disabled");

            if ($("#" + opt.relationship.relationshipListColumn.id).val().length > 0) {
                opt.listId = $("#" + opt.relationship.relationshipListColumn.id).val().toLowerCase();
                var listctx = $.spEasyForms.sharePointContext.getListContext(opt);
                $.each(Object.keys(listctx.fields), function (idx, field) {
                    if (opt.relationship.relationshipParentColumn) {
                        if (listctx.fields[field].spFieldType === "SPFieldLookup") {
                            $("#" + opt.relationship.relationshipParentColumn.id).append(
                                "<option value='" +
                                listctx.fields[field].internalName + "'>" +
                                listctx.fields[field].displayName + "</option>");
                        }
                    }
                    $("#" + opt.relationship.relationshipChildColumn.id).append(
                        "<option value='" +
                        listctx.fields[field].internalName + "'>" +
                        listctx.fields[field].displayName + "</option>");
                });
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).removeAttr("disabled");
                    var choices = $("#" + opt.relationship.relationshipParentColumn.id).find("option");
                    if (choices.length === 2) {
                        $("#" + opt.relationship.relationshipParentColumn.id).val(
                            $(choices[1]).attr("value"));
                        var relationshipParentText =
                            $("#" + opt.relationship.relationshipParentColumn.id + " option:selected").text();
                        var thisParentOption =
                            $("#" + opt.relationship.relationshipChildColumn.id).find(
                                "option:contains('" + relationshipParentText + "')");
                        $("#" + opt.relationship.relationshipChildColumn.id).val(thisParentOption.val());
                    }
                }
                $("#" + opt.relationship.relationshipChildColumn.id).removeAttr("disabled");
                var thisChildText =
                    $("#" + opt.relationship.formChildColumn.id + " option:selected").text();
                var relationshipChildOption =
                    $("#" + opt.relationship.relationshipChildColumn.id).find(
                        "option:contains('" + thisChildText + "')");
                $("#" + opt.relationship.relationshipChildColumn.id).val(
                    relationshipChildOption.val());
            }
        };

        this.constructDialog = function () {
            if ($("#" + opt.relationship.dialogDiv).length === 0) {
                var html = "<div id='" + opt.relationship.dialogDiv + "' title='Lookup Detail' class='speasyforms-dialogdiv'>" +
                    "<table id='" + opt.relationship.dialogDiv + "Table' width='100%' cellpadding='0' cellspacing='0'>" +
                    "<tr>" +
                    "<td>" + opt.relationship.relationshipListColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipListColumn.id + "'><option></option></select></td><td></td>" +
                    "</tr><tr>" +
                    (opt.relationship.relationshipParentColumn ? "<td></td><td>" + opt.relationship.relationshipParentColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipParentColumn.id + "'><option></option></select></td>" : "") +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.relationshipChildColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipChildColumn.id + "'><option></option></select></td>" +
                    "</tr><tr><td>&nbsp;</td></tr><tr>" +
                    "<td>" + opt.relationship.formListColumn.displayName + "</td><td><input type='text' disabled='disabled' id='" + opt.relationship.formListColumn.id + "' value=''/></td><td></td>" +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.formParentColumn.displayName + "</td><td><select id='" + opt.relationship.formParentColumn.id + "'><option></option></select></td>" +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.formChildColumn.displayName + "</td><td><input type='text' id='" + opt.relationship.formChildColumn.id + "' disabled='disabled'/></td>" +
                    "</tr>" +
                    "</table>" +
                    "</div>";
                $("#spEasyFormsContainerDialogs").append(html);
            }
        };

        this.clearDialog = function () {
            $("#" + opt.relationship.dialogDiv).find(".speasyforms-error").remove();
            $("#" + opt.relationship.dialogDiv).find(".implementation-specific").remove();

            $("#" + opt.relationship.relationshipListColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipListColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipListColumn.id).val("");

            if (opt.relationship.relationshipParentColumn) {
                $("#" + opt.relationship.relationshipParentColumn.id).find("option").remove();
                $("#" + opt.relationship.relationshipParentColumn.id).append("<option></option>");
                $("#" + opt.relationship.relationshipParentColumn.id).val("");
                $("#" + opt.relationship.relationshipParentColumn.id).attr("disabled", "disabled");
            }

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");
            $("#" + opt.relationship.relationshipChildColumn.id).attr("disabled", "disabled");

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");

            var fields = $.spEasyForms.containerCollection.rows;
            $.each(Object.keys($.spEasyForms.containerCollection.rows).sort($.spEasyForms.sharePointFieldRows.compareField), function (idx, field) {
                if (fields[field].spFieldType === "SPFieldLookup") {
                    $("#" + opt.relationship.formParentColumn.id).append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                }
            });
        };
    };

    $.spEasyForms.sharePointFieldRows.original_sharePointFieldRows_init = $.spEasyForms.sharePointFieldRows.init;
    $.spEasyForms.sharePointFieldRows.init = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = $.spEasyForms.sharePointFieldRows.original_sharePointFieldRows_init(options);
        var currentContext = $.spEasyForms.sharePointContext.get(opt);
        var listId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
        if (listId in currentContext.listContexts && !opt.skipCalculatedFields && window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") >= 0) {
            var hasCalculatedFields = false;
            $.each(Object.keys(result), function (idx, key) {
                if (result[key].spFieldType === "SPFieldCalculated") {
                    hasCalculatedFields = true;
                    return false;
                }
            });
            if (!hasCalculatedFields) {
                var listCtx = $.spEasyForms.sharePointContext.getListContext(options);
                $.each(Object.keys(listCtx.schema), function (idx, key) {
                    var field = listCtx.schema[key];
                    if (field.type === "Calculated" && field.hasFormula) {
                        var tr = $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'><nobr>" +
                            field.displayName + "</nobr></h3></td><td class='ms-formbody'>value</td></tr>");
                        tr.appendTo("table.ms-formtable");
                        opt.row = tr;
                        var newRow = {
                            internalName: field.name,
                            displayName: field.displayName,
                            spFieldType: "SPFieldCalculated",
                            value: "",
                            row: tr
                        };
                        result[field.name] = newRow;
                    }
                });
            }
        }
        return result;
    };

    $.spEasyForms.sharePointFieldRows.original_sharePointFieldRows_value = $.spEasyForms.sharePointFieldRows.value;
    $.spEasyForms.sharePointFieldRows.value = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var tr = opt.row;
        tr.value = "";
        try {
            if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                tr.value = tr.row.find("td.ms-formbody").clone().children().remove().end().text().trim();
                return tr.value;
            }
            switch (tr.spFieldType) {
                case "SPFieldContentType":
                    tr.value = tr.row.find("td.ms-formbody select option:selected").text();
                    break;
                case "SPFieldChoice":
                    var select = tr.row.find("td.ms-formbody select");
                    if (select.length > 0) {
                        tr.value = tr.row.find("td.ms-formbody select").val();
                        var tmp = tr.row.find("input:checked").first();
                        var re = new RegExp(/FillInButton$/i);
                        if (tmp.length > 0 && re.test(tmp[0].id)) {
                            tr.value = tr.row.find("input[type='text']").val();
                        }
                    } else {
                        tr.value = "";
                        tr.row.find("input:checked").each(function () {
                            if (tr.value) { tr.value += ";"; }
                            var re = new RegExp(/FillInRadio$/i);
                            if ($(this).length > 0 && !re.test($(this)[0].id)) {
                                tr.value += $(this).val();
                            }
                            else {
                                tr.value += tr.row.find("input[type='text']").val();
                            }
                        });
                    }
                    break;
                case "SPFieldNote":
                case "SPFieldMultiLine":
                    tr.value = "";
                    var input = tr.row.find("td.ms-formbody input");
                    if (input.length > 0 && !(input.val().search(/^<p>.*<\/p>$/) >= 0 &&
                        input.val().length === 8)) {
                        tr.value = input.val().trim();
                        if (tr.value.indexOf("<div") === 0) {
                            tr.value = "<div class='ms-rtestate-field'>" + tr.value + "</div>";
                        }
                    }
                    var textarea = tr.row.find("td.ms-formbody textarea");
                    if (textarea.length > 0) {
                        tr.value = textarea.val().replace("\n", "<br />\n");
                    }
                    var appendedText =
                        tr.row.find(".ms-imnSpan").parent().parent();
                    if (appendedText.length > 0) {
                        $.each(appendedText, function (i, t) {
                            tr.value += t.outerHTML;
                        });
                    }
                    break;
                case "SPFieldMultiChoice":
                    tr.value = "";
                    tr.row.find("input:checked").each(function () {
                        if (tr.value.length > 0) tr.value += "; ";
                        var re = new RegExp(/FillInRadio$/i);
                        if ($(this).length > 0 && !re.test($(this)[0].id)) {
                            tr.value += $(this).next().text();
                        }
                        else {
                            tr.value += tr.row.find("input[type='text']").val();
                        }
                    });
                    break;
                case "SPFieldDateTime":
                    tr.value = tr.row.find("td.ms-formbody input").val().trim();
                    var selects = tr.row.find("select");
                    if (selects.length === 2) {
                        var tmp2 = $(selects[0]).find(
                            "option:selected").text().split(' ');
                        if (tmp2.length === 2) {
                            var hour = tmp2[0];
                            var ampm = tmp2[1];
                            var minutes = $(selects[1]).val();
                            tr.value += " " + hour + ":" + minutes + " " +
                                ampm;
                        }
                    }
                    break;
                case "SPFieldLookup":
                    tr.value = tr.row.find("option:selected").text();
                    break;
                case "SPFieldLookupMulti":
                    tr.value = tr.row.find("td.ms-formbody input").val().trim();
                    if (tr.value.indexOf("|t") >= 0) {
                        var parts = tr.value.split("|t");
                        tr.value = "";
                        for (var i = 1; i < parts.length; i += 2) {
                            if (tr.value.length === 0) {
                                tr.value += parts[i];
                            } else {
                                tr.value += "; " + parts[i];
                            }
                        }
                    }
                    break;
                case "SPFieldBoolean":
                    tr.value =
                        tr.row.find("td.ms-formbody input").is(":checked");
                    if (tr.value) {
                        tr.value = "Yes";
                    } else {
                        tr.value = "No";
                    }
                    break;
                case "SPFieldURL":
                    var inputs = tr.row.find("td.ms-formbody input");
                    if ($(inputs[0]).val().length > 0 &&
                        $(inputs[1]).val().length > 0) {
                        tr.value = "<a href='" + $(inputs[0]).val() +
                            "' target='_blank'>" + $(inputs[1]).val() +
                            "</a>";
                    } else if ($(inputs[0]).val().length > 0) {
                        tr.value = "<a href='" + $(inputs[0]).val() +
                            "' target='_blank'>" + $(inputs[0]).val() +
                            "</a>";
                    } else {
                        tr.value = "";
                    }
                    break;
                case "SPFieldUser":
                case "SPFieldUserMulti":
                    var pplpkrDiv = $("[id^='" + tr.internalName + "'][id$='ClientPeoplePicker']");
                    if (pplpkrDiv.length > 0) {
                        var tmp3 = tr.row.find("input[type='hidden']").val();
                        if (typeof (tmp3) !== 'undefined') {
                            var hiddenInput = $.spEasyForms.utilities.parseJSON(tmp3);
                            $.each(hiddenInput, function (idx, entity) {
                                if (tr.value.length > 0) {
                                    tr.value += "; ";
                                }
                                if (entity.isResolved || entity.IsResolved) {
                                    tr.value += "<a href='" +
                                    opt.currentContext.webRelativeUrl +
                                    "/_layouts/userdisp.aspx?ID=" +
                                    entity.EntityData.SPUserID +
                                    "' target='_blank'>" +
                                    entity.DisplayText + "</a>";
                                }
                                else {
                                    tr.value += entity.DisplayText;
                                }
                            });
                        }
                    }
                    else {
                        var picker = $().SPServices.SPFindPeoplePicker({
                            peoplePickerDisplayName: tr.displayName
                        });
                        tr.value = picker.currentValue;
                    }
                    break;
                case "SPFieldBusinessData":
                    tr.value = tr.row.find("div.ms-inputuserfield span span").text().trim();
                    break;
                case "SPFieldCalculated":
                    tr.value = tr.find("td.ms-formbody").text().trim();
                    break;
                default:
                    if (tr.row.find("td.ms-formbody input").length > 0) {
                        tr.value = tr.row.find("td.ms-formbody input").val().trim();
                    }
                    else if (tr.row.find("td.ms-formbody textarea").length > 0) {
                        tr.value = tr.row.find("td.ms-formbody textarea").val().replace("\n", "<br />\n").trim();
                    }
                    else if (tr.row.find("td.ms-formbody select").length > 0) {
                        tr.value = tr.row.find("td.ms-formbody select").val().trim();
                    }
                    break;
            }
        } catch (e) { }
        if (!tr.value) {
            tr.value = "";
        }
        return tr.value;
    };

    /*v2014-01-15*/
    $.spEasyForms.baseContainer.appendRow = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = false;
        if (opt.rowInfo && !opt.rowInfo.fieldMissing) {
            var rtePresent = opt.rowInfo.row.find("iframe[id$='TextField_iframe']").length > 0;
            if (!rtePresent) {
                opt.table.append(opt.rowInfo.row);
                if (opt.headerOnTop) {
                    var tdh = opt.rowInfo.row.find("td.ms-formlabel");
                    if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") >= 0) {
                        opt.rowInfo.row.find("td.ms-formbody").prepend(
                            "<div data-transformAdded='true'>&nbsp;</div>");
                    }
                    if (tdh.html() === "Content Type") {
                        opt.rowInfo.row.find("td.ms-formbody").prepend(
                            "<h3 data-transformAdded='true' class='ms-standardheader'><nobr>" + tdh.html() + "</nobr></h3>");
                    } else {
                        opt.rowInfo.row.find("td.ms-formbody").prepend(
                            tdh.attr("data-transformAdded", "true").html());
                    }
                    tdh.attr("data-transformHidden", "true").hide();
                }
                result = true;
            }
        }
        return result;
    };

    $.spEasyForms.baseContainer.appendFieldCollection = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        $("#" + opt.parentElement).append("<table width='100%' id='pageTable" + opt.collectionIndex +
            "' class='speasyforms-wizard' cellspacing='5'></table>");
        opt.table = $("#" + opt.collectionType + "Table" + opt.collectionIndex);
        $.each(opt.fieldCollection.fields, function (fieldIdx, field) {
            opt.rowInfo = containerCollection.rows[field.fieldInternalName];
            if ($.spEasyForms.baseContainer.appendRow(opt)) {
                opt.result.push(field.fieldInternalName);
            }
        });
    };

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);