﻿/*
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
                "'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
            var mostFields = 0;
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                if (fieldCollection.fields.length > mostFields) {
                    mostFields = fieldCollection.fields.length;
                }
            });
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.index + "" + idx;
                opt.parentElement = "spEasyFormsTabsDiv" + opt.collectionIndex;
                opt.collectionType = "tab";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-tabs";

                var itemClass = "speasyforms-tabs speasyforms-tabs" + opt.collectionIndex +
                    " ui-state-default ui-corner-top";
                $("#" + listId).append("<li class='" + itemClass +
                    "'><a href='#" + opt.parentElement + "'>" + fieldCollection.name +
                    "</a></li>");
                $("#" + opt.divId).append(
                    "<div id='" + opt.parentElement +
                    "' class='ui-tabs-panel ui-widget-content ui-corner-bottom'>");

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
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
