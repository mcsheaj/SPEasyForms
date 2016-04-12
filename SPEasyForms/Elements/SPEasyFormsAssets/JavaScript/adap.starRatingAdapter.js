/*
 * $.spEasyForms.starRatingAdapter - an adapter plug-in for SPEasyForms that
 * can be applied to integer fields and allows users to enter 0-5 stars as the
 * value by clicking on the stars or a slider-like interface.
 *
 * @requires jQuery.SPEasyForms.2015.01.02 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.starRatingAdapter = {
        type: "Star Rating",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldNumber"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (containerCollection.rows[opt.adapter.columnNameInternal]) {
                var rowInfo = containerCollection.rows[opt.adapter.columnNameInternal];
                var value = rowInfo.value ? rowInfo.value : 0;

                if (visibilityRuleCollection.getFormType(opt) === "display") {
                    if ($("#" + opt.adapter.columnNameInternal + "Stars").length === 0) {
                        var td = rowInfo.row.find("td.ms-formbody");
                        td.html("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>");
                        $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * value) + "px");
                    }
                }
                else {
                    if ($("#" + opt.adapter.columnNameInternal + "Stars").length === 0) {
                        var input = rowInfo.row.find("input");
                        input.hide();
                        input.parent().prepend("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>" +
                            "<div id='" + opt.adapter.columnNameInternal + "StarsSlider' class='speasyforms-starsslider'></div></div>");

                        $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * value) + "px");

                        $("#" + opt.adapter.columnNameInternal + "StarsSlider").click(function (e) {
                            var posX = $(this).offset().left;
                            var stars = Math.floor((e.pageX - posX + 10) / 20);
                            input.val(stars);
                            $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * stars) + "px");
                        });
                    }
                }
            }
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // add the dialog div to the UI if it is not already there
            if ($("#addStarRatingAdapterDialog").length === 0) {
                var txt = "<div id='addStarRatingAdapterDialog' " +
                    "class='speasyforms-dialogdiv' " +
                    "title='Star Rating Adapter'>" +
                    "Would you like to add/remove a Star Rating adapter to " +
                    "'<span id='starRatingFieldName'></span>'?</div>";
                $("#spEasyFormsContainerDialogs").append(txt);
            }
            // initialize the jQuery UI dialog
            var starRatingOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        // add an adapter to the adaptes list and redraw the editor
                        if ($("#starRatingFieldName").text().length > 0) {
                            var result = {
                                type: starRatingAdapter.type,
                                columnNameInternal: $("#starRatingFieldName").text()
                            };
                            opt.adapters[result.columnNameInternal] = result;
                            $.spEasyForms.configManager.set(opt);
                            opt.refresh = $.spEasyForms.refresh.adapters;
                            containerCollection.toEditor(opt);
                        }
                        $('#addStarRatingAdapterDialog').dialog("close");
                    },
                    "Remove": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        // remove the adapter from the adaptes list and redraw the editor
                        if ($("#starRatingFieldName").text().length > 0 &&
                            $("#starRatingFieldName").text() in opt.adapters) {
                            delete opt.adapters[$("#starRatingFieldName").text()];
                            $.spEasyForms.configManager.set(opt);
                        }
                        $('#addStarRatingAdapterDialog').dialog("close");
                        opt.refresh = $.spEasyForms.refresh.adapters;
                        containerCollection.toEditor(opt);
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#addStarRatingAdapterDialog').dialog(starRatingOpts);
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // initialize the field name in the dialog
            $("#starRatingFieldName").text(opt.fieldName);
            // launch the dialog
            $('#addStarRatingAdapterDialog').dialog("open");
        }
    };

    // define shorthand local variable for adapter
    var starRatingAdapter = $.spEasyForms.starRatingAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[starRatingAdapter.type] = starRatingAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
