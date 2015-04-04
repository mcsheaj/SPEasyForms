/*
 * SPEasyForms WizardContainer
 *
 * @version 2014.01.15
 * @requires SPEasyForms v2014.01
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    var wizard = {
        containerType: "Wizard",

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsWizardDiv" + opt.index;
            $("#" + opt.containerId).append("<div id=" + divId +
                " class='speasyforms-wizard-outer ui-widget-content ui-corner-all' style='margin: 10px;'></div>");
            var outerDiv = $("#" + divId);
            opt.result = [];
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.index + "" + idx;
                opt.collectionType = "page";
                opt.parentElement = "pageContent" + opt.collectionIndex;
                opt.class = "speasyforms-wizard";
                opt.fieldCollection = fieldCollection;
                outerDiv.append("<h3 id='page" + opt.collectionIndex +
                    "' class='" + opt.class + "' style='padding: 5px;'>" +
                    fieldCollection.name + "</h3>" +
                    "<div id='pageContent" + opt.collectionIndex +
                    "' class='speasyforms-wizard' style='padding: 10px'>" +
                    "</div>");
                opt.headerOnTop = true;
                $.spEasyForms.utilities.appendFieldCollection(opt);
                $("#page" + opt.collectionIndex).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons");
            });

            outerDiv.append("<div  id='" + divId + "Buttons' align='right' " +
                "style='margin-bottom: 10px; margin-right: 10px; font-size: .9em; font-weight: normal;'>" +
                "<button id='" + divId + "Previous' title='Previous' class='speasyforms-wizard-prev'>Previous</button>" +
                "<button id='" + divId + "Next' title='Next' class='speasyforms-wizard-next'>Next</button>" +
                "</div>");
            $("#" + divId + "Buttons").append("<img class='placeholder' align='right' style='display:none;margin:11px;'" +
                " src='/_layouts/images/blank.gif?rev=38' height='1' width='" + $("#" + divId + "Next").outerWidth() +
                "' alt='' data-accessibility-nocheck='true'/>");

            $("#" + divId + "Previous").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.index + " h3.speasyforms-wizard-selected");
                wizard.selectPrevious(opt);
                return false;
            });

            $("#" + divId + "Next").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.index + " h3.speasyforms-wizard-selected");
                wizard.selectNext(opt);
                return false;
            });

            return opt.result;
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if ($("#spEasyFormsWizardDiv" + opt.index + " h3.speasyforms-wizard-selected").length === 0) {
                var width = 400;
                var height = 100;
                $("#spEasyFormsWizardDiv" + opt.index + " table.speasyforms-wizard").each(function () {
                    if ($(this).closest("div").width() > width) {
                        width = $(this).closest("div").width();
                    }
                    if ($(this).closest("div").height() > height) {
                        height = $(this).closest("div").height();
                    }
                });
                $("#spEasyFormsWizardDiv" + opt.index + " table.speasyforms-wizard").each(function () {
                    $(this).closest("div").width(width).height(height);
                    if ($("#spEasyFormsWizardDiv" + opt.index + " h3.speasyforms-wizard-selected").length > 0) {
                        $(this).closest("div").hide().prev().hide();
                    }
                    else if ($(this).find("tr:not([data-visibilityhidden='true'])").length > 0) {
                        $(this).closest("div").addClass("speasyforms-wizard-selected").prev().addClass("speasyforms-wizard-selected");
                    }
                    else {
                        $(this).closest("div").hide().prev().hide();
                    }
                });
            }
            wizard.setNextPrevVisibility(opt);
        },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function (options)
        {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.doNothing)
                return;
            var error = $("#spEasyFormsWizardDiv" + opt.index + " span.ms-formvalidation:first");
            if (error.length > 0) {
                $("#spEasyFormsWizardDiv" + opt.index + " .speasyforms-wizard-selected").hide().removeClass("speasyforms-wizard-selected");
                error.closest("div").prev().show().addClass("speasyforms-wizard-selected").next().show().addClass("speasyforms-wizard-selected");
            }
            wizard.setNextPrevVisibility(opt);
        },

        setNextPrevVisibility: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.index + " h3.speasyforms-wizard-selected");
            var tmp = this.getPrevious(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".speasyforms-wizard-prev").hide();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".speasyforms-wizard-prev").show();

            }
            tmp = this.getNext(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".speasyforms-wizard-next").hide();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".placeholder").show();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".speasyforms-wizard-next").show();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").find(".placeholder").hide();
            }
        },

        selectPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = this.getPrevious(opt);
            if (prev) {
                opt.selectedHeader.removeClass("speasyforms-wizard-selected").hide().next().removeClass("speasyforms-wizard-selected").hide();
                prev.addClass("speasyforms-wizard-selected").show().next().addClass("speasyforms-wizard-selected").show();
            }
            wizard.setNextPrevVisibility(opt);
        },

        getPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = null;
            if (opt.selectedHeader.prev().prev() && opt.selectedHeader.prev().prev()) {
                prev = opt.selectedHeader.prev().prev();
                while (prev && prev.length && prev.next().find("table.speasyforms-wizard > tbody > tr:not([data-visibilityhidden='true'])").length === 0) {
                    if (prev.prev().prev() && prev.prev().prev()) {
                        prev = prev.prev().prev();
                    }
                    else {
                        prev = null;
                    }
                }
                if (prev && prev.closest("div").find("table.speasyforms-wizard > tbody > tr:not([data-visibilityhidden='true'])").length === 0) {
                    prev = null;
                }
            }
            return prev;
        },

        selectNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = this.getNext(opt);
            if (next) {
                opt.selectedHeader.removeClass("speasyforms-wizard-selected").hide().next().removeClass("speasyforms-wizard-selected").hide();
                next.addClass("speasyforms-wizard-selected").show().next().addClass("speasyforms-wizard-selected").show();
            }
            wizard.setNextPrevVisibility(opt);
        },

        getNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = null;
            if (opt.selectedHeader.next() && opt.selectedHeader.next().next()) {
                next = opt.selectedHeader.next().next();
                while (next && next.length && next.next().find("table.speasyforms-wizard > tbody > tr:not([data-visibilityhidden='true'])").length === 0) {
                    if (next.next() && next.next().next()) {
                        next = next.next().next();
                    }
                    else {
                        next = null;
                    }
                }
                if (next && next.closest("div").find("table.speasyforms-wizard > tbody > tr:not([data-visibilityhidden='true'])").length === 0) {
                    next = null;
                }
            }
            return next;
        }
    };

    // extending baseContainer takes care of all functionality for the settings page
    containerCollection.containerImplementations.wizard = $.extend({}, baseContainer, wizard);

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);