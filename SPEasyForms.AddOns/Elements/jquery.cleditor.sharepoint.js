/*
 * jquery.cleditor.sharepoint plugin to make cleditor look and act like the OOBSharePoint
 * rich text editor (except less buggy/finicky).
 *
 * @copyright 2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($) {

    if (!$) return;

    // Define an array of structures describing control key shortcuts
    $.cleditor.buttonShortcuts = {
        key66: {
            name: "bold",
            title: "Bold (Ctrl + B)",
            keyCode: 66,
            shift: false
        },
        key73: {
            name: "italic",
            title: "Italic (Ctrl + I)",
            keyCode: 73,
            shift: false
        },
        key85: {
            name: "underline",
            title: "Underline (Ctrl + U)",
            keyCode: 85,
            shift: false
        },
        key117: {
            name: "underline",
            title: "Underline (Ctrl + U)",
            keyCode: 117,
            shift: false
        },
        key76: {
            name: "alignleft",
            title: "Align Left (Ctrl + L)",
            keyCode: 76,
            shift: false
        },
        key69: {
            name: "center",
            title: "Align Center (Ctrl + E)",
            keyCode: 69,
            shift: false
        },
        key82: {
            name: "alignright",
            title: "Align Right (Ctrl + R)",
            keyCode: 114,
            shift: false
        },
        keyS69: {
            name: "numbering",
            title: "Numbered List (Ctrl + Shift + E)",
            keyCode: 69,
            shift: true
        },
        keyS76: {
            name: "bullets",
            title: "Bulleted List (Ctrl + Shift + L)",
            keyCode: 76,
            shift: true
        },
        keyS77: {
            name: "outdent",
            title: "Decrease Indent (Ctrl + Shift + M)",
            keyCode: 77,
            shift: true
        },
        key77: {
            name: "indent",
            title: "Increase Indent (Ctrl + M)",
            keyCode: 77,
            shift: false
        },
        keyS188: {
            name: "ltr",
            title: "Left to Right (Ctrl + Shift + >)",
            keyCode: 188,
            shift: true
        },
        keyS190: {
            name: "rtl",
            title: "Right to Left (Ctrl + Shift + <)",
            keyCode: 190,
            shift: true
        }
    };
    var buttonShortcuts = $.cleditor.buttonShortcuts;

    // define an array of structures describing sticky buttons
    $.cleditor.stickyButtons = {
        bold: {
            tagNames: "strong"
        },
        italic: {
            tagNames: "em"
        },
        underline: {
            tagNames: "u"
        },
        alignleft: {
            tagNames: "div",
            attrName: "align",
            attrValue: "left"
        },
        center: {
            tagNames: "div",
            attrName: "align",
            attrValue: "center"
        },
        alignright: {
            tagNames: "div",
            attrName: "align",
            attrValue: "right"
        },
        bullets: {
            tagNames: "ul"
        },
        numbering: {
            tagNames: "ol"
        },
        ltr: {
            tagNames: ["div", "ol", "ul","span", "p"],
            attrName: "dir",
            attrValue: "ltr"
        },
        rtl: {
            tagNames: ["div", "ol", "ul", "span", "p"],
            attrName: "dir",
            attrValue: "rtl"
        },
        source: true
    };
    var stickyButtons = $.cleditor.stickyButtons;

    // Define the right to left button
    $.cleditor.buttons.rtl = {
        name: "rtl",
        stripIndex: 33,
        title: "Right to Left",
        buttonClick: rtl
    };

    // Define the left to right button
    $.cleditor.buttons.ltr = {
        name: "ltr",
        stripIndex: 32,
        title: "Left to Right",
        buttonClick: ltr
    };

    // Define the background button
    $.cleditor.buttons.backgroundcolor = {
        name: "backgroundcolor",
        stripIndex: 34,
        title: "Background Color",
        popupName: "color",
        popupClick: backgroundColor
    };

    // Add the buttons to the default controls before the source button
    $.cleditor.defaultOptions.controls = $.cleditor.defaultOptions.controls
        .replace("source", "ltr rtl source");
    $.cleditor.defaultOptions.controls = $.cleditor.defaultOptions.controls
        .replace("highlight", "highlight backgroundcolor");

    // override the cleditor function to add shortcuts to the button titles (i.e. tooltips)
    var cssLoaded = false;
    $.fn.sharePoint_Original_cleditor = $.fn.cleditor;
    $.fn.cleditor = function (options) {
        if (!cssLoaded) {
            var css = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/AddOns/2014.01.18/jquery.cleditor.css');
            $("head").append('<link rel="stylesheet" type="text/css" href="' + css + '">');
            cssLoaded = true;
        }
        $.each($(Object.keys(buttonShortcuts)), function (idx, code) {
            var shortcut = buttonShortcuts[code];
            $.cleditor.buttons[shortcut.name].title = shortcut.title;
        });
        return this.sharePoint_Original_cleditor(options);
    };

    // handle rtl clicked
    function rtl(e, data) {
        return setDir(data.editor, "rtl");
    }

    // handle ltr clicked
    function ltr(e, data) {
        return setDir(data.editor, "ltr");
    }

    function backgroundColor(e, data) {
        var editor = data.editor;
        var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
        var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;
        var p = getSelectionContainer(iwin, idoc);
        if (p) {
            var closestBlock = closestBlockInclusive(p, ["div"]);
            if (closestBlock.length > 0) {
                closestBlock.css("background-color", e.target.style.backgroundColor);
            } else {
                $("body", editor.doc).html("<div style='background-color: " +
                    e.target.style.backgroundColor + "'>" + $("body", editor.doc).html() + "</div>");
            }
            editor.updateTextArea(editor);
            editor.focus();
        }
        return false;
    }

    // set the dir attribute of the closest div, span, or paragraph encompassing the
    // current selection range in the editor (adding a div if there is no enclosing element)
    function setDir(editor, dir) {
        var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
        var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;
        var p = getSelectionContainer(iwin, idoc);
        if (p) {
            var closestBlock = closestBlockInclusive(p, ["div", "span", "p"]);
            if (closestBlock.length > 0) {
                closestBlock.attr("dir", dir);
            } else {
                $("body", editor.doc).html("<div dir='" + dir + "'>" + $("body", editor.doc).html() + "</div>");
            }
            editor.updateTextArea(editor);
            editor.focus();
        }
        return false;
    }

    // define a callback for events on the iframe document key down event
    $.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback = $.cleditor.defaultOptions.keyDownCallback;
    $.cleditor.defaultOptions.keyDownCallback = function (e, editor) {
        if (e.keyCode > 17) {
            var key = "key" + (e.shiftKey ? "S" : "") + e.keyCode;
            if (e.type === "keydown" && e.ctrlKey && key in buttonShortcuts) {
                var shortcut = buttonShortcuts[key];
                if (shortcut.name === "ltr") {
                    rtl(e, {
                        editor: editor
                    });
                } else if (shortcut.name === "rtl") {
                    ltr(e, {
                        editor: editor
                    });
                } else {
                    var button = $.cleditor.buttons[shortcut.name];
                    editor.execCommand(button.command, undefined, editor.options.useCSS, e.target);
                }
                e.preventDefault();
                e.keyCode = 0;
                return false;
            }
            else if ($.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback) {
                refreshStickyButtons(editor);
                return $.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback(e, editor);
            }
            else {
                refreshStickyButtons(editor);
            }
        }
    };

    // define a callback for events on the iframe document selection changed event
    //$.cleditor.defaultOptions.cleditor_sharepoint_selectionChangeCallback = $.cleditor.defaultOptions.selectionChangeCallback;
    //$.cleditor.defaultOptions.selectionChangeCallback = function (e, editor) {
    //    refreshStickyButtons(editor);
    //    if ($.cleditor.defaultOptions.cleditor_sharepoint_selectionChangeCallback) {
    //        $.cleditor.defaultOptions.cleditor_sharepoint_selectionChangeCallback(e, editor);
    //    }
    //};

    // define a callback for events on the button div click event
    $.cleditor.defaultOptions.cleditor_sharepoint_buttonClickCallBack = $.cleditor.defaultOptions.buttonClickCallBack;
    $.cleditor.defaultOptions.buttonClickCallBack = function (e, data) {
        if (data.buttonName in stickyButtons && !stickyButtons[data.buttonName].closestSelector) {
            if (buttonIsSelected(data.button))
                buttonSelect(data.button, false);
            else
                buttonSelect(data.button, true);
        }
    };

    // hoverEnter - replace the hover enter callback to change the colors and handle sticky buttons
    $.cleditor.defaultOptions.hoverEnter = function (e) {
        var $div = $(e.target).closest("div");
        if ($div.css("background-color") !== "rgb(255, 229, 204)") {
            $div.css("background-color", "rgb(255, 204, 153)");
        }
    };

    // hoverLeave - replace the hover leave callback to change the colors and handle sticky buttons
    $.cleditor.defaultOptions.hoverLeave = function (e) {
        var $div = $(e.target).closest("div");
        if ($div.css("background-color") !== "rgb(255, 229, 204)") {
            $div.css("background-color", "transparent");
        }
    };

    // determine which sticky buttons should be highlighted based on the text range selected in the editor
    function refreshStickyButtons(editor) {
        $.each($(Object.keys($.cleditor.stickyButtons)), function (idx, key) {
            var stickyButton = stickyButtons[key];
            if (stickyButton.tagNames) {
                var button = editor.$main.find("div[buttonName='" + key + "']");

                var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
                var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;

                var p = getSelectionContainer(iwin, idoc);
                if (p) {
                    var tagNames = stickyButton.tagNames.constructor === Array ? stickyButton.tagNames : [stickyButton.tagNames];
                    var closestParent = closestBlockInclusive(p, tagNames);
                    if (closestParent.length > 0) {
                        if (stickyButton.attrName && stickyButton.attrValue) {
                            if (closestParent.attr(stickyButton.attrName) === stickyButton.attrValue) {
                                buttonSelect(button, true);
                            }
                            else {
                                buttonSelect(button, false);
                            }
                        }
                        else {
                            buttonSelect(button, true);
                        }
                    }
                    else {
                        buttonSelect(button, false);
                    }
                }
            }
        });
    }

    // get the closest enclosing block of the current text selection range
    // that matches any of the tagNames passed in.
    function closestBlockInclusive(elem, tagNames) {
        var closestBlock;
        if (elem.tagName && $.inArray(elem.tagName.toLowerCase(), tagNames) > -1) {
            closestBlock = $(elem);
        }
        else {
            closestBlock = $(elem).closest(tagNames.join());
        }
        return closestBlock;
    }

    // select or deselect a button div
    function buttonSelect(button, on) {
        if (!on && buttonIsSelected(button)) {
            $(button).css("background-color", "transparent");
        }
        else if (on && !buttonIsSelected(button)) {
            $(button).css("background-color", "rgb(255, 229, 204)");
        }
    }

    // return true if a button div is selected, false otherwise
    function buttonIsSelected(button) {
        if ($(button).css("background-color") === "rgb(255, 229, 204)") {
            return true;
        }
        return false;
    }

    // get the parent element of the current selection range
    function getSelectionContainer(win, doc) {
        var container = null;
        if (win.getSelection) {  // all browsers, except IE before version 9
            var selectionRange = win.getSelection();
            if (selectionRange.rangeCount > 0) {
                var range = selectionRange.getRangeAt(0);
                container = range.commonAncestorContainer;
            }
        }
        else {
            if (doc.selection) {   // Internet Explorer
                var textRange = doc.selection.createRange();
                container = textRange.parentElement();
            }
        }
        return container;
    }

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);