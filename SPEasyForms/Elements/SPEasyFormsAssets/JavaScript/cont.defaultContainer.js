/*
 * SPEasyForms.containerCollection.defaultFormContainer - object representing the OOB SharePoint form.
 *
 * @requires jQuery.SPEasyForms.2015.01.01 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;

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
