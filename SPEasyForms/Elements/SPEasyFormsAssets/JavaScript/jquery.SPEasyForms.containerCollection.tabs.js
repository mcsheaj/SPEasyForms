/*
 * $.spEasyForms.containerCollection.tabs - Object representing a tabs container.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Tabs container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var tabs = {
        containerType: "Tabs",
        fieldCollectionsDlgTitle: "Enter the names of the tabs, one per line",
        fieldCollectionsDlgPrompt: "Tab Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];
            var divId = "spEasyFormsTabDiv" + opt.index;
            var divClass = "speasyforms-tabs speasyforms-tabs" + opt.index;
            var listId = "spEasyFormsTabList" + opt.index;
            var listClass = "speasyforms-tablist speasyforms-tablist" + opt.index;
            var containerDiv = $("#" + opt.containerId);
            containerDiv.append("<div id='" + divId + "' class='" + divClass +
                "'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.index + "" + idx;
                opt.parentElement = "spEasyFormsTabsDiv" + opt.collectionIndex;
                opt.labelId = "spEasyFormsTabsLabel" + opt.collectionIndex;
                opt.collectionType = "tab";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-tabs";

                var itemClass = "speasyforms-tabs speasyforms-tabs" + opt.collectionIndex +
                    " ui-state-default ui-corner-top";
                $("#" + listId).append("<li id='" + opt.labelId + "' class='" + itemClass +
                    "' role='tab' aria-controls='" + opt.parentElement + "' tabindex='0'><a href='#" + opt.parentElement + "'>" +
                    fieldCollection.name + "</a></li>");
                $("#" + divId).append(
                    "<div id='" + opt.parentElement + "' aria-labelledby='" + opt.labelId + "' " +
                    "' class='ui-tabs-panel ui-widget-content ui-corner-bottom' role='tabpanel'>");

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });
            $("#" + divId).tabs({
                beforeLoad: function (e, ui) {
                    ui.jqXHR.abort();
                }
            });
            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.divId = "spEasyFormsTabDiv" + opt.index;
            var shown = 0;
            $("#" + opt.divId + " table.speasyforms-tabs").each(function () {
                var index = $(this).parent()[0].id.replace("spEasyFormsTabsDiv", "");
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    $("#spEasyFormsTabsLabel" + index).hide();
                    if ($(this).parent().css("display") !== "none") {
                        if ($(this).parent().next().length > 0) {
                            var nextIndex = $(this).parent().next()[0].id.replace("spEasyFormsTabsDiv", "");
                            if ($("#spEasyFormsTabsLabel" + nextIndex).length > 0) {
                                $("#" + opt.divId).tabs({
                                    active: $("#spEasyFormsTabsLabel" + nextIndex).index(),
                                    beforeLoad: function (e, ui) {
                                        ui.jqXHR.abort();
                                    }
                                });
                            }
                        }
                    }
                }
                else {
                    shown++;
                    $("#spEasyFormsTabsLabel" + index).show();
                }
            });
            if (shown === 0) {
                $("#" + opt.divId).hide();
            }
            else {
                $("#" + opt.divId).show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.divId = "spEasyFormsTabDiv" + opt.index;
            var selected = false;
            $("#spEasyFormsTabDiv" + opt.index).find("table.speasyforms-tabs").each(function (idx, tab) {
                if ($(tab).find(".ms-formbody span.ms-formvalidation").length > 0) {
                    var anchor = $("a[href$='#spEasyFormsTabsDiv" + opt.index + "" + idx + "']");
                    anchor.addClass("speasyforms-tabvalidationerror");
                    if (!selected) {
                        selected = true;
                        $("#" + opt.divId).tabs({
                            active: anchor.parent().index(),
                            beforeLoad: function (e, ui) {
                                ui.jqXHR.abort();
                            }
                        });
                    }
                } else {
                    $("a[href$='#spEasyFormsTabsDiv" + opt.index + "" + idx + "']").
                    removeClass("speasyforms-tabvalidationerror");
                }
            });
            return true;
        }
    };

    containerCollection.containerImplementations.tabs = $.extend({}, baseContainer, tabs);

})(spefjQuery);
