/*
 * jquery.cleditor.sharepoint plugin to make cleditor look and act like the OOBSharePoint
 * rich text editor (except less buggy/finicky).
 *
 * @copyright 2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
(function($) {

    if (!$) return;

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

    // Add the buttons to the default controls before the source button
    $.cleditor.defaultOptions.controls = $.cleditor.defaultOptions.controls
        .replace("source", "ltr rtl source");

    // Define an array of shortcut structures
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
            name: "rtl",
            title: "Right to Left (Ctrl + Shift + <)",
            keyCode: 188,
            shift: true
        },
        keyS190: {
            name: "ltr",
            title: "Left to Right (Ctrl + Shift + >)",
            keyCode: 190,
            shift: true
        }
    };
    var buttonShortcuts = $.cleditor.buttonShortcuts;

    // override the cleditor function to add shortcuts to the button titles (i.e. tooltips)
    $.fn.sharePoint_Original_cleditor = $.fn.cleditor;
    $.fn.cleditor = function(options) {
        $.each($(Object.keys(buttonShortcuts)), function(idx, code) {
            var shortcut = buttonShortcuts[code];
            $.cleditor.buttons[shortcut.name].title = shortcut.title;
        });
        return this.sharePoint_Original_cleditor(options);
    };

    // define a callback for events on the iframe document event handler
    $.cleditor.defaultOptions.cleditor_sharepoint_docEventHandler = $.cleditor.defaultOptions.docEventHandler;
    $.cleditor.defaultOptions.docEventHandler = function(e, editor) {
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
        } else if ($.cleditor.defaultOptions.cleditor_sharepoint_docEventHandler) {
            return $.cleditor.defaultOptions.cleditor_sharepoint_docEventHandler(e, editor);
        }
    };

    // handle rtl clicked
    function rtl(e, data) {
        return setDir(data.editor, "rtl");
    }

    // handle ltr clicked
    function ltr(e, data) {
        return setDir(data.editor, "ltr");
    }

    // set the dir attribute of the closest div, span, or paragraph encompassing the
    // current selection range in the editor (adding a div if there is no enclosing element)
    function setDir(editor, dir) {
        var r = getRange(editor);
        var c = $("div, p, span", editor.doc).closestToOffset({
            left: r.offsetLeft,
            top: r.offsetTop
        });
        if (c) {
            c.attr("dir", dir);
        } else {
            $("body", editor.doc).html("<div dir='" + dir + "'>" + $("body", editor.doc).html() + "</div>");
        }
        editor.updateTextArea(editor);
        editor.focus();
        return false;
    }

    var ua = navigator.userAgent.toLowerCase();
    var ie = /msie/.test(ua);

    // getRange - gets the current text range object
    function getRange(editor) {
        if (ie) return getSelection(editor).createRange();
        return getSelection(editor).getRangeAt(0);
    }

    // getSelection - gets the current text range object
    function getSelection(editor) {
        if (ie) return editor.doc.selection;
        return editor.$frame[0].contentWindow.getSelection();
    }

    // jquery extension to get the closest element from a collection to a given offset
    $.fn.closestToOffset = function(offset) {
        var el = null,
            elOffset, x = offset.left,
            y = offset.top,
            distance, dx, dy, minDistance;
        this.each(function() {
            elOffset = $(this).offset();

            if (
                (x >= elOffset.left) && (x <= elOffset.right) &&
                (y >= elOffset.top) && (y <= elOffset.bottom)
            ) {
                el = $(this);
                return false;
            }

            var offsets = [
                [elOffset.left, elOffset.top],
                [elOffset.right, elOffset.top],
                [elOffset.left, elOffset.bottom],
                [elOffset.right, elOffset.bottom]
            ];
            for (off in offsets) {
                dx = offsets[off][0] - x;
                dy = offsets[off][1] - y;
                distance = Math.sqrt((dx * dx) + (dy * dy));
                if (minDistance === undefined || distance < minDistance) {
                    minDistance = distance;
                    el = $(this);
                }
            }
        });
        return el;
    }

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);