/*
 * SPEasyForms.sharePointFieldRows - object to parse field rows into a map.
 *
 * 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, SPClientPeoplePicker */
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
            var currentContext = $.spEasyForms.sharePointContext.get(opt);
            var listId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
            if (listId in currentContext.listContexts && !opt.skipCalculatedFields && $.spEasyForms.isSettingsPage(opt)) {
                var hasCalculatedFields = false;
                $.each(Object.keys(results), function (idx, key) {
                    if (results[key].spFieldType === "SPFieldCalculated") {
                        hasCalculatedFields = true;
                        return false;
                    }
                });
                if (!hasCalculatedFields) {
                    var listCtx = $.spEasyForms.sharePointContext.getListContext(options);
                    $.each(Object.keys(listCtx.schema), function (idx, key) {
                        var field = listCtx.schema[key];
                        if (field.type === "Calculated" && field.hasFormula) {
                            var tr = $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'><nobr>" +
                                field.displayName + "</nobr></h3></td><td class='ms-formbody'>value</td></tr>");
                            tr.appendTo("table.ms-formtable");
                            opt.row = tr;
                            var newRow = {
                                internalName: field.name,
                                displayName: field.displayName,
                                spFieldType: "SPFieldCalculated",
                                value: "",
                                row: tr
                            };
                            results[field.name] = newRow;
                        }
                    });
                }
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
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
                result.internalName = "Attachments";
                result.displayName = "Attachments";
                result.spFieldType = "SPFieldAttachments";
            } else if (current.find("h3").text() === "Content Type" || current.children()[0].innerText === "Content Type") {
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
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
                    internalName: internal,
                    displayName: display,
                    spFieldType: fieldType
                };
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
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
            if (result.displayName && result.internalName && result.spFieldType) {
                $.each(Object.keys(result), function (idx, key) {
                    if (result[key].row) {
                        result[key].row.attr("data-displayname", result.displayName);
                        result[key].row.attr("data-internalname", result.internalName);
                        result[key].row.attr("data-spfieldtype", result.spFieldType);
                    }
                });
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
                    tr.value = tr.row.find("td.ms-formbody").clone().children().remove().end().text().trim();
                    return tr.value;
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
                        var pplpkrDiv = $("[id^='" + tr.internalName + "'][id$='ClientPeoplePicker']");
                        if (pplpkrDiv.length > 0) {
                            var tmp3 = tr.row.find("input[type='hidden']").val();
                            if (typeof (tmp3) !== 'undefined') {
                                var hiddenInput = $.spEasyForms.utilities.parseJSON(tmp3);
                                $.each(hiddenInput, function (idx, entity) {
                                    if (tr.value.length > 0) {
                                        tr.value += "; ";
                                    }
                                    if (entity.isResolved || entity.IsResolved) {
                                        tr.value += "<a href='" +
                                        opt.currentContext.webRelativeUrl +
                                        "/_layouts/userdisp.aspx?ID=" +
                                        entity.EntityData.SPUserID +
                                        "' target='_blank'>" +
                                        entity.DisplayText + "</a>";
                                    }
                                    else {
                                        tr.value += entity.DisplayText;
                                    }
                                });
                            }
                        }
                        else {
                            var picker = $().SPServices.SPFindPeoplePicker({
                                peoplePickerDisplayName: tr.displayName
                            });
                            tr.value = picker.currentValue;
                        }
                        break;
                    case "SPFieldBusinessData":
                        tr.value = tr.row.find("div.ms-inputuserfield span span").text().trim();
                        break;
                    case "SPFieldCalculated":
                        tr.value = tr.find("td.ms-formbody").text().trim();
                        break;
                    default:
                        if (tr.row.find("td.ms-formbody input").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        }
                        else if (tr.row.find("td.ms-formbody textarea").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody textarea").val().replace("\n", "<br />\n").trim();
                        }
                        else if (tr.row.find("td.ms-formbody select").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody select").val().trim();
                        }
                        break;
                }
            } catch (e) { }
            if (!tr.value) {
                tr.value = "";
            }
            return tr.value;
        },

        // a method to the SPEasyForms sharePointFieldRows instance to set the value of a field
        setValue: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tr = opt.row;
            tr.value = opt.value ? opt.value : "";
            try {
                // if we're on a display form, we can't very well set a field can we?
                if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                    return;
                }
                switch (tr.spFieldType) {
                    case "SPFieldContentType":
                        // content type is just a select, set its value
                        tr.row.find("td.ms-formbody select").val(tr.value);
                        break;
                    case "SPFieldChoice":
                    case "SPFieldMultiChoice":
                        var select = tr.row.find("td.ms-formbody select");
                        // if there is a select (as opposed to radios or checkboxes)
                        if (select.length > 0) {
                            // if the select has an option equal to the value
                            if (select.find("option[value='" + tr.value + "']").length > 0) {
                                select.val(tr.value); // set the select value
                            }
                            else {
                                // otherwise, look for a fill in choice input
                                var inpt = tr.row.find("input[type='text'][id$='FillInChoice']");
                                if (inpt.length === 0) {
                                    // sp2010
                                    inpt = tr.row.find("input[type='text'][title^='" + tr.displayName + "']");
                                }
                                if (inpt.length > 0) {
                                    // if we find one, set its value
                                    inpt.val(tr.value);
                                    // also set the checkbox for the indicating a fill in value is supplied
                                    inpt.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                }
                            }
                        } else {
                            // split values on semi-colon
                            var values = tr.value.split(";");
                            // clear any checked boxes or fill in inputs
                            tr.row.find("input[type='checkbox']").prop("checked", false);
                            tr.row.find("input[type='text'][id$='FillInText']").val("");
                            $.each($(values), function (idx, value) { // foreach value
                                if (value.length === 0) return;
                                // find the label for the value
                                var label = tr.row.find("label:contains('" + value + "')");
                                if (label.length > 0) {
                                    // check the checkbox associated with the label
                                    label.prev().prop("checked", true);
                                }
                                else {
                                    // otherwise look for a fill in input
                                    var input = tr.row.find("input[type='text'][id$='FillInText']");
                                    if (input.length === 0) {
                                        // sp2010
                                        input = tr.row.find("input[type='text'][title^='" + tr.displayName + "']");
                                    }
                                    if (input.length > 0) {
                                        if (input.val().length > 0) {
                                            // if there is already a value, append this one with a semi-colon separator
                                            input.val(input.val() + ";" + value);
                                            // also check the checkbox or radio indicating a fill in
                                            input.parent().parent().prev().find("input[type='checkbox']").prop("checked", true);
                                            input.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                        }
                                        else {
                                            // set the fill-in
                                            input.val(value);
                                            // also check the checkbox or radio indicating a fill in
                                            input.parent().parent().prev().find("input[type='checkbox']").prop("checked", true);
                                            input.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                        }
                                    }
                                }
                            });
                        }
                        break;
                    case "SPFieldNote":
                    case "SPFieldMultiLine":
                        // if there is a text area, set its text to the value
                        if (tr.row.find("iframe[Title='Rich Text Editor']").length > 0) {
                            tr.row.find("iframe[Title='Rich Text Editor']").contents().find("body").html(tr.value);
                        }
                        else if (tr.row.find("div[contenteditable='true']").length > 0) {
                            tr.row.find("div[contenteditable='true']").html(tr.value);
                            tr.row.find("td.ms-formbody input").val(tr.value);
                        }
                        else if (tr.row.find("textarea").length > 0) {
                            tr.row.find("textarea").text(tr.value);
                        }
                        break;
                    case "SPFieldDateTime":
                        var date = new Date(tr.value);
                        if (date.toString() !== "Invalid Date") {
                            // set the input to the date portion of the date/time
                            tr.row.find("input").val($.datepicker.formatDate("mm/dd/yy", date));
                            // if there is an hours drop down, select the hour based on date.getHours
                            if (tr.row.find("option[value='" + date.getHours() + "']").length > 0) {
                                tr.row.find("select[id$='Hours']").val(date.getHours());
                            }
                            else {
                                // sp2010
                                var i = date.getHours();
                                var fmt = "";
                                if (i < 12) {
                                    fmt = i + " AM";
                                }
                                else {
                                    fmt = (i - 12) + " PM";
                                }
                                tr.row.find("select[id$='Hours']").val(fmt);
                            }
                            // if there is a minutes drop down, select the minutes based on date.getMinutes, Note: that SharePoint only 
                            // allows 5 minute increments so if you pass in 04 as the minutes notthing is selected
                            tr.row.find("select[id$='Minutes']").val(date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
                        }
                        else {
                            tr.row.find("input").val("");
                            if (tr.row.find("option[value='0']").length > 0) {
                                tr.row.find("select[id$='Hours']").val("0");
                            }
                            else {
                                tr.row.find("select[id$='Hours']").val("12 AM");
                            }
                            tr.row.find("select[id$='Minutes']").val("00");
                        }
                        break;
                    case "SPFieldBoolean":
                        // if 0, false, or no was passed (case insensitive), uncheck the box
                        if (tr.value.length === 0 || tr.value === "0" || tr.value.toLowerCase() === "false" || tr.value.toLowerCase() === "no") {
                            tr.row.find("input").prop("checked", false);
                        }
                        else {
                            // otherwise check the box
                            tr.row.find("input").prop("checked", true);
                        }
                        break;
                    case "SPFieldURL":
                        // if no pipe, set the url and description to the full value
                        if (tr.value.indexOf("|") < 0) {
                            tr.row.find("input").val(tr.value);
                        }
                        else {
                            // otherwise set the url to the first part and the description to the second
                            var parts = tr.value.split("|", 2);
                            tr.row.find("input[id$='UrlFieldUrl']").val(parts[0]);
                            tr.row.find("input[id$='UrlFieldDescription']").val(parts[1]);
                        }
                        break;
                    case "SPFieldUser":
                    case "SPFieldUserMulti":
                        var pplpkrDiv = tr.row.find("[id^='" + tr.internalName + "'][id$='ClientPeoplePicker']");
                        // if there is a client people picker, add each value using it
                        if (pplpkrDiv.length > 0) {
                            ExecuteOrDelayUntilScriptLoaded(function () {
                                var clientPplPicker = SPClientPeoplePicker.SPClientPeoplePickerDict[pplpkrDiv[0].id];
                                if (clientPplPicker) {
                                    var resolvedUsersList = $(document.getElementById(clientPplPicker.ResolvedListElementId)).find("span[class='sp-peoplepicker-userSpan']");
                                    $(resolvedUsersList).each(function () {
                                        clientPplPicker.DeleteProcessedUser(this);
                                    });
                                    var entities = tr.value.split(";");
                                    $.each($(entities), function (idx, entity) {
                                        clientPplPicker.AddUserKeys(entity);
                                    });
                                }
                            }, "clientpeoplepicker.js");
                        } else {
                            // otherwise use SPServices to set the people picker value
                            tr.row.find("div[title='People Picker']").html("");
                            tr.row.find("textarea[title='People Picker']").val("");
                            var displayName = tr.displayName;
                            ExecuteOrDelayUntilScriptLoaded(function () {
                                setTimeout(function () {
                                    $().SPServices.SPFindPeoplePicker({
                                        peoplePickerDisplayName: displayName,
                                        valueToSet: tr.value,
                                        checkNames: true
                                    });
                                    tr.row.find("img[title='Check Names']").trigger("click");
                                }, 1000);
                            }, "sp.js");
                        }
                        break;
                    case "SPFieldLookup":
                        // if there is an option with value equal to what's passed in, select it
                        if (tr.row.find("option[value='" + tr.value + "']").length > 0) {
                            tr.row.find("option[value='" + tr.value + "']").prop("selected", true);
                        }
                        else {
                            // otherwise select the first option that contains the value in its text
                            tr.row.find("option:contains('" + tr.value + "'):first").prop("selected", true);
                        }
                        break;
                    case "SPFieldLookupMulti":
                        // same as above but set multiple values separated by a semi-colon
                        var valueArray = tr.value.split(";");
                        $.each($(valueArray), function (idx, value) {
                            if (tr.row.find("option[value='" + value + "']").length > 0) {
                                tr.row.find("option[value='" + value + "']").remove().appendTo("select[id$='_SelectResult']");
                            }
                            else {
                                tr.row.find("option:contains('" + value + "'):first").remove().appendTo("select[id$='_SelectResult']");
                            }
                        });
                        break;
                    default:
                        // by default, look for an input and set it
                        tr.row.find("input").val(tr.value);
                        break;
                }
            } catch (e) { }
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
