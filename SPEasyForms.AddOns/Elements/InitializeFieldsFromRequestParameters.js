/*
 * SPEasyForms InitializeFieldsFromRequestParameters - Look for GET parameters whose name
 * matches the pattern spef_[ColumnInternalName] and set the corresponding field value
 * to the value of the parameter.
 *
 * @version 2014.01.15
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 * 
 * window.location.search: (need to url encode for safety)
 * spef_SingleLine=newtextvalue&spef_Title=newtitle&spef_MultiLinePlain=newlines&spef_MultiLinePlainAppend=newappend&spef_ChoiceDropDown=Bravo&spef_ChoiceRadioButtons=Green&spef_ChoiceCheckboxes=Three;One&spef_ChoiceCheckboxesWFillIn=Enter Choice %232;fillintest&spef_Number=1&spef_Currency=2.19&spef_Date=1/1/2015&spef_DateAndTime=1/2/2015 4:25 PM&spef_YesNo=NO&spef_HyperLink=http://speasyforms.codeplex.com|SPEasyForms Home&spef_ChoiceDropDownWFillIn=A&spef_ChoiceRadioWFillIn=Aardvark&spef_SinglePerson=joe@thesharepointconcierge.onmicrosoft.com&spef_MultiplePeople=scott@thesharepointconcierge.onmicrosoft.com;joe@thesharepointconcierge.onmicrosoft.com&spef_SingleGroup=SPEasyForms Visitors&spef_MultipleGroups=SPEasyForms Members;SPEasyForms Visitors&spef_Lookup=Accessories&spef_LookupMulti=3;7
 * 
 * breakdown of parameters:
 * spef_SingleLine=newtextvalue
 * spef_Title=newtitle
 * spef_MultiLinePlain=newlines
 * spef_MultiLinePlainAppend=newappend
 * spef_ChoiceDropDown=Bravo
 * spef_ChoiceRadioButtons=Green
 * spef_ChoiceCheckboxes=Three;One  // all multi-value entries are separated by semi-colon
 * spef_ChoiceCheckboxesWFillIn=Enter Choice %232;fillintest  // note the encoded # (%23) and the second entry is a fill-in choice
 * spef_Number=1
 * spef_Currency=2.19
 * spef_Date=1/1/2015
 * spef_DateAndTime=1/2/2015 4:25 PM   // date just needs to be parsed by new Date(string), Note: this can be somewhat browser specific
 * spef_YesNo=NO  // boolean takes 0, no, or false (case-insesitive), anything else evaluates to true
 * spef_HyperLink=speasyforms.codeplex.com|SPEasyForms Home  // if pipe, iterpreted as url|description
 * spef_ChoiceDropDownWFillIn=A
 * spef_ChoiceRadioWFillIn=Aardvark
 * spef_SinglePerson=joe@thesharepointconcierge.onmicrosoft.com  // can take anything that the people picker can resolve (i.e. user name, email, sip address, even display name if it resolves uniquely)
 * spef_MultiplePeople=scott@thesharepointconcierge.onmicrosoft.com;joe@thesharepointconcierge.onmicrosoft.com
 * spef_SingleGroup=SPEasyForms Visitors
 * spef_MultipleGroups=SPEasyForms Members;SPEasyForms Visitors
 * spef_Lookup=Accessories  // lookups can take either the id or text, but be careful with text as it just selects the first one that CONTAINS the value
 * spef_LookupMulti=3;7
 */

/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, SPClientPeoplePicker */
(function ($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    // save a reference to the original SPEasyForms init method
    $.spEasyForms.InitializeFieldsFromRequestParameters_originalInit = $.spEasyForms.init;

    // replace the original SPEasyForms init method
    $.spEasyForms.init = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);

        $(".speasyforms-helptext").append(
            "<p><a href='http://premiumsoftware.net/cleditor' target='_blank' class='speasyforms-aboutlink'>CLEditor WYSIWYG HTML Editor v1.4.5</a><br>" +
            "Copyright 2010, Chris Landowski, " +
            "<a href='http://premiumsoftware.net/' target='_blank' class='speasyforms-aboutlink'>Premium Software, LLC</a>, Licensed MIT</p>");

        // call the original SPEasyForms init method
        $.spEasyForms.InitializeFieldsFromRequestParameters_originalInit(opt);

        // get a 'hashmap' of request parameters
        var parameters = $.spEasyForms.utilities.getRequestParameters();

        // get the parsed rows of the form table
        var rows = $.spEasyForms.sharePointFieldRows.init(options);

        // foreach request parameter
        $.each(Object.keys(parameters), function (idx, key) {
            // if the parameter name begins with the spef_ prefix
            if (key.indexOf("spef_") === 0) {
                // the internal field name should be the parameter name with the prefix removed
                var internalName = key.substring(5);
                // if the parsed form rows contains a row matching the internal field name
                if (internalName in rows) {
                    // initialize the row and value to set in the options map
                    opt.row = rows[internalName];
                    opt.value = parameters[key];
                    // set the value of the field
                    $.spEasyForms.sharePointFieldRows.setValue(opt);
                }
            }
        });

        // fix time fields on containers (SP 2010)
        $("select[id$='DateTimeFieldDateHours']").css("font-size", "8pt");
        $("select[id$='DateTimeFieldDateMinutes']").css("font-size", "8pt");
    };

    // add a method to the SPEasyForms sharePointFieldRows instance to set the value of a field
    $.spEasyForms.sharePointFieldRows.setValue = function (options) {
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
                            var resolvedUsersList = $(document.getElementById(clientPplPicker.ResolvedListElementId)).find("span[class='sp-peoplepicker-userSpan']");
                            $(resolvedUsersList).each(function () {
                                clientPplPicker.DeleteProcessedUser(this);
                            });
                            var entities = tr.value.split(";");
                            $.each($(entities), function (idx, entity) {
                                clientPplPicker.AddUserKeys(entity);
                            });
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
    };

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
