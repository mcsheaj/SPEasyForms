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
        fieldCollectionsDlgTitle: "Enter the names of the accordion content areas, one per line",
        fieldCollectionsDlgPrompt: "Content Area Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];
            var divId = "spEasyFormsAccordionDiv" + opt.index;
            var divClass =
                "speasyforms-container speasyforms-accordion speasyforms-accordion" +
                opt.index;
            $("#" + opt.containerId).append("<div id='" + divId + "' class='" +
                divClass + "'></div>");
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.index + "" + idx;
                opt.parentElement = "spEasyFormsAccordionDiv" + opt.collectionIndex;
                opt.collectionType = "accordion";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-accordion";

                var headerId = "spEasyFormsAccordionHeader" + opt.collectionIndex;
                $("#" + divId).append("<h3 id='" + headerId + "' class='" +
                    opt.tableClass + "'>" + fieldCollection.name + "</h3>");
                $("#" + divId).append(
                    "<div id='" + opt.parentElement + "'></div>");

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });
            $("#" + divId).accordion({
                heightStyle: "auto",
                active: false,
                collapsible: true
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsAccordionDiv" + opt.index;
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
            var divId = "spEasyFormsAccordionDiv" + opt.index;
            var selected = false;
            $("#" + divId).find("table.speasyforms-accordion").each(function (idx, content) {
                if ($(content).find(".ms-formbody span.ms-formvalidation").length > 0) {
                    $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).
                    addClass("speasyforms-accordionvalidationerror");
                    if (!selected) {
                        $("#" + divId).accordion({
                            active: idx
                        });
                        selected = true;
                    }
                } else {
                    $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).
                    removeClass("speasyforms-accordionvalidationerror");
                }
            });
            return true;
        }
    };
    
    containerCollection.containerImplementations.accordion = $.extend({}, baseContainer, accordion);

})(spefjQuery);
