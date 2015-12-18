/*
 * SPEasyForms.containerCollection.defaultFormContainer - object representing the OOB SharePoint form.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2015 Joe McShea
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
            opt.table = $("<table/>", {
                "role": "presentation",
                "id": opt.collectionType + "Table" + opt.collectionIndex,
                "class": "speasyforms-fieldcollection " + opt.tableClass,
                "cellspacing": "5"
            });
            opt.parentElement.append(opt.table);

            $.each(opt.fieldCollection.fields, function (fieldIdx, field) {
                opt.rowInfo = containerCollection.rows[field.fieldInternalName];
                if ($.spEasyForms.baseContainer.appendRow(opt)) {
                    result.push(field.fieldInternalName);
                }
            });
            return result;
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
    var fieldCollection = $.spEasyForms.fieldCollection;
    containerCollection.containerImplementations.fieldCollection = fieldCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Container implementation representing fields on the OOB SharePoint form.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.defaultFormContainer = {
        containerType: "DefaultForm",
        cannotBeAdded: true,
        noChildren: true,
        noParent: true,

        transform: function () {
            return [];
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var table = containerCollection.createFieldCollection(opt);
            $.each(containerCollection.rows, function (fieldIdx, row) {
                if ($.inArray(fieldIdx, opt.fieldsInUse) < 0) {
                    table.append(containerCollection.createFieldRow({ row: row }));
                    $(".ms-formtable").append(row.row);
                }
            });

            var div = $("<div>", { "class": "speasyforms-nestedsortable-content" });
            div.append(table);
            opt.currentContainer.append(div);
        },

        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            return {
                containerType: this.containerType,
                index: $(opt.container).attr("data-containerindex")
            };
        }
    };
    var defaultFormContainer = $.spEasyForms.defaultFormContainer;
    containerCollection.containerImplementations.defaultForm = defaultFormContainer;

})(spefjQuery);
