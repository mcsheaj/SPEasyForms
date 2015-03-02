/*
 * SPEasyForms HtmlSnippetContainer
 *
 * @version 2015.00.08
 * @requires SPEasyForms v2014.01
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function($, undefined) {

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
        transform: function(options) {
            return [];
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function(options) {},

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function(options) {},

        // draw the container in the properties pane on the settings page
        toEditor: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#" + opt.id).append("<textarea  id='snippetContents" + opt.index + "' rows='15' cols='80' style='display:none'>" +
                opt.currentContainerLayout.contents + "</textarea>");
            return [];
        },

        // convert whatever is in the properties pane back into a JSOM configuration
        toLayout: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                containerType: opt.containerType,
                index: $(opt.container).attr("data-containerIndex"),
                contents: $(opt.container).find("textarea").val
            };
            return result;
        },

        // launch a dialog to configue this container on the settings page 
        settings: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if ($("#spEasyFormsContainerDialogs").find("#configureSnippetDialog").length === 0) {
                $("#spEasyFormsContainerDialogs").append(
                    "<div id='configureSnippetDialog' class='speasyforms-dialogdiv' title='HTML Snippet Container'>" +
                    "<textarea  id='snippetContents' rows='15' cols='80'></textarea>" +
                    "</div>");
                var configureSnippetOpts = {
                    width: 800,
                    modal: true,
                    open: function(event, ui) {
                        $("#snippetContents").cleditor({
                            width: 770,
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
                            fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," + "Georgia,Impact,Sans Serif,Serif,Tahoma,Times New Roman,Trebuchet MS,Verdana",
                            useCSS: true,
                            bodyStyle: "font-face: Times New Roman; margin: 1px; cursor:text"
                        });
                        $(".cleditorToolbar").height(25);
                        $("#configureSnippetDialog").css("overflow", "hidden");
                    },
                    buttons: {
                        "Ok": function() {
                            var newLayout = {
                                containerType: htmlSnippet.containerType,
                                contents: $("#snippetContents").val()
                            };
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
                            opt.currentConfig.layout.def.push(newLayout);
                            $.spEasyForms.configManager.set(opt);
                            containerCollection.toEditor(opt);
                            $("#configureSnippetDialog").dialog("close");
                            return false;
                        },
                        "Cancel": function() {
                            $("#configureSnippetDialog").dialog("close");
                            return false;
                        }
                    },
                    autoOpen: false,
                    resizable: false
                };
                $("#configureSnippetDialog").dialog(configureSnippetOpts);
            }
            $("#configureSnippetDialog").dialog("open");
        }
    };
    var htmlSnippet = $.spEasyForms.containerCollection.containerImplementations.htmlSnippet;

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);