/*
 * SPEasyForms.sharePointFieldRows - object to parse field rows into a map.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Utility object to parse field rows into a map.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.sharePointFieldRows = {
        rows: {},

        /********************************************************************
         * Parse a SharePoint form into a map of
         *     field names => structured representation of the field.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     input: {$(src)} // a jQuery object wrapping a string with the
         *         // source to be parsed, if undefined defaults to parse
         *         // from the current page
         * }
         *
         * @returns {object} rows - {
         *     <internalName>: {object},
         *     <displayName>: {object},
         *     ... // at least one key is added for each row object, two if
         *         // the displayName is not already in use
         * }
         *
         * The row structure looks like:
         *
         * {
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     internalName: {string},
         *     displayName: {string},
         *     spFieldType: {string},
         *     value: {string} // an attempt to get the current value from
         *                     // the row based on spFieldType
         * }
         *
         * For example, to get rows for a page other than the current page,
         * you can do something like:
         *
         *     $.ajax({
         *         async: false,
         *         url: <your edit form url>,
         *         complete: function (xData) {
         *             var rows = $.spEasyForms.sharePointFieldRows.init(
         *                 { input: $(xData.responseText) });
         *             // have fun with rows
         *         }
         *     });
         ********************************************************************/
        init: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var input;
            if (opt.input !== undefined) {
                input = opt.input.find(opt.formBodySelector).closest("tr");
            } else {
                input = $(opt.formBodySelector).closest("tr");
                this.rows = {};
            }
            var results = {};
            input.each(function () {
                opt.tr = $(this);
                var current = $.spEasyForms.sharePointFieldRows.processTr(opt);
                if (current.internalName !== undefined) {
                    results[current.internalName] = current;
                }
            });
            if (opt.input === undefined) {
                this.rows = results;
            }
            return results;
        },

        /*********************************************************************
         * Parse the source from a tr from the form into a structure.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     tr: {$(<the tr>)} // a jQuery wrapper for the DOM tr from the form
         * }
         *
         * @returns {object} - {
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     internalName: {string},
         *     displayName: {string},
         *     spFieldType: {string},
         *     value: {string} // an attempt to get the current value from
         *                     // the row based on spFieldType
         * }
         ********************************************************************/
        processTr: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var current = opt.tr;
            var result = {};
            if (current.html().indexOf("idAttachmentsRow") >= 0) {
                result.row = current;
                result.internalName = "Attachments";
                result.displayName = "Attachments";
                result.spFieldType = "SPFieldAttachments";
            } else if (current.find("h3").text() === "Content Type" || current.children()[0].innerText === "Content Type") {
                result.row = current;
                result.internalName = "ContentType";
                result.displayName = "Content Type";
                result.spFieldType = "SPFieldContentType";
            } else {
                var internal = this.capture({
                    row: current,
                    regex: opt.fieldInternalNameRegex
                });
                var display = this.capture({
                    row: current,
                    regex: opt.fieldDisplayNameRegex
                });
                var fieldType = this.capture({
                    row: current,
                    regex: opt.fieldTypeRegex
                });
                result = {
                    row: current,
                    internalName: internal,
                    displayName: display,
                    spFieldType: fieldType
                };
                if (!result.internalName || !result.displayName || !result.spFieldType) {
                    if (opt.currentListContext) {
                        var schema = opt.currentListContext.schema;
                        if (schema && result.internalName !== undefined) {
                            if (result.displayName === undefined) {
                                result.displayName = result.internalName;
                                if (result.internalName in schema) {
                                    result.displayName =
                                        schema[result.internalName].displayName;
                                }
                            }
                            if (result.spFieldType === undefined) {
                                result.spFieldType = "SPFieldText";
                                if (result.internalName in schema) {
                                    result.spFieldType = "SPField" +
                                        schema[result.internalName].type;
                                }
                            }
                        } else if (schema &&
                            current.find(opt.fieldDisplayNameAltSelector).length > 0) {
                            result.displayName =
                                current.find(opt.fieldDisplayNameAltSelector)
                                .text().replace('*', '').trim();
                            if (result.displayName in schema) {
                                result.internalName =
                                    schema[result.displayName].name;
                                result.spFieldType = "SPField" +
                                    schema[result.displayName].type;
                            }
                        }
                    }
                }
                opt.row = result;
                result.value = this.value(opt);
            }
            return result;
        },

        /*********************************************************************
         * Run a regex against the source from a tr and return the first match
         * or undefined if there are no matches.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     regex: {string}    // a regular expression to run against the
         *                        // the row source
         * }
         *
         * @returns {string} - the first match or undefined
         ********************************************************************/
        capture: function (options) {
            var matches = options.row.html().match(options.regex);
            if (matches && matches.length >= 2) return matches[1];
            return undefined;
        },

        /*********************************************************************
         * Parse the value from the source from a tr based on the SPFieldType.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     tr: {object}, // the structure obtained from processTr
         * }
         *
         * @returns {string} - the first match or undefined
         ********************************************************************/
        value: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tr = opt.row;
            tr.value = "";
            try {
                if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                    return tr.row.find("td.ms-formbody").text().trim();
                }
                switch (tr.spFieldType) {
                    case "SPFieldContentType":
                        tr.value = tr.row.find("td.ms-formbody select option:selected").text();
                        break;
                    case "SPFieldChoice":
                        var select = tr.row.find("td.ms-formbody select");
                        if (select.length > 0) {
                            tr.value = tr.row.find("td.ms-formbody select").val();
                            var tmp = tr.row.find("input:checked").first();
                            var re = new RegExp(/FillInButton$/i);
                            if (tmp.length > 0 && re.test(tmp[0].id)) {
                                tr.value = tr.row.find("input[type='text']").val();
                            }
                        } else {
                            tr.value = "";
                            tr.row.find("input:checked").each(function () {
                                if (tr.value) { tr.value += ";"; }
                                var re = new RegExp(/FillInRadio$/i);
                                if ($(this).length > 0 && !re.test($(this)[0].id)) {
                                    tr.value += $(this).val();
                                }
                                else {
                                    tr.value += tr.row.find("input[type='text']").val();
                                }
                            });
                        }
                        break;
                    case "SPFieldNote":
                    case "SPFieldMultiLine":
                        tr.value = "";
                        var input = tr.row.find("td.ms-formbody input");
                        if (input.length > 0 && !(input.val().search(/^<p>.*<\/p>$/) >= 0 &&
                            input.val().length === 8)) {
                            tr.value = input.val().trim();
                            if (tr.value.indexOf("<div") === 0) {
                                tr.value = "<div class='ms-rtestate-field'>" + tr.value + "</div>";
                            }
                        }
                        var textarea = tr.row.find("td.ms-formbody textarea");
                        if (textarea.length > 0) {
                            tr.value = textarea.val().replace("\n", "<br />\n");
                        }
                        var appendedText =
                            tr.row.find(".ms-imnSpan").parent().parent();
                        if (appendedText.length > 0) {
                            $.each(appendedText, function (i, t) {
                                tr.value += t.outerHTML;
                            });
                        }
                        break;
                    case "SPFieldMultiChoice":
                        tr.value = "";
                        tr.row.find("input:checked").each(function () {
                            if (tr.value.length > 0) tr.value += "; ";
                            var re = new RegExp(/FillInRadio$/i);
                            if ($(this).length > 0 && !re.test($(this)[0].id)) {
                                tr.value += $(this).next().text();
                            }
                            else {
                                tr.value += tr.row.find("input[type='text']").val();
                            }
                        });
                        break;
                    case "SPFieldDateTime":
                        tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        var selects = tr.row.find("select");
                        if (selects.length === 2) {
                            var tmp2 = $(selects[0]).find(
                                "option:selected").text().split(' ');
                            if (tmp2.length === 2) {
                                var hour = tmp2[0];
                                var ampm = tmp2[1];
                                var minutes = $(selects[1]).val();
                                tr.value += " " + hour + ":" + minutes + " " +
                                    ampm;
                            }
                        }
                        break;
                    case "SPFieldLookup":
                        tr.value = tr.row.find("option:selected").text();
                        break;
                    case "SPFieldLookupMulti":
                        tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        if (tr.value.indexOf("|t") >= 0) {
                            var parts = tr.value.split("|t");
                            tr.value = "";
                            for (var i = 1; i < parts.length; i += 2) {
                                if (tr.value.length === 0) {
                                    tr.value += parts[i];
                                } else {
                                    tr.value += "; " + parts[i];
                                }
                            }
                        }
                        break;
                    case "SPFieldBoolean":
                        tr.value =
                            tr.row.find("td.ms-formbody input").is(":checked");
                        if (tr.value) {
                            tr.value = "Yes";
                        } else {
                            tr.value = "No";
                        }
                        break;
                    case "SPFieldURL":
                        var inputs = tr.row.find("td.ms-formbody input");
                        if ($(inputs[0]).val().length > 0 &&
                            $(inputs[1]).val().length > 0) {
                            tr.value = "<a href='" + $(inputs[0]).val() +
                                "' target='_blank'>" + $(inputs[1]).val() +
                                "</a>";
                        } else if ($(inputs[0]).val().length > 0) {
                            tr.value = "<a href='" + $(inputs[0]).val() +
                                "' target='_blank'>" + $(inputs[0]).val() +
                                "</a>";
                        } else {
                            tr.value = "";
                        }
                        break;
                    case "SPFieldUser":
                    case "SPFieldUserMulti":
                        var tmp3 = tr.row.find("input[type='hidden']").val();
                        if (typeof (tmp3) !== 'undefined') {
                            var hiddenInput = $.spEasyForms.utilities.parseJSON(tmp3);
                            $.each(hiddenInput, function (idx, entity) {
                                if (tr.value.length > 0) {
                                    tr.value += "; ";
                                }
                                tr.value += "<a href='" +
                                    opt.currentContext.webRelativeUrl +
                                    "/_layouts/userdisp.aspx?ID=" +
                                    entity.EntityData.SPUserID +
                                    "' target='_blank'>" +
                                    entity.DisplayText + "</a>";
                            });
                        }
                        break;
                    default:
                        tr.value =
                            tr.row.find("td.ms-formbody input").val().trim();
                        break;
                }
            } catch (e) { }
            if (!tr.value) {
                tr.value = "";
            }
            return tr.value;
        },

        compareField: function (a, b) {
            var fields = $.spEasyForms.sharePointContext.getListContext().fields;
            if (a in fields && b in fields) {
                if (fields[a].displayName < fields[b].displayName) {
                    return -1;
                }
                if (fields[a].displayName > fields[b].displayName) {
                    return 1;
                }
            }
            return 0;
        }
    };

})(spefjQuery);
