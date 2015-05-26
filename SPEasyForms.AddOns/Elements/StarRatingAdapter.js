/*
 * $.spEasyForms.starRatingAdapter - an adapter plug-in for SPEasyForms that
 * can be applied to integer fields and allows users to enter 0-5 stars as the
 * value by clicking on the stars or a slider-like interface.
 *
 * @version 2014.01.19
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if there is already a starRatingUser adapter
    if (!$ || !$.spEasyForms || "Star Rating" in $.spEasyForms.adapterCollection.adapterImplementations) return;

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
                var value = rowInfo.value ? rowInfo.value : (opt.adapter.allowZero ? 0 : 1);

                if (!$("body").attr("data-starcssadded")) {
                    var css = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/AddOns/2014.01.19/starratingadapter.css');
                    $("head").append('<link rel="stylesheet" type="text/css" href="' + css + '">');
                    $("body").attr("data-starcssadded", "true");
                }

                if ($("#" + opt.adapter.columnNameInternal + "Stars").length === 0) {
                    if (visibilityRuleCollection.getFormType(opt) === "display") {
                        var td = rowInfo.row.find("td.ms-formbody");
                        var h3 = "<h3 class='ms-standardheader'>" + td.find("h3").html() + "</h3>";
                        td.html("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>").prepend(h3);
                    }
                    else {
                        var input = rowInfo.row.find("input");
                        input.hide();
                        input.parent().prepend("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>" +
                            "<div id='" + opt.adapter.columnNameInternal + "StarsSlider' class='speasyforms-starsslider'></div></div>");
                        $("#" + opt.adapter.columnNameInternal + "StarsSlider").click(function (e) {
                            var posX = $(this).offset().left;
                            var stars = Math.floor((e.pageX - posX + 15) / 30);
                            if (stars === 0 && !opt.adapter.allowZero) stars = 1;
                            input.val(stars);
                            $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (30 * stars) + "px");
                        });
                    }
                    $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (30 * value) + "px");
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
                    "<input type='checkbox' id='startRatingAllowZero' name='startRatingAllowZero' checked='checked' /> Allow Zero Stars" +
                    "<input type='hidden' id='starRatingFieldName' name='starRatingFieldName' /></div>";
                $("#spEasyFormsContainerDialogs").append(txt);
            }
            // initialize the jQuery UI dialog
            var starRatingOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        // add an adapter to the adapters list and redraw the editor
                        if ($("#starRatingFieldName").val().length > 0) {
                            var result = {
                                type: starRatingAdapter.type,
                                columnNameInternal: $("#starRatingFieldName").val(),
                                allowZero: $("#startRatingAllowZero")[0].checked
                            };
                            opt.adapters[result.columnNameInternal] = result;
                            $.spEasyForms.configManager.set(opt);
                            containerCollection.toEditor(opt);
                        }
                        $('#addStarRatingAdapterDialog').dialog("close");
                    },
                    "Cancel": function () {
                        $('#addStarRatingAdapterDialog').dialog("close");
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
            $("#starRatingFieldName").val(opt.fieldName);
            $("#startRatingAllowZero")[0].checked = opt.adapter.allowZero;
            // launch the dialog
            $('#addStarRatingAdapterDialog').dialog("open");
        }
    };

    // define shorthand local variable for adapter
    var starRatingAdapter = $.spEasyForms.starRatingAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[starRatingAdapter.type] = starRatingAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
