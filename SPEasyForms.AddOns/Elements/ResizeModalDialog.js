/*
 * SPEasyForms ResizeModalDialog - if the current page is a document, containing
 * a form on which SPEasyForms is configured, resize the dialog box to accomodate
 * the SPEasyForms controls.
 *
 * @version 2015.00.05
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, _spPageContextInfo, SP */
(function ($, undefined) {
    // return without doing anything if SPEasyForms has not been loaded
    if (!$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    // save a reference to the original SPEasyForms init method
    $.spEasyForms.ResizeModalDialog_originalInit = $.spEasyForms.init;

    // replace the original SPEasyForms init method
    $.spEasyForms.init = function (options) {
        // call the original SPEasyForms init method
        $.spEasyForms.ResizeModalDialog_originalInit(options);

        ExecuteOrDelayUntilScriptLoaded(function () {
            var dlg = SP.UI.ModalDialog.get_childDialog();
            if (dlg !== null) {
                setTimeout(function () {
                    if ($("#spEasyFormsContainersPre").length > 0) {
                        $.spEasyForms.utilities.autoSizeDialog();
                    }
                }, 3000);
            }
        }, "sp.ui.dialog.js");
    };

    $.spEasyForms.utilities.autoSizeDialog = function () {
        $(".ms-webpartzone-cell").css("margin", "auto");

        var dlgHeight = $.spEasyForms.utilities.getFormHeight();
        var dlgWidth = $.spEasyForms.utilities.getFormWidth();

        if (_spPageContextInfo.webUIVersion === 4) {
            $(".ms-dlgContent", window.parent.document).height(dlgHeight);
            $(".ms-dlgBorder", window.parent.document).height(dlgHeight);
            $(".ms-dlgFrame", window.parent.document).height(dlgHeight - 32);

            $(".ms-dlgContent", window.parent.document).width(dlgWidth);
            $(".ms-dlgBorder", window.parent.document).width(dlgWidth - 2);
            $(".ms-dlgFrame", window.parent.document).width(dlgWidth - 2);

            $("#s4-workspace").css("overflow-x", "hidden");
            $(".ms-dlgOverlay", window.parent.document).next().css("display", "none");
            $(".ms-dlgTitle", window.parent.document).css("width", "100%");
            $("a[id^='DlgResize'", window.parent.document).css("display", "none");
        }
        else {
            $(".ms-dlgContent", window.parent.document).height(dlgHeight);
            $(".ms-dlgBorder", window.parent.document).height(dlgHeight);
            $(".ms-dlgFrame", window.parent.document).height(dlgHeight - 55);

            $(".ms-dlgContent", window.parent.document).width(dlgWidth);
            $(".ms-dlgBorder", window.parent.document).width(dlgWidth - 1);
            $(".ms-dlgFrame", window.parent.document).width(dlgWidth - 30);

            $(".sp-peoplepicker-topLevel").width(210);
            $(".sp-peoplepicker-topLevelDisabled").width(210);
        }

        var dlgContent = $(".ms-dlgContent", window.parent.document);
        dlgContent.css({
            top: ($(window.top).height() / 2 - dlgContent.height() / 2),
            left: $(window.top).width() / 2 - dlgContent.width() / 2
        });
    };

    $.spEasyForms.utilities.getFormHeight = function () {
        var contentHeight =
            ($("#spEasyFormsContainersPre").length > 0 ? $("#spEasyFormsContainersPre").height() : 0) +
            ($("#spEasyFormsContainersPost").length > 0 ? $("#spEasyFormsContainersPost").height() : 0) +
            $(".ms-formtable").height() + 300;
        if (contentHeight > ($(window.top).height() - 20)) {
            contentHeight = $(window.top).height() - 20;
        }
        return contentHeight;
    };

    $.spEasyForms.utilities.getFormWidth = function () {
        var contentWidth = $(".ms-dlgContent", window.parent.document).width();
        if ($("#spEasyFormsContainersPre").length > 0 && contentWidth < $("#spEasyFormsContainersPre").width()) {
            contentWidth = $("#spEasyFormsContainersPre").width() + 90;
        }
        if ($("#spEasyFormsContainersPost").length > 0 && contentWidth < $("#spEasyFormsContainersPost").width()) {
            contentWidth = $("#spEasyFormsContainersPost").width() + 90;
        }
        if (contentWidth > ($(window.top).width() - 20)) {
            contentWidth = $(window.top).width() - 20;
        }
        return contentWidth;
    };
})(spefjQuery);