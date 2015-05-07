/*
 * SPEasyForms HtmlSnippetContainer
 *
 * @version 2014.01.17
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

    $.spEasyForms.containerCollection.containerImplementations.htmlSnippet = {
        containerType: "HtmlSnippet",

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentContainerLayout.contents) {
                $("#" + opt.containerId).append("<span class='speasyforms-htmlsnippet'>" +
                    opt.currentContainerLayout.contents + "</span>");
            }
            return [];
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function () { },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function () { },

        // draw the container in the properties pane of the settings page from the JSON
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            htmlSnippet.initDialog(opt);

            // add a button to edit the snippet if not already present
            if ($("#" + opt.id + "EditSnippet" + opt.index).length === 0) {
                $("#" + opt.id).find(".speasyforms-buttoncell").prepend(
                    '<button id="' + opt.id + "EditSnippet" + opt.index +
                    '" title="Edit HTML Snippet" ' +
                    'class="speasyforms-containerbtn">Edit HTML Snippet</button>');

                $('#' + opt.id + "EditSnippet" + opt.index).button({
                    icons: {
                        primary: "ui-icon-gear"
                    },
                    text: false
                }).click(function () {
                    $("#snippetContents").val(opt.currentContainerLayout.contents);
                    $("#snippetContainerIndex").val($("#" + opt.id).attr("data-containerindex"));
                    $("#configureSnippetDialog").find("iframe").contents().find("body").html(
                        opt.currentContainerLayout.contents.replace(/<(?=\/?script)/ig, "&lt;"));
                    if ($("#snippetContents").is(":visible")) {
                        $("#configureSnippetDialog").find("iframe").hide();
                    }
                    htmlSnippet.settings(opt);
                    return false;
                });
            }

            // put contents in a text area show the contents stripping out any scripts
            $("#" + opt.id).append("<span class='speasyforms-sortablefields'>" +
                opt.currentContainerLayout.contents.replace(
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') + "</span>" +
			    "<textarea  id='snippetContents" + opt.index +
                "' rows='15' cols='80' style='display:none'>" +
                opt.currentContainerLayout.contents + "</textarea>");

            return [];
        },

        // convert whatever is in the properties pane back into a JSOM configuration
        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                containerType: opt.containerType,
                index: $(opt.container).attr("data-containerIndex"),
                contents: $(opt.container).find("textarea").val()
            };
            return result;
        },

        // launch a dialog to configue this container on the settings page 
        settings: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!opt.containerIndex) {
                $("#snippetContents").val("");
            }
            htmlSnippet.initDialog(opt);
            $("#configureSnippetDialog").dialog("open");
        },

        // initialize the dialog with the snippet editor
        initDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if ($("#spEasyFormsContainerDialogs").find("#configureSnippetDialog").length === 0) {
                $("#spEasyFormsContainerDialogs").append(
                    "<div id='configureSnippetDialog' class='speasyforms-dialogdiv' title='HTML Snippet Container'>" +
                    "<textarea  id='snippetContents' rows='15' cols='80'></textarea>" +
                    "<input type='hidden' name='snippetContainerIndex' id='snippetContainerIndex' value='" +
                    (opt.containerIndex ? opt.containerIndex : '') + "'/>" +
                    "</div>");
                var configureSnippetOpts = {
                    width: 830,
                    modal: true,
                    open: function () {
                        htmlSnippet.initRTE();
                    },
                    buttons: {
                        "Ok": function () {
                            htmlSnippet.addOrUpdateSnippet(opt);
                            $("#snippetContainerIndex").val("");
                            return false;
                        },
                        "Cancel": function () {
                            $("#configureSnippetDialog").dialog("close");
                            $("#snippetContainerIndex").val("");
                            return false;
                        }
                    },
                    autoOpen: false,
                    resizable: false
                };
                $("#configureSnippetDialog").dialog(configureSnippetOpts);
            }
        },

        // initialize the text area in the dialog with cleditor
        initRTE: function () {
            $("#snippetContents").cleditor({
                width: 800,
                height: 200,
                controls:
                    "font size style | " +
                    "bold italic underline strikethrough subscript superscript | " +
                    "alignleft center alignright | " +
                    "numbering bullets outdent indent | " +
                    "color highlight backgroundcolor | " +
                    "rule image link unlink | " +
                    "cut copy paste pastetext | " +
                    "ltr rtl print source",
                fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
                    "Georgia,Impact,Sans Serif,Serif,Tahoma,Times New Roman,Trebuchet MS,Verdana",
                useCSS: true,
                bodyStyle: "font-face: Times New Roman; margin: 1px; cursor:text"
            });
            $("#configureSnippetDialog").css("overflow", "hidden");
            var ed = $('#configureSnippetDialog').find("textarea").cleditor();
            if (ed.length > 0) {
                ed[0].refresh(ed);
            }
            $(".cleditorToolbar").height(25);
        },

        // callback for the OK button
        addOrUpdateSnippet: function (opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            var containerIndex = $("#snippetContainerIndex").val();
            if (containerIndex) {
                $.each(opt.currentConfig.layout.def, function (idx, container) {
                    if (container.index.toString() === containerIndex.toString()) {
                        container.contents = $("#snippetContents").val();
                        return false;
                    }
                });
            }
            else {
                var newLayout = {
                    containerType: htmlSnippet.containerType,
                    contents: $("#snippetContents").val()
                };
                opt.currentConfig.layout.def.push(newLayout);
            }
            $.spEasyForms.configManager.set(opt);
            containerCollection.toEditor(opt);
            $("#configureSnippetDialog").dialog("close");
        }
    };
    var htmlSnippet = $.spEasyForms.containerCollection.containerImplementations.htmlSnippet;

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);