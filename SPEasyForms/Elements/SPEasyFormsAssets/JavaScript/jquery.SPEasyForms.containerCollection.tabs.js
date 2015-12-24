/*
 * $.spEasyForms.containerCollection.tabs - Object representing a tabs container.
 *
 * @requires jQuery.SPEasyForms.2015.01.beta 
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
            var divClass = "speasyforms-tabs";
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
                create: function () {
                    $(this).children("div").hide();
                    $(this).children(".speasyforms-tabs:first").show();
                },
                activate: function (e, ui) {
                    var id = ui.newTab.context.hash;
                    $(id).parent().children("div").hide();
                    $(id).show();
                    $.spEasyForms.containerCollection.postTransform(opt);
                }
            });

            div.on("mouseup", "a.ui-tabs-anchor", function (e) {
                if (e.which === 1) {
                    div.tabs({
                        active: $(this).parent().index()
                    });
                }
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            var tabs = container.children("div.speasyforms-tabs");
            var subContainers = tabs.children("div.speasyforms-tabs").children("div.speasyforms-container");
            var listItems = tabs.children("ul").children("li");
            var allHidden = true;
            for (var idx = 0; idx < subContainers.length; idx++) {
                if ($(subContainers[idx]).attr("data-speasyformsempty") === "1") {
                    var active = tabs.tabs("option", "active");
                    if (active === idx) {
                        tabs.tabs({ active: idx + 1 });
                    }
                    $(listItems[idx]).hide();
                }
                else {
                    allHidden = false;
                }
            }
            if (allHidden) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            var tabs = container.children("div.speasyforms-tabs");
            var subContainers = tabs.children("div.speasyforms-tabs").children("div.speasyforms-container");
            var listItems = tabs.children("ul").children("li");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < subContainers.length; idx++) {
                if ($(subContainers[idx]).attr("data-speasyforms-validationerror") === "1") {
                    if (container.attr("data-speasyforms-validationerror") === "0") {
                        container.attr("data-speasyforms-validationerror", "1");
                        tabs.tabs({ active: idx });
                    }
                    $(listItems[idx]).find("a").addClass("speasyforms-tabvalidationerror");
                }
            }
            return true;
        }
    };

    containerCollection.containerImplementations.tabs = $.extend({}, baseContainer, tabs);

})(spefjQuery);
