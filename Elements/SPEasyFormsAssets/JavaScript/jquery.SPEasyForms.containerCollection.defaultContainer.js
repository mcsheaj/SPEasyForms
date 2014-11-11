/*
 * SPEasyForms.containerCollection.defaultFormContainer - object representing the OOB SharePoint form.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
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
        
        transform: function() {
            return [];
        },
        
        toEditor: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var table = "";
            $(".ms-formtable tr").remove();
            $.each(containerCollection.rows, function(fieldIdx, row) {
                if ($.inArray(fieldIdx, opt.fieldsInUse) < 0) {
                    var tmp = containerCollection.createFieldRow({
                        row: row
                    });
                    if (tmp.indexOf("speasyforms-fieldmissing") < 0) {
                        table += tmp;
                        $(".ms-formtable").append(row.row);
                    }
                }
            });
            $("#" + opt.id).append(containerCollection.createFieldCollection({
                trs: table,
                id: "spEasyFormsFormTable",
                name: "",
                tableIndex: "d"
            }));
        },
        
        toLayout: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            return {
                containerType: this.containerType,
                index: $(opt.container).attr("data-containerIndex")
            };
        }
    };
    var defaultFormContainer = $.spEasyForms.defaultFormContainer;
    containerCollection.containerImplementations.defaultForm = defaultFormContainer;

})(spefjQuery);
