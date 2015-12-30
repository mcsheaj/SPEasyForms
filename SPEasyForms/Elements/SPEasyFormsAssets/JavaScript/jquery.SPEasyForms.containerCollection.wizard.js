/*
 * SPEasyForms WizardContainer - container that allows users to page through sub-containers one at a time.
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

    var wizard = {
        containerType: "Wizard",

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            // create a div to hold the container
            opt.divId = "spEasyFormsWizardDiv" + opt.currentContainerLayout.index;
            var outerDiv = $("<div/>", {
                "id": opt.divId,
                "class": "speasyforms-wizard-outer ui-widget-content ui-corner-all",
                 "role": "tablist"
            });
            opt.currentContainerParent.append(outerDiv);

            // loop through field collections adding them as headers/tables to the container div
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.tableClass = "speasyforms-wizard";

                var h3 = $("<h3/>", {
                    "id": "page" + opt.collectionIndex,
                    "class": opt.tableClass + " ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons",
                    "aria-controls": "pageContent" + opt.collectionIndex,
                    "role": "tab"
                }).text(fieldCollection.name);
                outerDiv.append(h3);

                var div = $("<div/>", {
                    "id": "pageContent" + opt.collectionIndex,
                    "class": opt.tableClass,
                    "aria-labelledby": "page" + opt.collectionIndex,
                    "role": "tabPanel"
                });
                outerDiv.append(div);

                opt.parentElement = div;
                opt.collectionType = "wizard";
                opt.fieldCollection = fieldCollection;

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            // create next/previous buttons and wire their click events
            opt.outerDiv = outerDiv;
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
                var height = 35;
                var outerDiv = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index);
                outerDiv.children("div.speasyforms-wizard").each(function () {
                    if (($(this).width() + 100) > width) {
                        width = $(this).width() + 100;
                    }
                    if ($(this).height() > height) {
                        height = $(this).height();
                    }
                });

                // set the height/width of each page, hide the unselected pages, 
                // and show the selected page
                wizard.deselectall(outerDiv);
                var selected = false;
                outerDiv.children("div.speasyforms-wizard").each(function () {
                    $(this).width(width).height(height); // set height/width
                    if (!selected) {
                        if ($(this).children("div").attr("data-speasyformsempty") === "0") {
                            wizard.select($(this).prev(), outerDiv);
                            selected = true;
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
            var outerDiv = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index);
            outerDiv.children("h3.speasyforms-wizard").removeClass("speasyforms-accordionvalidationerror");
            var errorDivs = outerDiv.children("div.speasyforms-wizard").children("div[data-speasyforms-validationerror='1']");
            if (errorDivs.length > 0) {
                // if so, select and show the first page with validation errors
                var div = $(errorDivs[0]).closest("div.speasyforms-wizard");
                var h3 = div.prev();
                this.select(h3, outerDiv);
                // and highlight all pages with validation errors
                errorDivs.each(function () {
                    h3 = $(this).closest("div.speasyforms-wizard").prev();
                    h3.addClass("speasyforms-accordionvalidationerror");
                });
            }
            wizard.setNextPrevVisibility(opt);
        },

        // select the content area for the given header
        select: function (header, outerDiv) {
            this.deselectall(outerDiv);
            var div = header.next();
            header.addClass("speasyforms-wizard-selected").attr("aria-selected", "true").attr("aria-hidden", "false").show();
            div.attr("aria-hidden", "false").attr("aria-expanded", "true").addClass("speasyforms-wizard-selected").show();
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
            var h3 = this.getPrevious(opt);
            if (h3) {
                var div = h3.closest("div.speasyforms-wizard-outer ");
                this.select(h3, div);
            }
            wizard.setNextPrevVisibility(opt);
        },

        // hide the current page and show the nearest next page with visible fields
        selectNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var h3 = this.getNext(opt);
            if (h3) {
                var div = h3.closest("div.speasyforms-wizard-outer ");
                this.select(h3, div);
            }
            wizard.setNextPrevVisibility(opt);
        },

        // returns the header node for the previous page, or null if there is no previous visible page
        getPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = null;
            if (opt.selectedHeader.prev() && opt.selectedHeader.prev().prev()) {
                prev = opt.selectedHeader.prev().prev();
                while (prev && prev.length) {
                    if (prev.next().children("div").attr("data-speasyformsempty") === "0") {
                        break;
                    }
                    else if (prev.prev() && prev.prev().prev()) {
                        prev = prev.prev().prev();
                    }
                    else {
                        prev = null;
                    }
                }
            }
            return prev;
        },

        // returns the header node for the next page, or null if there is no next visible page
        getNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = null;
            if (opt.selectedHeader.next() && opt.selectedHeader.next().next()) {
                next = opt.selectedHeader.next().next();
                while (next && next.length) {
                    if (next.next().children("div").attr("data-speasyformsempty") === "0") {
                        break;
                    }
                    else if (next.next() && next.next().next()) {
                        next = next.next().next();
                    }
                    else {
                        next = null;
                    }
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