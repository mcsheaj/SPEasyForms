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

            var divId = "spEasyFormsTabDiv" + opt.currentContainerLayout.index;
            var divClass = "speasyforms-container speasyforms-tabs";
            var listId = "spEasyFormsTabList" + opt.currentContainerLayout.index;
            var listClass = "speasyforms-tablist";

            var div = $("<div/>", { "id": divId, "class": divClass });
            var list = $("<ul/>", { "id": listId, "class": listClass });
            div.append(list);
            opt.currentContainerParent.append(div);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<div/>", { "id": "spEasyFormsTabsDiv" + opt.collectionIndex, "class": divClass });
                opt.collectionType = "tab";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = divClass;

                var li = $("<li/>", { "id": "spEasyFormsTabsLabel" + opt.collectionIndex, "class": divClass });
                li.append($("<a/>", { "href": "#" + "spEasyFormsTabsDiv" + opt.collectionIndex }).text(fieldCollection.name));
                list.append(li);

                div.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            div.tabs({
                beforeLoad: function (e, ui) {
                    ui.jqXHR.abort();
                },
                create: function (e, ui) {
                    $(this).children("div").hide();
                    $(this).children(".speasyforms-tabs:first").show();
                },
                activate: function (e, ui) {
                    var id = ui.newTab.context.hash;
                    $(id).parent().children("div").hide();
                    $(id).show();
                }
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.divId = "spEasyFormsTabDiv" + opt.currentContainerLayout.index;
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
                                    active: $("#spEasyFormsTabsLabel" + nextIndex).index()
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
            opt.divId = "spEasyFormsTabDiv" + opt.currentContainerLayout.index;
            var selected = false;
            $("#spEasyFormsTabDiv" + opt.currentContainerLayout.index).find("table.speasyforms-tabs").each(function (idx, tab) {
                if ($(tab).find(".ms-formbody span.ms-formvalidation").length > 0) {
                    var anchor = $("a[href$='#spEasyFormsTabsDiv" + opt.currentContainerLayout.index + "_" + idx + "']");
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
                    $("a[href$='#spEasyFormsTabsDiv" + opt.currentContainerLayout.index + "_" + idx + "']").
                    removeClass("speasyforms-tabvalidationerror");
                }
            });
            return true;
        }
    };

    containerCollection.containerImplementations.tabs = $.extend({}, baseContainer, tabs);

})(spefjQuery);
