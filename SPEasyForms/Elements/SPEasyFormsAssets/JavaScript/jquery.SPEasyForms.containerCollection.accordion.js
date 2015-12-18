/*
 * SPEasyForms.containerCollection.accordion - Object representing an accordion container.
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
    // Accordion container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var accordion = {
        containerType: "Accordion",
        fieldCollectionsDlgTitle: "Enter the names of the accordion pages, one per line",
        fieldCollectionsDlgPrompt: "Page Names (one per line):",

        /*
        opt.currentContainerLayout
        opt.currentContainerParent
        */
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];
            var divId = "spEasyFormsAccordionDiv" + opt.currentContainerLayout.index;
            var divClass = "speasyforms-container speasyforms-accordion";

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
                collapsible: true
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsAccordionDiv" + opt.currentContainerLayout.index;
            $("#" + divId + " table.speasyforms-accordion").each(function () {
                var index = $(this)[0].id.replace("accordionTable", "");
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    $("#spEasyFormsAccordionHeader" + index).hide();
                    $("#spEasyFormsAccordionHeader" + index).next().hide();
                }
                else {
                    $("#spEasyFormsAccordionHeader" + index).show();
                }
            });
        },
        
        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsAccordionDiv" + opt.currentContainerLayout.index;
            var selected = false;
            $("#" + divId).find("table.speasyforms-accordion").each(function (idx, content) {
                if ($(content).find(".ms-formbody span.ms-formvalidation").length > 0) {
                    $("#spEasyFormsAccordionHeader" + opt.currentContainerLayout.index + "_" + idx).
                    addClass("speasyforms-accordionvalidationerror");
                    if (!selected) {
                        $("#" + divId).accordion({
                            heightStyle: "content",
                            active: idx,
                            collapsible: true
                        });
                        selected = true;
                    }
                } else {
                    $("#spEasyFormsAccordionHeader" + opt.currentContainerLayout.index + "_" + idx).
                    removeClass("speasyforms-accordionvalidationerror");
                }
            });
            return true;
        }
    };
    
    containerCollection.containerImplementations.accordion = $.extend({}, baseContainer, accordion);

})(spefjQuery);
