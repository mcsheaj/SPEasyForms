/*
 * SPEasyForms VisibilityRulesExtension - some additional comparison operators
 * and state handlers for use in SPEasyForms visibility rules.
 *
 * @version 2015.00.08
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$ || !$.spEasyForms) return;

    // shorthand alias for SPEasyForms instances we're going to need
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var utils = $.spEasyForms.utilities;

    // utility method to extend without overwriting existing properties
    if (!utils.extend) {
        utils.extend = function (destination, source) {
            for (var property in source) {
                if (!(property in destination)) {
                    destination[property] = source[property];
                }
            }
            return destination;
        };
    }

    // utility method to determine if a string is a valid date
    if (!utils.isDate) {
        utils.isDate = function (value) {
            var date = new Date(value);
            return (date instanceof Date && !isNaN(date.valueOf()));
        };
    }
    
    // each method will appear in the comparison operator drop down of
    // the add/edit visibility rule dialog (in title case)
    var comparisonOperators = {
        greaterThan: function (value, test) {
            if (utils.isDate(value) && utils.isDate(test)) {
                return (new Date(value)) > (new Date(test));
            }
            return (value > test);
        },
        greaterThanOrEqual: function (value, test) {
            if (utils.isDate(value) && utils.isDate(test)) {
                return (new Date(value)) >= (new Date(test));
            }
            return (value >= test);
        },
        lessThan: function (value, test) {
            if (utils.isDate(value) && utils.isDate(test)) {
                return (new Date(value)) < (new Date(test));
            }
            return (value < test);
        },
        lessThanOrEqual: function (value, test) {
            if (utils.isDate(value) && utils.isDate(test)) {
                return (new Date(value)) <= (new Date(test));
            }
            return (value <= test);
        },
        notEqual: function (value, test) {
            if (utils.isDate(value) && utils.isDate(test)) {
                return (new Date(value)) > (new Date(test));
            }
            return (value !== test);
        }
    };

    // replace the visibility managers comparison operators with mine, doing it this way
    // makes my new operators take a back seat to ones already defined in SPEasyForms proper.
    utils.extend(visibilityRuleCollection.comparisonOperators, comparisonOperators);

    if (!utils.highlight) {
        utils.highlight = function (rowNode, backgroundColor) {
            // if our class hasn't already been added to the head
            if ($("table.ms-formtable").attr("data-visibility" + backgroundColor) !== "true") {
                // add a class to the head that defines our highlight color
                $("head").append("<style>.speasyforms-" + backgroundColor +
                    " { background-color: " + backgroundColor + "; }</style>");

                // add an attribute to the form table to indicate we've already added our class
                $("table.ms-formtable").attr("data-visibility" + backgroundColor, "true");
            }

            // add our class to all table cells in the row, also indicate which class was added with
            // data-visiblityclassadded so the visibility manager can undo our changes when state
            // is changing
            rowNode.find("td").addClass("speasyforms-" + backgroundColor).attr(
                "data-visibilityclassadded", "speasyforms-" + backgroundColor);
        };
    }

    // each method will be available in the state drop down of the 
    // add/edit visibility rule dialog (in title case)
    var stateHandlers = {
        highlightRed: function (options) {
            utils.highlight(options.row.row, "LightPink");
        },
        highlightYellow: function (options) {
            utils.highlight(options.row.row, "Yellow");
        },
        highlightGreen: function (options) {
            utils.highlight(options.row.row, "SpringGreen");
        },
        highlightBlue: function (options) {
            utils.highlight(options.row.row, "Aqua");
        }
    };

    // replace the visibility managers state handlers with mine, doing it this way
    // makes my new operators take a back seat to ones already defined in SPEasyForms proper
    utils.extend(visibilityRuleCollection.stateHandlers, stateHandlers);

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
