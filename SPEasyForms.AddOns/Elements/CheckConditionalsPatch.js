/*
 * SPEasyForms CheckConditionalsPatch - patch for checkConditionals to fix multiple conditionals
 * do not work (issue #10).
 *
 * @version 2015.00.04
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$.spEasyForms) return;

    // get the version number from the default options (not defined in 2014.01)
    var spEasyFormsVersion = ($.spEasyForms.defaults.version ? $.spEasyForms.defaults.version : "2014.01");

    // this patch only needs to be applied to v2014.01
    if (spEasyFormsVersion !== "2014.01") return;

    // override the checkConditionals method of visibilityRuleCollection to handle multiple
    // conditions correctly
    $.spEasyForms.visibilityRuleCollection.checkConditionals = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = false;
        if (!opt.rule.conditions || opt.rule.conditions.length === 0) {
            result = true;
        } else {
            result = true;
            $.each(opt.rule.conditions, function (idx, condition) {
                opt.row = $.spEasyForms.containerCollection.rows[condition.name];
                if (opt.row) {
                    var currentValue = $.spEasyForms.sharePointFieldRows.value(opt);
                    var type = $.spEasyForms.utilities.jsCase(condition.type);
                    var comparisonOperator = $.spEasyForms.visibilityRuleCollection.comparisonOperators[type];
                    result = comparisonOperator(currentValue, condition.value);
                    if (result === false)
                        return false; // return from $.each
                }
                else {
                    result = false;
                    return false; // return from $.each
                }
            });
        }
        return result;
    };

})(spefjQuery);
