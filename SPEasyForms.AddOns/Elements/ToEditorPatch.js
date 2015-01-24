/*
 * SPEasyForms ToEditorPatch - fix issues with resizing the suite bar.
 *
 * @version 2015.00.06
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

    $.spEasyForms.toEditor = function (opt) {
        opt.currentConfig = $.spEasyForms.configManager.get(opt);
        if (_spPageContextInfo.webUIVersion === 4) {
            $("#spEasyFormsContent").css({
                position: "static",
                "overflow-y": "visible",
                "overflow-x": "visible"
            });
            $("div.speasyforms-panel").css({
                width: "auto",
                height: "auto",
                position: "static",
                "overflow-y": "visible",
                "overflow-x": "visible"
            });
            $("td.speasyforms-form").css("padding-left", "0px");
            $(".s4-title-inner").css("display", "none");
            $(".speasyforms-ribbon").css("position", "fixed");
            $("#s4-bodyContainer").css("overflow-x", "visible");
            $(".s4-notdlg").hide();
            $("#spEasyFormsOuterDiv").css({
                "margin-left": "-160px",
                "margin-top": "88px"
            });
            $("#RibbonContainer").append("<h3 class='speasyforms-breadcrumbs' style='position:fixed;top:0px;color:white;'><a href='" + opt.source + "' style='color:white;'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h3>");
            $("tr.speasyforms-sortablefields, tr.speasyforms-sortablerules").css("font-size", "0.9em");
        }
        else {
            $(".ms-cui-topBar2").prepend("<h2 class='speasyforms-breadcrumbs'><a href='" + opt.source + "'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h2>");
        }
        $.each(opt.currentListContext.contentTypes.order, function (i, ctid) {
            if (ctid.indexOf("0x0120") !== 0) {
                $("#spEasyFormsContentTypeSelect").append("<option value='" +
                    opt.currentListContext.contentTypes[ctid].id + "'>" +
                    opt.currentListContext.contentTypes[ctid].name + "</option>");
            }
        });
        $("#spEasyFormsContentTypeSelect").change(function () {
            delete $.spEasyForms.containerCollection.rows;
            delete $.spEasyForms.sharePointContext.formCache;
            opt.contentTypeChanged = true;
            $.spEasyForms.containerCollection.toEditor(opt);
        });
        $.spEasyForms.containerCollection.toEditor(opt);
        $(window).on("beforeunload", function () {
            if (!$("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled")) {
                return "You have unsaved changes, are you sure you want to leave the page?";
            }
        });
        $.spEasyForms.appendContext(opt);
        var bannerHeight = 5;
        if (_spPageContextInfo.webUIVersion === 4) {
            bannerHeight += $("#s4-ribbonrow").height();
        }
        else {
            bannerHeight += $("#suiteBarTop").height() + $("#suitBar").height() + $("#s4-ribbonrow").height() + $("#spEasyFormsRibbon").height();
        }
        $("div.speasyforms-panel").height($(window).height() - bannerHeight);
        if (_spPageContextInfo.webUIVersion === 4) {
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 445);
        }
        else {
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 405);
        }
        $(window).resize(function () {
            $("div.speasyforms-panel").height($(window).height() - bannerHeight);
            if (_spPageContextInfo.webUIVersion === 4) {
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 445);
            }
            else {
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 405);
            }
        });
        $('#spEasyFormsRibbon').show;
    };

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);
