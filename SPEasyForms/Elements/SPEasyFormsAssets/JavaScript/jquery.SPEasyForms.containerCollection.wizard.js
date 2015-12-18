/*
 * SPEasyForms WizardContainer
 *
 * @version 2015.01
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    var wizard = {
        containerType: "Wizard",
        fieldCollectionsDlgTitle: "Enter the names of the wizard pages, one per line",
        fieldCollectionsDlgPrompt: "Page Names (one per line):",
        visibileRow: "tr:not([data-visibilityhidden='true']) td.ms-formbody",

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            // create a div to hold the container
            opt.divId = "spEasyFormsWizardDiv" + opt.currentContainerLayout.index;
            opt.outerDiv = $("<div/>", { 
                "id": opt.divId,
                "class": "speasyforms-wizard-outer ui-widget-content ui-corner-all",
                "style": "margin: 10px;",
                "role": "tablist"});
            opt.currentContainerParent.append(opt.outerDiv);

            // loop through field collections adding them as headers/tables to the container div
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                // create a header and a div to hold the current field collection
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.tableClass = "speasyforms-wizard";

                var header = $("<h3/>", {
                    "id": "page" + opt.collectionIndex,
                    "class": opt.tableClass,
                    "style": "padding: 5px",
                    "role": "tab",
                    "aria-controls": "pageContent" + opt.collectionIndex
                }).text(fieldCollection.name);
                opt.outerDiv.append(header);

                var contentDiv = $("<div/>", {
                    "id": "pageContent" + opt.collectionIndex,
                    "aria-labelledby": "page" + opt.collectionIndex,
                    "class": "speasyforms-wizard",
                    "style": "padding: 10px",
                    "role": "tabpanel"
                });
                opt.outerDiv.append(contentDiv);

                // add a table to the div with the fields in the field collection
                opt.collectionType = "page";
                opt.parentElement = contentDiv;
                opt.fieldCollection = fieldCollection;
                opt.headerOnTop = true;
                $.spEasyForms.baseContainer.appendFieldCollection(opt);

                // apply styles from the jquery ui accordion
                contentDiv.addClass(
                    "ui-accordion-header ui-helper-reset ui-state-default" +
                    " ui-corner-all ui-accordion-icons");
            });

            // create next/previous buttons and wire their click events
            this.wireButtons(opt);

            // return an array of the fields added to this container
            return opt.result;
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var headerSelector = "#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected";
            if ($(headerSelector).length === 0) {
                // calculate the width and height of the pages
                var width = 400;
                var height = 100;
                var tableSelector = "#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " table.speasyforms-wizard";
                $(tableSelector).each(function () {
                    if ($(this).closest("div").width() > width) {
                        width = $(this).closest("div").width();
                    }
                    if ($(this).closest("div").height() > height) {
                        height = $(this).closest("div").height();
                    }
                });
                // set the height/width of each page, hide the unselected pages, 
                // and show the selected page
                $(tableSelector).each(function () {
                    $(this).closest("div").width(width).height(height); // set height/width
                    var selectedHeaderSelector = "#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected";
                    if ($(selectedHeaderSelector).length === 0) {
                        if ($(this).find(wizard.visibileRow).length > 0) {
                            wizard.select($(this).closest("div").prev(), $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index));
                        }
                    }
                });
            }
            this.setNextPrevVisibility(opt);
        },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // check if there are validation errors on the container
            var errorSelector = "#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " span.ms-formvalidation";
            var error = $(errorSelector + ":first");
            if (error.length > 0) {
                // if so, select and show the first page with validation errors
                this.select(error.closest("div").prev(), $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index));
            }
            wizard.setNextPrevVisibility(opt);
        },

        // select the content area for the given header
        select: function (header, outerDiv) {
            this.deselectall(outerDiv);
            header.addClass("speasyforms-wizard-selected").attr("aria-selected", "true").attr("aria-hidden", "false").show().
                next().attr("aria-hidden", "false").attr("aria-expanded", "true").addClass("speasyforms-wizard-selected").show();
        },

        // deselect the content area for the given header
        deselect: function (header) {
            header.removeClass("speasyforms-wizard-selected").attr("aria-selected", "false").attr("aria-hidden", "true").show().
                next().attr("aria-hidden", "true").attr("aria-expanded", "false").removeClass("speasyforms-wizard-selected").hide();
        },

        // deselect all content areas
        deselectall: function (outerDiv) {
            outerDiv.find("h3.speasyforms-wizard").each(function (idx, h) {
                var header = $(h);
                header.removeClass("speasyforms-wizard-selected").attr("aria-selected", "false").attr("aria-hidden", "true").hide();
                var div = header.next();
                div.removeClass("speashforms-wizard-selected").attr("aria-expanded", "false").attr("aria-hidden", "true").hide();
            });
        },

        // add next and previous buttons and wire up their events
        wireButtons: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // append next and previous buttons to the container
            opt.outerDiv.append("<div  id='" + opt.divId + "Buttons' align='right' " +
                "style='margin-bottom: 10px; margin-right: 10px; " +
                "font-size: .9em; font-weight: normal;'>" +
                "<button id='" + opt.divId + "Previous' title='Previous' " +
                "class='speasyforms-wizard-prev'>Previous</button>" +
                "<button id='" + opt.divId + "Next' title='Next' " +
                "class='speasyforms-wizard-next'>Next</button>" +
                "</div>");
            $("#" + opt.divId + "Buttons").append(
                "<img class='placeholder' align='right' style='display:none;margin:11px;'" +
                " src='/_layouts/images/blank.gif?rev=38' height='1' width='" +
                $("#" + opt.divId + "Next").outerWidth() +
                "' alt='' data-accessibility-nocheck='true'/>");

            // handle previous click event
            $("#" + opt.divId + "Previous").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected");
                wizard.selectPrevious(opt);
                return false;
            });

            // handle next click event
            $("#" + opt.divId + "Next").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected");
                wizard.selectNext(opt);
                return false;
            });
        },

        // hide the current page and show the nearest previous page with visible fields
        selectPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = this.getPrevious(opt);
            if (prev) {
                this.select(prev, $("#" + opt.divId));
            }
            wizard.setNextPrevVisibility(opt);
        },

        // returns the header node for the previous page, or null if there is no previous visible page
        getPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = null;
            if (opt.selectedHeader.prev().prev() && opt.selectedHeader.prev().prev()) {
                prev = opt.selectedHeader.prev().prev();
                while (prev && prev.length && prev.next().find(this.visibileRow).length === 0) {
                    if (prev.prev().prev() && prev.prev().prev()) {
                        prev = prev.prev().prev();
                    }
                    else {
                        prev = null;
                    }
                }
                if (prev && prev.closest("div").find(this.visibileRow).length === 0) {
                    prev = null;
                }
            }
            return prev;
        },

        // hide the current page and show the nearest next page with visible fields
        selectNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = this.getNext(opt);
            if (next) {
                this.select(next, $("#" + opt.divId));
            }
            wizard.setNextPrevVisibility(opt);
        },

        // returns the header node for the next page, or null if there is no next visible page
        getNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = null;
            if (opt.selectedHeader.next() && opt.selectedHeader.next().next()) {
                next = opt.selectedHeader.next().next();
                while (next && next.length &&
                    next.next().find(this.visibileRow).length === 0) {
                    if (next.next() && next.next().next()) {
                        next = next.next().next();
                    }
                    else {
                        next = null;
                    }
                }
                if (next &&
                    next.closest("div").find(this.visibileRow).length === 0) {
                    next = null;
                }
            }
            return next;
        },

        // determine the visibility of the next any previous buttons, based on whether there
        // is a VISIBLE next or previous page.
        setNextPrevVisibility: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index +
                " h3.speasyforms-wizard-selected");
            var tmp = this.getPrevious(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-prev").hide();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-prev").show();

            }
            tmp = this.getNext(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-next").hide();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".placeholder").show();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-next").show();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".placeholder").hide();
            }
        }
    };

    // extending baseContainer takes care of all functionality for the settings page
    containerCollection.containerImplementations.wizard = $.extend({}, baseContainer, wizard);

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);