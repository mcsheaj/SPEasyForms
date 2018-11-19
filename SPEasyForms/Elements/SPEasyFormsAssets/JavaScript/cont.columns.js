/*
 * SPEasyForms.containerCollection.columns - Object representing a multi-column container.
 *
 * 
 * @copyright 2014-2018 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Columns container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var columns = {
        containerType: "Columns",
        fieldCollectionsDlgTitle: "Enter the names of the columns, one per line; these are only displayed on the settings page, not on the form itself.",
        fieldCollectionsDlgPrompt: "Column Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            var outerTableId = "spEasyFormsColumnsOuterTable" + opt.currentContainerLayout.index;
            var outerTableClass = "speasyforms-columns";

            var table = $("<table role='presentation' id='" + outerTableId + "' class='" + outerTableClass + "' width='100%' ></table>");
            var tableRow = $("<tr/>", { "id": outerTableId + "Row" });
            table.append(tableRow);
            opt.currentContainerParent.append(table);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<td/>", { "id": "spEasyFormsColumnsCell" + opt.collectionIndex });
                opt.collectionType = "columns";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-columncell";
                if (opt.currentContainerLayout.fieldCollections.length > 1) {
                    opt.headerOnTop = true;
                }

                tableRow.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var allHidden = true;
            for (var idx = 0; idx < opt.currentContainerLayout.fieldCollections.length; idx++) {
                var id = "#spEasyFormsColumnsCell" + index + "_" + idx;
                if ($(id).children("div.speasyforms-container").attr("data-speasyformsempty") !== "1") {
                    allHidden = false;
                    break;
                }
            }
            if (allHidden) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
                opt.tables = container.find("> table > tbody > tr > td > div > table.speasyforms-fieldcollection");
                this.evenUpTableRows(opt);
            }
        },

        postValidationAction: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < opt.currentContainerLayout.fieldCollections.length; idx++) {
                var id = "#spEasyFormsColumnsCell" + index + "_" + idx;
                if ($(id).children("div.speasyforms-container").attr("data-speasyforms-validationerror") === "1") {
                    container.attr("data-speasyforms-validationerror", "1");
                    break;
                }
            }
            return true;
        },

        evenUpTableRows: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tableRows = [];
            var rowCount = 0;
            $.each($(opt.tables), function (idx, table) {
                var currentRows = $(table).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").closest("tr");
                tableRows.push(currentRows);
                if (currentRows.length > rowCount) {
                    rowCount = currentRows.length;
                }
                $.each($(currentRows), function (idx, row) {
                    $(row).css("height", "auto");
                });
            });
            /* jshint -W083 */
            for (var i = 0; i < rowCount; i++) {
                var height = 0;
                $.each($(tableRows), function (idx, rows) {
                    if (rows.length > i && $(rows[i]).height() > height) {
                        height = $(rows[i]).height();
                    }
                });
                if (height > 0) {
                    $.each($(tableRows), function (idx, rows) {
                        if (rows.length > i && $(rows[i]).height() !== height) {
                            $(rows[i]).height(height);
                        }
                    });
                }
            }
            /* jshint +W083 */
        }
    };

    containerCollection.containerImplementations.columns = $.extend({}, baseContainer, columns);

})(spefjQuery);
