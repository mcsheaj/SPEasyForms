/*
 * SPEasyForms CheckConditionalsPatch - patch for checkConditionals to fix multiple conditionals
 * do not work (issue #10).
 *
 * @version 2015.00.06
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

    $.spEasyForms.containerCollection.postTransform = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
		opt.prepend = true;
        $.each(opt.currentConfig.layout.def, function (index, layout) {
                    var implementation = $.spEasyForms.utilities.jsCase(layout.containerType);
                    if (implementation in containerCollection.containerImplementations) {
                        var impl = containerCollection.containerImplementations[implementation];
                        if (typeof (impl.postTransform) === 'function') {
                            opt.index = index;
                            opt.currentContainerLayout = layout;
                            opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");
                            impl.postTransform(opt);
                        }
                    }
                    if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                        if ($("#" + opt.containerId).children().last().find("td.ms-formbody").length === 0) {
                            $("#" + opt.containerId).children().last().hide();
                        }
                    }
                    else {
                        opt.prepend = false;
                    }
        });
	};
    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;
	
	    containerCollection.containerImplementations.tabs.postTransform = function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.divId = "spEasyFormsTabDiv" + opt.index;
            $("#" + opt.divId + " table.speasyforms-tabs").each(function () {
                    var index = $(this)[0].id.replace("spEasyFormsTabsTable", "");
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    if ($(this).parent().css("display") !== "none") {
                        var nextIndex = -1;
                        if ($(this).parent().next().length > 0) {
                            nextIndex = $(this).parent().next()[0].id.replace("spEasyFormsTabsDiv", "");
                            $(this).parent().next().show();
                            $("li.speasyforms-tabs" + nextIndex).addClass("ui-tabs-active").addClass("ui-state-active");
                        }
                        $(this).parent().hide();
                    }
                    $(".speasyforms-tabs" + index).hide();
                }
				else {
					$(".speasyforms-tabs" + index).show();
				}
            });
        };

        containerCollection.containerImplementations.accordion.postTransform = function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var divId = "spEasyFormsAccordionDiv" + opt.index;
            $("#" + divId + " table.speasyforms-accordion").each(function () {
                    var index = $(this)[0].id.replace("spEasyFormsAccordionTable", "");
                if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                    $("#spEasyFormsAccordionHeader" + index).hide();
                    $("#spEasyFormsAccordionHeader" + index).next().hide();
                }
				else {
                    $("#spEasyFormsAccordionHeader" + index).show();					 
				}
            });
        };

		containerCollection.containerImplementations.columns.postTransform = function (options) {
			var opt = $.extend({}, $.spEasyForms.defaults, options);
			var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
			$("#" + outerTableId + " tr.speasyforms-columnrow").each(function () {
				if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
					$(this).hide();
				}
				else {
					$(this).show();				
				}
			});
		};
	
        $.spEasyForms.visibilityRuleCollection.transform = function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentConfig && opt.currentConfig.visibility && opt.currentConfig.visibility.def &&
                Object.keys(opt.currentConfig.visibility.def).length > 0) {
                $.each($.spEasyForms.containerCollection.rows, function (idx, row) {
                    opt.row = row;
                    if (row.internalName in opt.currentConfig.visibility.def) {
                        var ruleHandled = false;
                        $.each(opt.currentConfig.visibility.def[row.internalName], function (index, rule) {
                            opt.rule = rule;
                            if (!ruleHandled) {
                                var formMatch = visibilityRuleCollection.checkForm(opt);
                                var appliesMatch = visibilityRuleCollection.checkAppliesTo(opt);
                                var conditionalMatch = visibilityRuleCollection.checkConditionals(opt);
                                if (formMatch && appliesMatch && conditionalMatch) {
                                    var stateHandler = $.spEasyForms.utilities.jsCase(rule.state);
                                    if (stateHandler in visibilityRuleCollection.stateHandlers) {
                                        visibilityRuleCollection.scrubCollection(opt.row.row);
                                        visibilityRuleCollection.stateHandlers[stateHandler](opt);
                                        ruleHandled = true;
                                    }
                                }
                            }
                            if (rule.conditions) {
                                $.each(rule.conditions, function (idx, condition) {
                                    var tr = $.spEasyForms.containerCollection.rows[condition.name];
                                    if (tr === undefined) {
                                        tr = {
                                            displayName: condition.name,
                                            internalName: condition.name,
                                            spFieldType: condition.name,
                                            value: "",
                                            row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                                            fieldMissing: true
                                        };
                                    }
                                    if (!tr.fieldMissing && tr.row.attr("data-visibilitychangelistener") !== "true") {
                                        tr.row.find("input").change(function () {
                                            visibilityRuleCollection.transform(opt);
                                            $.spEasyForms.adapterCollection.transform(opt);
                                            $.spEasyForms.containerCollection.postTransform(opt);
                                        });
                                        tr.row.find("select").change(function () {
                                            visibilityRuleCollection.transform(opt);
                                            $.spEasyForms.adapterCollection.transform(opt);
                                            $.spEasyForms.containerCollection.postTransform(opt);
                                        });
                                        tr.row.find("textarea").change(function () {
                                            visibilityRuleCollection.transform(opt);
                                            $.spEasyForms.adapterCollection.transform(opt);
                                            $.spEasyForms.containerCollection.postTransform(opt);
                                        });
                                        tr.row.attr("data-visibilitychangelistener", "true");
                                    }
                                });
                            }
                        });
                        if (!ruleHandled) {
                            visibilityRuleCollection.scrubCollection(opt.row.row);
                        }
                    }
                });
            }
        };
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);