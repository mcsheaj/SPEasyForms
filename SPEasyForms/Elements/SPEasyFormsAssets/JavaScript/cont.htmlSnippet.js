/*
 * SPEasyForms htmlSnippet
 *
 * @version 2015.01.01
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;

    $.spEasyForms.containerCollection.containerImplementations.htmlSnippet = {
        containerType: "HtmlSnippet",
        noChildren: true,

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentContainerLayout.contents) {
                opt.currentContainerParent.append(
                    $("<span/>", { "class": "speasyforms-htmlsnippet" }).html(opt.currentContainerLayout.contents));
            }
            return [];
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function () { },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function () { return true; },

        // TBD need to update from here down for new design
        // draw the container in the properties pane of the settings page from the JSON
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var div = $("<div/>", { "class": "speasyforms-nestedsortable-content ui-sortable-handle" });
            var span = $("<span/>", { "class": "speasyforms-htmlsnippet" });
            span.html(opt.currentContainerLayout.contents.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
            div.append(span);

            var textarea = $("<textarea/>", { "class": "speasyforms-htmlsnippet", "style": "display:none" });
            textarea.val(opt.currentContainerLayout.contents);
            div.append(textarea);

            // put contents in a text area show the contents stripping out any scripts
            opt.currentContainer.append(div);

            return [];
        },

        // convert whatever is in the properties pane back into a JSOM configuration
        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                name: $(opt.container).attr("data-containername"),
                containerType: $(opt.container).attr("data-containertype"),
                index: $(opt.container).attr("data-containerindex"),
                contents: $(opt.container).find("textarea.speasyforms-htmlsnippet").val()
            };
            return result;
        },

        // launch a dialog to configue this container on the settings page 
        settings: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            if (!opt.currentContainerLayout) {
                $("#snippetContents").val("");
            }
            else {
                $("#snippetContents").val(opt.currentContainerLayout.contents);
            }

            if ($("#spEasyFormsContainerDialogs").find("#configureSnippetDialog").length === 0) {
                $("#spEasyFormsContainerDialogs").append(
                    "<div id='configureSnippetDialog' class='speasyforms-dialogdiv' title='HTML Snippet Container'>" +
                    "<div style='margin-bottom:10px'>Name: <input name='snippetName' id='snippetName' type='text'></input></div>" +
                    "<textarea  id='snippetContents' rows='15' cols='80'>" +
                    (opt.currentContainerLayout ? opt.currentContainerLayout.contents : '') +
                    "</textarea>" +
                    "<span style='display:none' id='snippetContainerId'></span>" +
                    "</div>");
            }

            var span;
            var configureSnippetOpts = {
                width: 830,
                modal: true,
                open: function () {
                    htmlSnippet.initRTE();
                },
                buttons: {
                    "Ok": function () {
                        var containerIndex = $("#snippetContainerId").text();
                        if (containerIndex.length > 0) {
                            var container = $("li.speasyforms-nestedsortable-container[data-containerindex='" + containerIndex + "']");
                            span = container.find("span.speasyforms-htmlsnippet");
                            var contents = $("#snippetContents").val();
                            span.html(contents.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
                            container.find("textarea.speasyforms-htmlsnippet").val(contents);
                            var name = $("#snippetName").val();
                            if (name.length > 0) {
                                container.attr("data-containername", name);
                                container.find(".speasyforms-itemtitle").text(name);
                                if (name !== container.attr("data-containertype")) {
                                    container.find(".speasyforms-itemtype").text("[HtmlSnippet]");
                                }
                            }
                        }
                        else {
                            opt.currentContainerParent = $(".speasyforms-panel ol.speasyforms-nestedsortable");
                            opt.currentContainerLayout = {
                                name: ($("#snippetName").val().length > 0 ? $("#snippetName").val() : "HtmlSnippet"),
                                containerType: "HtmlSnippet",
                                contents: $("#snippetContents").val()
                            };
                            opt.impl = htmlSnippet;
                            opt.currentContainer = containerCollection.appendContainer(opt);
                            opt.currentContainerLayout = opt.currentContainer.attr("data-containerindex");

                            var div = $("<div/>", { "class": "speasyforms-nestedsortable-content ui-sortable-handle" });
                            span = $("<span/>", { "class": "speasyforms-htmlsnippet" });
                            span.html($("#snippetContents").val().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
                            div.append(span);

                            var textarea = $("<textarea/>", { "class": "speasyforms-htmlsnippet", "style": "display:none" });
                            textarea.val($("#snippetContents").val());
                            div.append(textarea);

                            // put contents in a text area show the contents stripping out any scripts
                            opt.currentContainer.append(div);

                        }
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = $.spEasyForms.refresh.form;
                        containerCollection.toEditor(opt);
                        $("#configureSnippetDialog").dialog("close");
                        return false;
                    },
                    "Cancel": function () {
                        $("#configureSnippetDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                resizable: false
            };
            $("#configureSnippetDialog").dialog(configureSnippetOpts);

            if (opt.currentContainerLayout) {
                $("#snippetContainerId").text(opt.currentContainerLayout.index);
                $("#snippetName").val(opt.currentContainerLayout.name);
            }
            else {
                $("#snippetContainerId").text("");
                $("#snippetName").val("");
            }

            $("#configureSnippetDialog").dialog("open");
            $("#snippetContents").hide();
            $("div[buttonname='source']").css({ "background-color": "transparent" });
            var frame = $("#configureSnippetDialog").find("iframe")[0];
            if (opt.currentConfig.jQueryUITheme) {
                opt.source = opt.currentConfig.jQueryUITheme;
                $("head", frame.contentWindow.document).append(
                    '<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');
            }
            else {
                opt.source = opt.jQueryUITheme;
                $("head", frame.contentWindow.document).append(
                    '<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');
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
        }
    };
    var htmlSnippet = $.spEasyForms.containerCollection.containerImplementations.htmlSnippet;

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);