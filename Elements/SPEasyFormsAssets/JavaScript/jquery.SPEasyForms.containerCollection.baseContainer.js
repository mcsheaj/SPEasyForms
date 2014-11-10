/*
 * SPEasyForms.sharePointFieldRows - This abstract container implements all 
 * of the editor functionality for any container type comprised of one or more 
 * groups of fields (which I imagine is all containers).  It implements everything 
 * but the transform function.
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
    // This abstract container implements all of the editor functionality for any
    // container type comprised of one or more groups of fields (which I imagine
    // is all containers).  It implements everything but the transform function.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.baseContainer = {

        fieldCollectionsDlgTitle: "Enter the names of the field collections, one per line",
        fieldCollectionsDlgPrompt: "Field Collection Names (one per line):",

        /*********************************************************************
         * Convert the layout to an editor for any container containing one or
         * more field collections.
         *
         * @param {object} options = {
         *     parentId {string} - the id of the outer div for the container
         *     index {string} - one up index of the container, use to create unique ids
         *     rows [object] - array of objects representing rows in the form
         *     layout {object} - object representing the configuration for this container
         * }
         *********************************************************************/
        toEditor: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var parent = opt.id;
            var index = opt.index;
            var layout = opt.currentContainerLayout;
            var result = [];

            $.each(layout.fieldCollections, function(idx, fieldCollection) {
                var tableId = "spEasyFormsSortableFields" + index + "" + idx;
                var table = "";

                $.each(fieldCollection.fields, function(fieldIdx, field) {
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
                    table += containerCollection.createFieldRow(opt);
                    result.push(field.fieldInternalName);
                });

                opt.trs = table;
                opt.id = tableId;
                opt.name = fieldCollection.name;
                opt.tableIndex = idx;
                table = containerCollection.createFieldCollection(opt);
                $("#" + parent).append(table);
            });

            this.wireDialogEvents(opt);

            var header = this.fieldCollectionsDlgTitle;
            var prompt = this.fieldCollectionsDlgPrompt;
            if ($("#" + parent + "AddFieldCollections").length === 0) {
                $("#" + parent + "Delete").parent().prepend(
                    '<button id="' + parent +
                    'AddFieldCollections" title="Add Field Collections" ' +
                    'class="speasyforms-containerbtn">Add Field Collections</button>');

                $('#' + parent + 'AddFieldCollections').button({
                    icons: {
                        primary: "ui-icon-plusthick"
                    },
                    text: false
                }).click(function() {
                    $("#addFieldCollectionNames2").val("");
                    $("#addFieldCollectionsContainerId").val(index);
                    $("#addFieldCollectionsToContainerDialog").attr("title", header);
                    $("label[for='addFieldCollectionNames2']").text(prompt);
                    $("#addFieldCollectionsToContainerDialog").dialog('open');
                    return false;
                });
            }

            return result;
        },

        /*********************************************************************
         * Convert the editor back to a layout.
         *
         * @returns {object} - the layout
         *********************************************************************/
        toLayout: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                containerType: opt.containerType,
                index: $(opt.container).attr("data-containerIndex"),
                fieldCollections: []
            };
            var tables = $(opt.container).find("table.speasyforms-sortablefields");
            $.each(tables, function(index, table) {
                var fieldCollection = {
                    name: $(table).prev().
                    find("h3.speasyforms-sortablefields").text()
                };
                fieldCollection.fields = [];
                var trs = $(table).find("tr:not(:first)");
                $.each(trs, function(idx, tr) {
                    var tds = $(tr).find("td");
                    fieldCollection.fields.push({
                        fieldInternalName: $(tds[1]).text()
                    });
                });
                result.fieldCollections.push(fieldCollection);
            });
            return result;
        },

        /*********************************************************************
         * Launch the settings dialog for this container.
         *********************************************************************/
        settings: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#addFieldCollectionNames").val("");
            this.wireDialogEvents(opt);
            $("#addMultiGroupContainerDialog").attr("title", this.fieldCollectionsDlgTitle);
            $("label[for='addFieldCollectionNames']").text(this.fieldCollectionsDlgPrompt);
            $("#addMultiGroupContainerDialog").dialog("open");
        },

        /*********************************************************************
         * Wire the initial configuration and add field collection dialogs for this
         * container.
         *********************************************************************/
        wireDialogEvents: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var configureTabsOpts = {
                width: 450,
                modal: true,
                buttons: {
                    "Ok": function() {
                        if ($("#addFieldCollectionNames").val().length > 0) {
                            var groupNames = $("#addFieldCollectionNames").val().split('\n');
                            var newLayout = {
                                containerType: $("#addMultiGroupContainerType").val(),
                                fieldCollections: []
                            };
                            $.each($(groupNames), function(idx, name) {
                                if (name.trim().length > 0) {
                                    newLayout.fieldCollections.push({
                                        name: name,
                                        fields: []
                                    });
                                }
                            });
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
                            opt.currentConfig.layout.def.push(newLayout);
                            $.spEasyForms.configManager.set(opt);
                            containerCollection.toEditor(opt);
                            $("#addMultiGroupContainerDialog").dialog("close");
                        } else {
                            $("#addMultiGroupContainerError").html(
                                "* You must enter at least one tab name.");
                        }
                        return false;
                    },
                    "Cancel": function() {
                        $("#addMultiGroupContainerDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false
            };

            $("#addMultiGroupContainerDialog").dialog(configureTabsOpts);

            var addTabsOpts = {
                width: 450,
                modal: true,
                buttons: {
                    "Ok": function() {
                        if ($("#addFieldCollectionNames2").val().length > 0) {
                            var tabNames = $("#addFieldCollectionNames2").val().split('\n');
                            var index = $("#addFieldCollectionsContainerId").val();
                            var nextFieldCollectionIndex = $("#spEasyFormsContainer" +
                                index +
                                " table.speasyforms-sortablefields").length;
                            $.each(tabNames, function(idx, name) {
                                opt.trs = "";
                                opt.id = "spEasyFormsSortableFields" + index +
                                    "" + nextFieldCollectionIndex++;
                                opt.name = name;
                                opt.tableIndex = idx;
                                var table = containerCollection.createFieldCollection(opt);
                                $("#spEasyFormsContainer" + index).append(table);
                            });
                            opt.currentConfig = containerCollection.toConfig(opt);
                            $.spEasyForms.configManager.set(opt);
                            containerCollection.toEditor(opt);
                            $("#addFieldCollectionsToContainerDialog").dialog("close");
                        } else {
                            $("#addFieldCollectionsToContainerDialogError").html(
                                "* You must enter at least one field collection name.");
                        }
                        return false;
                    },
                    "Cancel": function() {
                        $("#addFieldCollectionsToContainerDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false
            };

            $("#addFieldCollectionsToContainerDialog").dialog(addTabsOpts);
        }
    };

})(spefjQuery);
