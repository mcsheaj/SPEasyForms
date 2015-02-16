/*
 * SPEasyForms RTEPatch - patch SharePoint rich text editors on containers.
 *
 * @version 2015.00.06
 * @requires SPEasyForms v2014.01
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, RTE_ConvertTextAreaToRichEdit:true, CallFunctionWithErrorHandling:true, browseris */
(function($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    if (!$.spEasyForms.defaults.version)
        $.spEasyForms.defaults.version = "2014.01";

    // this patch only needs to be applied to v2014.01
    if ($.spEasyForms.defaults.version !== "2014.01") return;

    var rteSelectors = [];
    if (typeof(CallFunctionWithErrorHandling) === "function") {
        var RTEPatch_Original_CallFunctionWithErrorHandling = CallFunctionWithErrorHandling;
        CallFunctionWithErrorHandling = function (fn, c, erv, execCtx) {
            var result;
            if (c &&
                (c.BaseViewID === "NewForm" || c.BaseViewID === "EditForm") &&
                (c.CurrentFieldSchema && c.CurrentFieldSchema.RichText && c.CurrentFieldSchema.RichTextMode === 0) &&
                execCtx &&
                execCtx.TemplateFunction &&
                execCtx.TemplateFunction.toString().indexOf("function SPFieldNote_Edit") === 0) {

                var original = browseris.ie5up;
                browseris.ie5up = false;
                result = RTEPatch_Original_CallFunctionWithErrorHandling(fn, c, erv, execCtx);
                browseris.ie5up = original;
                var selector = "textarea[id^='" + c.CurrentFieldSchema.Name + "_" + c.CurrentFieldSchema.Id + "'][id$='TextField']";
                rteSelectors.push({
                    schema: c.CurrentFieldSchema,
                    selector: selector
                });
            } else {
                result = RTEPatch_Original_CallFunctionWithErrorHandling(fn, c, erv, execCtx);
            }
            return result;
        };
    } else {
        RTE_ConvertTextAreaToRichEdit = function (strBaseElementID) {
            // IE
            rteSelectors.push({
                schema: undefined,
                selector: "#" + strBaseElementID
            });
        };
    }

    // save a reference to the original SPEasyForms init method
    $.spEasyForms.RTEPatch_originalInit = $.spEasyForms.init;

    // replace the original SPEasyForms init method
    $.spEasyForms.init = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);

        // call the original SPEasyForms init method
        $.spEasyForms.RTEPatch_originalInit(opt);

        // non IE browsers
        if (rteSelectors.length === 0) {
            $("textarea[id$='TextField']").each(function(idx, area) {
                if ($(area).closest("td").find("span.ms-formdescription").length > 0) {
                    rteSelectors.push({
                        schema: undefined,
                        selector: "#" + area.id
                    });
                }
            });
        }

        $.spEasyForms.applyClEditorToRteFields();
    };

    $.spEasyForms.applyClEditorToRteFields = function () {
        $.each($(rteSelectors), function (idx, selector) {
            var area = $(selector.selector);
            var height = (area.attr("rows") * 21);
            area.cleditor({
                width: 360,
                height: height,
                controls: "font size | " +
                    "bold italic underline | " +
                    "alignleft center alignright | " +
                    "numbering bullets outdent indent | " +
                    "color highlight ltr rtl",
                fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
                    "Georgia,Impact,Sans Serif,Serif,Tahoma,Times New Roman,Trebuchet MS,Verdana",
                useCSS: false,
                bodyStyle: "font-face: Times New Roman; margin: 1px; cursor:text"
            });
            area.closest("td").find("span.ms-formdescription").remove();
            area.closest("tr").find(".ms-formbody > span > br").remove();
        });
        var frames = $(".cleditorMain iframe");
        frames.on("load", function () {
            var ed = $(this).closest("div.cleditorMain").find("textarea").cleditor();
            if ($(this).contents().find("body").html().length === 0) {
                ed[0].refresh(ed);
            }
        });
    };

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);