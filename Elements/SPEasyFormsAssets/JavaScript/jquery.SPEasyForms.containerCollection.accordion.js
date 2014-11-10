/*
 * SPEasyForms.sharePointFieldRows - Object representing an accordion container.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
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
            var result = [];
            var divId = "spEasyFormsAccordionDiv" + opt.index;
            var divClass =
                "speasyforms-container speasyforms-accordion speasyforms-accordion" +
                opt.index;
            $("#" + opt.containerId).append("<div id='" + divId + "' class='" +
                divClass + "'></div>");
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                var itemClass = "speasyforms-accordion speasyforms-accordion" +
                    opt.index + "" + idx;
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
                    result.push(field.fieldInternalName);
                    if (currentRow !== undefined && !currentRow.fieldMissing) {
                        currentRow.row.appendTo("#" + tableId);
                    }
                });
            });
            $("#" + divId).accordion({
                heightStyle: "auto",
                active: false,
                collapsible: true
            });

            return result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsAccordionDiv" + opt.index;
            $("#" + divId + " table.speasyforms-accordion").each(function () {
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    var index = $(this)[0].id.replace("spEasyFormsAccordionTable", "");
                    $("#spEasyFormsAccordionHeader" + index).hide();
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

    containerCollection.containerImplementations.accordion = $.extend({}, baseContainer, accordion)

})(spefjQuery);
