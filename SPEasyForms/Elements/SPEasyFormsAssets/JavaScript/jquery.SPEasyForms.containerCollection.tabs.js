/*
 * SPEasyForms.containerCollection.tabs - Object representing a tabs container.
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
            opt.divId = "spEasyFormsTabDiv" + opt.index;
            var divClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
                opt.index + " ui-tabs ui-widget ui-widget-content ui-corner-all";
            var listId = "spEasyFormsTabsList" + opt.index;
            var listClass = "speasyforms-tabs speasyforms-tabs" +
                opt.index +
                " ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all";
            var containerDiv = $("#" + opt.containerId);
            containerDiv.append("<div id='" + opt.divId + "' class='" + divClass +
                "'><ul id='" + listId + "' class='" + listClass + " role='tablist'></ul></div>");
            var mostFields = 0;
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                if (fieldCollection.fields.length > mostFields) {
                    mostFields = fieldCollection.fields.length;
                }
            });
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
                $("#" + opt.divId).append(
                    "<div id='" + opt.parentElement + "' aria-labelledby='" + opt.labelId + "' " +
                    "' class='ui-tabs-panel ui-widget-content ui-corner-bottom' role='tabpanel'>");

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });
            $("#" + listId).find("li").attr("aria-selected", "false");
            $("#" + listId).find("li:first").attr("aria-selected", "true").addClass("ui-tabs-active").addClass("ui-state-active");
            $("#" + opt.divId).find("div.ui-tabs-panel").attr("aria-hidden", "true".attr("aria-expanded", "false")).hide();
            $("#" + opt.divId).find("div.ui-tabs-panel:first").attr("aria-hidden", "false").attr("aria-expanded", "true").show();
            $("#" + listId).find("a").click(function () {
                $("#" + listId).find("li").attr("aria-selected", "false").removeClass("ui-tabs-active").removeClass("ui-state-active");
                $(this).closest("li").attr("aria-selected", "true").addClass("ui-tabs-active").addClass("ui-state-active");
                $("#" + opt.divId).find("div.ui-tabs-panel").attr("aria-hidden", "true").attr("aria-expanded", "false").hide();
                $($(this).attr("href")).attr("aria-hidden", "false").attr("aria-expanded", "true").show();
                return false;
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.divId = "spEasyFormsTabDiv" + opt.index;
            $("#" + opt.divId + " table.speasyforms-tabs").each(function () {
                var index = $(this)[0].id.replace("tabTable", "");
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    if ($(this).parent().css("display") !== "none") {
                        var nextIndex = -1;
                        $(this).parent().attr("aria-hidden", "true").attr("aria-expanded", "false").removeAttr("tabindex").hide();
                        $("#spEasyFormsTabsLabel" + index).removeClass("ui-tabs-active").removeClass("ui-state-active").attr("aria-selected", "false");
                        if ($(this).parent().next().length > 0) {
                            nextIndex = $(this).parent().next()[0].id.replace("spEasyFormsTabsDiv", "");
                            $(this).parent().next().show();
                            $("li.speasyforms-tabs" + nextIndex).addClass("ui-tabs-active").addClass("ui-state-active").attr("aria-selected", "true");
                        }
                    }
                    $(".speasyforms-tabs" + index).attr("aria-hidden", "true").hide();
                }
                else {
                    $(".speasyforms-tabs" + index).attr("aria-hidden", "false").show();
                }
            });
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var selected = false;
            $("#spEasyFormsTabDiv" + opt.index).find("table.speasyforms-tabs").each(function (idx, tab) {
                if ($(tab).find(".ms-formbody span.ms-formvalidation").length > 0) {
                    $("a[href$='#spEasyFormsTabsDiv" + opt.index + "" + idx + "']").
                    addClass("speasyforms-tabvalidationerror");
                    if (!selected) {
                        $("#spEasyFormsTabDiv" + opt.index).find("div.ui-tabs-panel").hide();
                        $(tab).closest("div").show();
                        $("#spEasyFormsTabDiv" + opt.index).find("li").removeClass("ui-tabs-active").removeClass("ui-state-active");
                        $("#spEasyFormsTabDiv" + opt.index).find("a[href='#" + $(tab).closest("div")[0].id + "']").closest("li").
                        addClass("ui-tabs-active").addClass("ui-state-active");
                        selected = true;
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
