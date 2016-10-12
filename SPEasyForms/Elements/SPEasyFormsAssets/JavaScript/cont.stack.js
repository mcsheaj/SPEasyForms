/*
 * SPEasyForms.containerCollection.stack - Object representing a container where multiple containers
 * can be stacked one on top of another.
 *
 * 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Stack container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var columns = {
        containerType: "Stack",
        fieldCollectionsDlgTitle: "Enter the names of the containers, one per line; these are only displayed on the settings page, not on the form itself.",
        fieldCollectionsDlgPrompt: "Container Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = opt.currentContainerParent;
                opt.collectionType = "stack";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-stack";

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyformsempty", "1").hide();
            if (container.children("div.speasyforms-container").length > 0) {
                container.children("div.speasyforms-container").each(function (idx, current) {
                    if ($(current).attr("data-speasyformsempty") === "0") {
                        container.attr("data-speasyformsempty", "0").show();
                        return false;
                    }
                });
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyforms-validationerror", "0");
            container.children("div.speasyforms-container").each(function (idx, current) {
                if ($(current).attr("data-speasyforms-validationerror") === "1") {
                    container.attr("data-speasyforms-validationerror", "1");
                    return false;
                }
            });
            return true;
        },
    };

    containerCollection.containerImplementations.stack = $.extend({}, baseContainer, columns);

})(spefjQuery);
