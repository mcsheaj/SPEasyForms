/*
 * SPEasyForms.containerCollection.baseContainer - This abstract container implements all 
 * of the editor functionality for any container type comprised of one or more 
 * groups of fields (which I imagine is all containers).  It implements everything 
 * but the transform function.
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2015 Joe McShea
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
         *     currentContainer - the jQuery node to which this container should add itself
         *     currentContainerLayout {object} - object representing the configuration for this container
         * }
         *********************************************************************/
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];

            var currentContainerList = $("<ol>");
            opt.currentContainer.append(currentContainerList);
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                if (!fieldCollection.name) {
                    fieldCollection.name = fieldCollection.containerType;
                }
                opt.currentContainerLayout = fieldCollection;
                opt.currentContainerParent = currentContainerList;
                opt.currentContainer = containerCollection.appendContainer(opt);
                fieldCollection.index = opt.currentContainer.attr("data-containerindex");

                var implementation = $.spEasyForms.utilities.jsCase(fieldCollection.containerType);
                if (implementation in containerCollection.containerImplementations) {
                    var impl = containerCollection.containerImplementations[implementation];
                    if (typeof (impl.toEditor) === 'function') {
                        opt.currentContainerParent = opt.currentContainer;
                        var tmp = impl.toEditor(opt);
                        $.merge(opt.fieldsInUse, tmp);
                    }
                }
            });

            this.wireDialogEvents(opt);

            return result;
        },

        /*********************************************************************
         * Convert the editor back to a layout.
         *
         * @returns {object} - the layout
         *********************************************************************/
        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                name: $(opt.container).attr("data-containername"),
                containerType: $(opt.container).attr("data-containertype"),
                index: $(opt.container).attr("data-containerindex"),
                fieldCollections: []
            };
            var containers = $(opt.container).children("ol").children("li");
            $.each(containers, function (index, current) {
                var child = {
                    name: $(current).attr("data-containername"),
                    containerType: $(current).attr("data-containertype"),
                    index: $(current).attr("data-containerindex"),
                    fields: []
                };

                var impl = $.spEasyForms.utilities.jsCase($(current).attr("data-containertype"));
                if (impl in containerCollection.containerImplementations) {
                    opt.container = current;
                    child = containerCollection.containerImplementations[impl].toLayout(opt);
                }

                result.fieldCollections.push(child);
            });
            return result;
        },

        /*********************************************************************
         * Launch the settings dialog for this container.
         *********************************************************************/
        settings: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            this.wireDialogEvents(opt);

            $("#settingsCollectionNames").show().val("");
            $("#settingsCollectionNames").attr("title", this.fieldCollectionsDlgTitle);
            $("label[for='settingsCollectionNames']").show().text(this.fieldCollectionsDlgPrompt);

            if (!opt.currentContainerLayout) {
                // setup for new 
                $("#containerSettingsDialog").dialog("option", "title", "Add Container");
                $("#settingsContainerName").val("");
                $("#settingsContainerId").val("");
                $("#settingsContainerType").val(opt.containerType);
            }
            else {
                // or setup for edit
                $("#containerSettingsDialog").dialog("option", "title", "Edit Container");
                $("#settingsContainerName").val(opt.currentContainerLayout.name);
                $("#settingsContainerId").val(opt.currentContainerLayout.index);
                $("#settingsContainerType").val(opt.currentContainerLayout.containerType);
                if (opt.currentContainerLayout.containerType === "FieldCollection") {
                    $("#settingsCollectionNames").hide();
                    $("label[for='settingsCollectionNames']").hide();
                }
            }

            $("#containerSettingsDialog").dialog("open");
        },

        /*********************************************************************
         * Wire the initial configuration and add field collection dialogs for this
         * container.
         *********************************************************************/
        wireDialogEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var containerSettingsOpts = {
                width: 450,
                modal: true,
                buttons: {
                    "Ok": function () {
                        if ($("#settingsContainerId").val().length === 0) {
                            var newLayout = {
                                name: $("#settingsContainerName").val(),
                                containerType: $("#settingsContainerType").val(),
                                fieldCollections: []
                            };
                            if (!newLayout.name) {
                                newLayout.name = newLayout.containerType;
                            }

                            var groupNames = $("#settingsCollectionNames").val().split('\n');
                            $.each($(groupNames), function (idx, name) {
                                if (name.trim().length > 0) {
                                    newLayout.fieldCollections.push({
                                        name: name,
                                        containerType: "FieldCollection",
                                        fields: []
                                    });
                                }
                            });
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
                            opt.currentConfig.layout.def.push(newLayout);
                            $.spEasyForms.configManager.set(opt);

                            opt.currentContainerLayout = newLayout;
                            opt.currentContainerParent = $(".speasyforms-panel ol.speasyforms-nestedsortable");
                            opt.currentContainer = containerCollection.appendContainer(opt);
                            newLayout.index = opt.currentContainer.attr("data-containerindex");

                            var name = $.spEasyForms.utilities.jsCase(newLayout.containerType);
                            if (name in containerCollection.containerImplementations) {
                                var impl = containerCollection.containerImplementations[name];
                                if (typeof (impl.toEditor) === 'function') {
                                    impl.toEditor(opt);
                                }
                            }
                        }
                        else {
                            var index = $("#settingsContainerId").val();
                            var container = $("#spEasyFormsContainer" + index);
                            if ($("#settingsContainerName").val().length > 0) {
                                container.attr("data-containername", $("#settingsContainerName").val());
                                container.find(".speasyforms-itemtitle:first").text($("#settingsContainerName").val());
                            }
                            var groupNames = $("#settingsCollectionNames").val().split('\n');
                            $.each($(groupNames), function (idx, name) {
                                if (name.trim().length > 0) {
                                    opt.currentContainerLayout = {
                                        name: name.trim(),
                                        containerType: "FieldCollection",
                                        fields: []
                                    };
                                    var table = containerCollection.createFieldCollection(opt);
                                    if (container.find("ol").length === 0) {
                                        container.append("<ol>");
                                    }
                                    opt.currentContainerParent = container.find("ol");
                                    var newItem = containerCollection.appendContainer(opt);
                                    newItem.find(".speasyforms-itemtitle").html(opt.currentContainerLayout.name);
                                    newItem.find(".speasyforms-nestedsortable-content").append(table);
                                }
                            });
                            opt.currentConfig = containerCollection.toConfig(opt);
                            $.spEasyForms.configManager.set(opt);
                        }

                        opt.refresh = $.spEasyForms.refresh.form;
                        containerCollection.toEditor(opt);
                        $("#containerSettingsDialog").dialog("close");
                        return false;
                    },
                    "Cancel": function () {
                        $("#containerSettingsDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false
            };

            $("#containerSettingsDialog").dialog(containerSettingsOpts);
        },

        appendRow: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = false;
            if (opt.rowInfo && !opt.rowInfo.fieldMissing) {
                var rtePresent = opt.rowInfo.row.find("iframe[id$='TextField_iframe']").length > 0;
                if (!rtePresent) {
                    opt.table.append(opt.rowInfo.row);
                    if (opt.headerOnTop) {
                        var tdh = opt.rowInfo.row.find("td.ms-formlabel");
                        if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") >= 0) {
                            opt.rowInfo.row.find("td.ms-formbody").prepend(
                                "<div data-transformAdded='true'>&nbsp;</div>");
                        }
                        if (tdh.html() === "Content Type") {
                            opt.rowInfo.row.find("td.ms-formbody").prepend(
                                "<h3 data-transformAdded='true' class='ms-standardheader'><nobr>" + tdh.html() + "</nobr></h3>");
                        } else {
                            opt.rowInfo.row.find("td.ms-formbody").prepend(
                                "<h3 data-transformAdded='true' class='ms-standardheader'><nobr>" + tdh.html() + "</nobr></h3>");
                        }
                        tdh.attr("data-transformHidden", "true").hide();
                    }
                    result = true;
                }
            }
            return result;
        },

        /*
        parentElement: 
        collectionIndex:
        collectionType:
        fieldCollection:
        tableClass:
        headerOnTop:
        */
        appendFieldCollection: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!opt.fieldCollection.containerType) {
                opt.fieldCollection.containerType = "FieldCollection";
            }
            if (!opt.fieldCollection.name) {
                opt.fieldCollection.name = opt.fieldCollection.containerType;
            }
            var name = $.spEasyForms.utilities.jsCase(opt.fieldCollection.containerType);
            if (name in containerCollection.containerImplementations) {
                impl = containerCollection.containerImplementations[name];
                if (typeof (impl.transform) === "function") {
                    opt.currentContainerLayout = opt.fieldCollection;
                    opt.currentContainerParent = opt.parentElement;
                    $.merge(opt.result, impl.transform(opt));
                }
            }
        }
    };

})(spefjQuery);

