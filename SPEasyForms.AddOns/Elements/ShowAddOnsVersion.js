/*
 * SPEasyForms ShowAddOnsVersion - show the current AddOns version on the
 * About dialog.
 *
 * @version 2015.00.06
 * @requires SPEasyForms v2014.01
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // only operate on the settings page
    if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") > -1) {
        $().ready(function() {
            $("b:contains('Version: 2014.01')").parent().append("<br /><b>AddOns: 2015.00.06</b>");
        });
    }

    $.spEasyForms.ShowAddOnsVersion_Original_InsertSettingsLink = $.spEasyForms.insertSettingsLink;
    $.spEasyForms.insertSettingsLink = function(opt) {
        var permissionsLink = $("a:contains('Permissions for this list')");
        if (permissionsLink.length > 0) {
            $.spEasyForms.ShowAddOnsVersion_Original_InsertSettingsLink(opt);
        }
    };

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;
    var spContext = $.spEasyForms.sharePointContext;

    containerCollection.containerImplementations.tabs.transform = function(options) {
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
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            if (fieldCollection.fields.length > mostFields) {
                mostFields = fieldCollection.fields.length;
            }
        });
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
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
            $.each(fieldCollection.fields, function(fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                if (currentRow) {
                    var rtePresent = currentRow.row.find("iframe[id^='" + field.fieldInternalName + "'][id$='TextField_iframe']").length > 0;
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
        $("#" + listId).find("a").click(function() {
            $("#" + listId).find("li").removeClass("ui-tabs-active").removeClass("ui-state-active");
            $(this).closest("li").addClass("ui-tabs-active").addClass("ui-state-active");
            $("#" + opt.divId).find("div.ui-tabs-panel").hide();
            $($(this).attr("href")).show();
            return false;
        });

        return result;
    };

    containerCollection.containerImplementations.columns.transform = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
        var outerTableClass = "speasyforms-container speasyforms-columns";
        $("#" + opt.containerId).append("<table id='" + outerTableId +
            "' class='" + outerTableClass + "'></table>");

        var condensedFieldCollections = [];
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            var newCollection = {};
            newCollection.name = fieldCollection.name;
            newCollection.fields = [];
            $.each(fieldCollection.fields, function(i, field) {
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
        $.each(condensedFieldCollections, function(idx, fieldCollection) {
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
                    var rtePresent = currentRow.row.find("iframe[id^='" + field.fieldInternalName + "'][id$='TextField_iframe']").length > 0;
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

    containerCollection.containerImplementations.accordion.transform = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var divClass =
            "speasyforms-container speasyforms-accordion speasyforms-accordion" +
            opt.index;
        $("#" + opt.containerId).append("<div id='" + divId + "' class='" +
            divClass + "'></div>");
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            var tableClass = "speasyforms-accordion " +
                "speasyforms-accordion" + opt.index + "" + idx;
            var tableId = "spEasyFormsAccordionTable" + opt.index + "" + idx;
            var headerId = "spEasyFormsAccordionHeader" + opt.index + "" + idx;
            $("#" + divId).append("<h3 id='" + headerId + "' class='" +
                tableClass + "'>" + fieldCollection.name + "</h3>");
            $("#" + divId).append(
                "<div><table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldCollection.fields, function(fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                if (currentRow) {
                    var rtePresent = currentRow.row.find("iframe[id^='" + field.fieldInternalName + "'][id$='TextField_iframe']").length > 0;
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

    containerCollection.initializeRows = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var currentContentType = $("#spEasyFormsContentTypeSelect").val();
        if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
            containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
        } else if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
            if (!containerCollection.currentCt || containerCollection.currentCt !== currentContentType) {
                containerCollection.currentCt = currentContentType;
                if (containerCollection.currentCt in containerCollection.rowCache) {
                    containerCollection.rows = containerCollection.rowCache[containerCollection.currentCt];
                }
            } else {
                containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
            }
            if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                var currentListId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
                if (currentListId !== undefined && currentListId.length > 0) {
                    var formText = "";
                    if ($.spEasyForms.sharePointContext.formCache !== undefined) {
                        formText = $.spEasyForms.sharePointContext.formCache;
                    } else {
                        $.ajax({
                            async: false,
                            cache: false,
                            url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/listform.aspx") +
                                "?PageType=4&ListId=" +
                                currentListId +
                                ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") +
                                "&RootFolder=",
                            complete: function(xData) {
                                formText = xData.responseText;
                            }
                        });
                    }

                    opt.input = $(formText);
                    containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
                    $.each(containerCollection.rows, function(fieldIdx, row) {
                        var td = row.row.find("td.ms-formbody");
                        td.html("");
                        $('.ms-formtable').append(row.row);
                    });
                }
            }
        }
        // undo changes to the row that might have been applied by the transforms,
        // since they may have moved.
        $.each(containerCollection.rows, function(i, currentRow) {
            currentRow.row.find("*[data-transformAdded='true']").remove();
            currentRow.row.find("*[data-transformHidden='true']").
            attr("data-transformHidden", "false").show();
        });
        containerCollection.rowCache[containerCollection.currentCt] = containerCollection.rows;
        return containerCollection.rows;
    };

    spContext.getListContext = function(options) {
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
                        "?PageType=4&ListId=" +
                        opt.listId +
                        ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") +
                        "&RootFolder=",
                    complete: function(xData) {
                        if (opt.listId === spContext.getCurrentListId(opt)) {
                            spContext.formCache = xData.responseText;
                        }
                        opt.input = $(xData.responseText);
                        rows = $.spEasyForms.sharePointFieldRows.init(opt);
                        $.each(rows, function(idx, row) {
                            result.fields[row.internalName] = row;
                        });
                    }
                });
            } else {
                $.each(rows, function(idx, row) {
                    result.fields[row.internalName] = row;
                });
            }
            $().SPServices({
                async: false,
                webURL: spContext.getCurrentSiteUrl(opt),
                operation: "GetList",
                listName: opt.listId,
                debug: opt.verbose,
                completefunc: function(xData) {
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
                    $.each($(xData.responseText).find("Field"), function(idx, field) {
                        if ($(field).attr("Hidden") !== "hidden" &&
                            $(field).attr("ReadOnly") !== "readonly") {
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
                completefunc: function(xData) {
                    var contentTypes = {};
                    if ($(xData.responseText).find("ContentTypes").attr("ContentTypeOrder")) {
                        contentTypes.order = $(xData.responseText).find("ContentTypes").attr("ContentTypeOrder").split(",");
                    }
                    var order = [];
                    $.each($(xData.responseText).find("ContentType"), function(idx, ct) {
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

    $.spEasyForms.sharePointFieldRows.init = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var input;
        if (opt.input !== undefined) {
            input = opt.input.find(opt.formBodySelector).closest("tr");
        } else {
            input = $(opt.formBodySelector).closest("tr");
            this.rows = {};
        }
        var results = {};
        results.ContentType = {};
        if (!opt.dontIncludeNodes) {
            if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") > -1 && $("h3:contains('Content Type')").length === 0) {
                results.ContentType.row = $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'>Content Type</h3></td><td class='ms-formbody'></td></tr>")
            } else {
                results.ContentType.row = $("h3:contains('Content Type')");
            }
        }
        results.ContentType.internalName = "ContentType";
        results.ContentType.displayName = "Content Type";
        results.ContentType.spFieldType = "SPFieldContentType";
        opt.row = results.ContentType;
        results.ContentType.value = $.spEasyForms.sharePointFieldRows.value(opt);
		if(results.ContentType.value === "" && $(".ms-descriptiontext:contains('Content Type:') > span").text().length > 0) {
			results.ContentType.value = $(".ms-descriptiontext:contains('Content Type:') > span").text();
		}
        input.each(function() {
            opt.tr = $(this);
            var current = $.spEasyForms.sharePointFieldRows.processTr(opt);
            if (current.internalName !== undefined) {
                results[current.internalName] = current;
            }
        });
        if (opt.input === undefined) {
            this.rows = results;
        }
        return results;
    };

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);