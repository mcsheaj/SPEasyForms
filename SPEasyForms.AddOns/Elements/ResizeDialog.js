/*
 * SPEasyForms ResizeDialog - resize and reposition forms in dialog boxes.
 *
 * @version 2014.01.16
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, SP */
(function ($, undefined) {
    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    // replace the original SPEasyForms init method
    $.spEasyForms.ResizeModalDialog_originalInit = $.spEasyForms.init;
    $.spEasyForms.init = function (options) {
        // call the original SPEasyForms init method
        $.spEasyForms.ResizeModalDialog_originalInit(options);

        var formHidden = $(".ms-formtable").css("display") === "none";

        ExecuteOrDelayUntilScriptLoaded(function () {
            var dlg = SP.UI.ModalDialog.get_childDialog();
            if (dlg !== null) {
                setTimeout(function () {
                    if (formHidden || $("#spEasyFormsContainersPre").length > 0) {
                        SP.UI.ModalDialog.get_childDialog().autoSize();
                        var dlgContent = $(".ms-dlgContent", window.parent.document);
                        var top = ($(window.top).height() - dlgContent.outerHeight()) / 2;
                        var left = ($(window.top).width() - dlgContent.outerWidth()) / 2;
                        dlgContent.css({ top: (top > 0 ? top : 0), left: (left > 0 ? left : 0) });
                        dlgContent.prev().css({ top: (top > 0 ? top : 0), left: (left > 0 ? left : 0) });

                        var dlgFrame = $(".ms-dlgFrame", window.parent.document);
                        if (dlgFrame.height() > $(window.parent).height()) {
                            dlgFrame.height($(window.parent).height());
                        }
                        if (dlgFrame.width() > $(window.parent).width()) {
                            dlgFrame.width($(window.parent).width());
                        }
                    }
                }, 3000);
            }
        }, "sp.ui.dialog.js");
    };

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);