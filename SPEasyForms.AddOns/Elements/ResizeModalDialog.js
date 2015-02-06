/*
 * SPEasyForms ResizeModalDialog - if the current page is a document, containing
 * a form on which SPEasyForms is configured, resize the dialog box to accomodate
 * the SPEasyForms controls.
 *
 * @version 2015.00.06
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, _spPageContextInfo, SP */
(function ($, undefined) {
    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

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

        var formHidden = $(".ms-formtable").css("display") === "none";

        ExecuteOrDelayUntilScriptLoaded(function () {
            var dlg = SP.UI.ModalDialog.get_childDialog();
            if (dlg !== null) {
                setTimeout(function () {
                    if (formHidden || $("#spEasyFormsContainersPre").length > 0) {
                        SP.UI.ModalDialog.get_childDialog().autoSize();
                        var dlgContent = $(".ms-dlgContent", window.parent.document);
                        dlgContent.css({ top: ($(window.top).height() / 2 - dlgContent.height() / 2) });
                        dlgContent.prev().css({ top: ($(window.top).height() / 2 - dlgContent.height() / 2) });
                    }
                }, 1000);
            }
        }, "sp.ui.dialog.js");
    };

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
