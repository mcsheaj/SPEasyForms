/*
 * SPEasyForms.containerCollection.fieldCollection - This is the leaf collection most of the time, a collection that contains
 * a single table of SharePoint fields.
 *
 * @requires jQuery.SPEasyForms.2015.01.02 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;

    $.spEasyForms.fieldCollection = {
        containerType: "FieldCollection",
        cannotBeAdded: true,
        noChildren: true,
        needsParent: true,

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            opt.table = $("<table role='presentation' id='" + opt.collectionType + "Table" + opt.collectionIndex + "' class='speasyforms-fieldcollection " + opt.tableClass + "'></table>");
            opt.currentContainerParent.append(opt.table);

            $.each(opt.fieldCollection.fields, function (fieldIdx, field) {
                opt.rowInfo = containerCollection.rows[field.fieldInternalName];
                if ($.spEasyForms.baseContainer.appendRow(opt)) {
                    result.push(field.fieldInternalName);
                }
            });
            return result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            if (container.find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            if (container.find("span[role='alert']").length > 0) {
                container.attr("data-speasyforms-validationerror", "1");
            }
            else {
                container.attr("data-speasyforms-validationerror", "0");
            }
            return true;
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            var table = containerCollection.createFieldCollection(opt);

            $.each(opt.currentContainerLayout.fields, function (fieldIdx, field) {
                opt.row = containerCollection.rows[field.fieldInternalName];
                if (opt.row === undefined) {
                    opt.row = {
                        displayName: field.fieldInternalName,
                        internalName: field.fieldInternalName,
                        spFieldType: field.fieldInternalName,
                        value: "",
                        row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                        fieldMissing: true
                    };
                }
                table.append(containerCollection.createFieldRow(opt));
                result.push(field.fieldInternalName);
            });

            opt.currentContainer.find(".speasyforms-itemtitle").html(opt.currentContainerLayout.name);
            if (opt.currentContainerLayout.name !== opt.currentContainerLayout.containerType) {
                opt.currentContainer.find(".speasyforms-itemtype").html("&nbsp;[" + opt.currentContainerLayout.containerType + "]");
            }
            opt.currentContainer.find(".speasyforms-nestedsortable-content").append(table);

            return result;
        },

        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var trs = $(opt.container).find("tr:not(:first)");

            var result = {
                name: $(opt.container).attr("data-containername"),
                containerType: $(opt.container).attr("data-containertype"),
                index: $(opt.container).attr("data-containerindex"),
                fields: []
            };

            $.each(trs, function (idx, tr) {
                var tds = $(tr).find("td");
                result.fields.push({
                    fieldInternalName: $(tds[1]).text()
                });
            });

            return result;
        }
    };
    var fieldCollection = $.extend({}, $.spEasyForms.baseContainer, $.spEasyForms.fieldCollection);
    containerCollection.containerImplementations.fieldCollection = fieldCollection;

})(spefjQuery);

