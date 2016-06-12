-/*
 * SPEasyForms.containerCollection.accordion - Object representing an accordion container.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Accordion container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var accordion = {
        containerType: "Accordion",
        fieldCollectionsDlgTitle: "Enter the names of the accordion pages, one per line",
        fieldCollectionsDlgPrompt: "Page Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];
            var divId = "spEasyFormsAccordionDiv" + opt.currentContainerLayout.index;
            var divClass = "speasyforms-accordion";

            var div = $("<div/>", { "id": divId, "class": divClass });
            opt.currentContainerParent.append(div);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<div/>", { "id": opt.parentElement });
                opt.collectionType = "accordion";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-accordion";

                var header = $("<h3>", {
                    "id": "spEasyFormsAccordionHeader" + opt.collectionIndex,
                    "class": opt.tableClass
                }).text(fieldCollection.name);

                div.append(header);
                div.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            div.accordion({
                heightStyle: "content",
                active: false,
                collapsible: true,
                activate: function (e) {
                    e.preventDefault();
                }
            });

            div.on("mouseup", "h3.speasyforms-accordion", function (e) {
                if (e.which === 1) {
                    div.find("h3.speasyforms-accordion").
                        removeClass("ui-accordion-header-active").
                        removeClass("ui-state-active").
                        removeClass("ui-corner-top").
                        addClass("ui-corner-all");
                    div.find(".ui-accordion-content").hide();

                    $(this).
                        addClass("ui-accordion-header-active").
                        addClass("ui-state-active").
                        addClass("ui-corner-top").
                        removeClass("ui-corner-all");
                    $(this).next().show();
                    $.spEasyForms.containerCollection.postTransform(opt);
                    $.spEasyForms.utilities.resizeModalDialog();
                }
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var accordion = container.children("div.speasyforms-accordion");
            var headers = accordion.children("h3.ui-accordion-header");
            var content = accordion.children("div.ui-accordion-content ");
            var allHidden = true;
            for (var idx = 0; idx < content.length; idx++) {
                var subContainer = $(content[idx]).children(".speasyforms-container");
                if (subContainer.attr("data-speasyformsempty") === "1") {
                    var active = accordion.accordion("option", "active");
                    if (active === idx) {
                        accordion.accordion({ active: idx + 1 });
                    }
                    $(headers[idx]).hide();
                }
                else {
                    $(headers[idx]).show();
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
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var accordion = container.children("div.speasyforms-accordion");
            var headers = accordion.children("h3.ui-accordion-header");
            var content = accordion.children("div.ui-accordion-content ");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < content.length; idx++) {
                var subContainer = $(content[idx]).children(".speasyforms-container");
                if (subContainer.attr("data-speasyforms-validationerror") === "1") {
                    if (container.attr("data-speasyforms-validationerror") === "0") {
                        container.attr("data-speasyforms-validationerror", "1");
                        accordion.accordion({ active: idx });
                    }
                    $(headers[idx]).addClass("speasyforms-accordionvalidationerror");
                }
                else {
                    $(headers[idx]).removeClass("speasyforms-accordionvalidationerror");
                }
            }
            return true;
        }
    };

    containerCollection.containerImplementations.accordion = $.extend({}, baseContainer, accordion);

})(spefjQuery);
