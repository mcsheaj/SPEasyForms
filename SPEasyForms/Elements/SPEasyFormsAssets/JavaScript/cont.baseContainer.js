/*
 * SPEasyForms.containerCollection.baseContainer - This abstract container implements all 
 * of the editor functionality for any container type comprised of one or more 
 * groups of fields (which I imagine is all containers).  It implements everything 
 * but the transform function.
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
                if (!fieldCollection.containerType) {
                    fieldCollection.containerType = "FieldCollection";
                }
                opt.currentContainerLayout = fieldCollection;
                opt.currentContainerParent = currentContainerList;

                var implementation = $.spEasyForms.utilities.jsCase(fieldCollection.containerType);
                if (implementation in containerCollection.containerImplementations) {
                    opt.impl = containerCollection.containerImplementations[implementation];
                    opt.currentContainer = containerCollection.appendContainer(opt);
                    fieldCollection.index = opt.currentContainer.attr("data-containerindex");
                    if (typeof (opt.impl.toEditor) === 'function') {
                        opt.currentContainerParent = opt.currentContainer;
                        var tmp = opt.impl.toEditor(opt);
                        $.merge(result, tmp);
                    }
                }
            });

            this.wireDialogEvents(opt);

            if (!opt.verbose) {
                $(".speasyforms-panel .speasyforms-fieldmissing").hide();
            }

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

            var groupNames;
            var containerSettingsOpts = {
                width: 500,
                modal: true,
                buttons: {
                    "Ok": function () {
                        if ($("#settingsContainerId").val().length === 0) {
                            var newLayout = {
                                name: $("#settingsContainerName").val(),
                                containerType: $("#settingsContainerType").val(),
                                index: $.spEasyForms.containerCollection.nextContainerIndex++,
                                fieldCollections: []
                            };
                            if (!newLayout.name) {
                                newLayout.name = newLayout.containerType;
                            }

                            groupNames = $("#settingsCollectionNames").val().split('\n');
                            $.each($(groupNames), function (idx, name) {
                                if (name.trim().length > 0) {
                                    newLayout.fieldCollections.push({
                                        name: name,
                                        containerType: "FieldCollection",
                                        index: $.spEasyForms.containerCollection.nextContainerIndex++,
                                        fields: []
                                    });
                                }
                            });
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
                            opt.currentConfig.layout.def.push(newLayout);
                            $.spEasyForms.configManager.set(opt);

                            opt.currentContainerLayout = newLayout;
                            opt.currentContainerParent = $(".speasyforms-panel").children("ol.speasyforms-nestedsortable");

                            var name = $.spEasyForms.utilities.jsCase(newLayout.containerType);
                            if (name in containerCollection.containerImplementations) {
                                opt.impl = containerCollection.containerImplementations[name];
                                opt.currentContainer = containerCollection.appendContainer(opt);
                                newLayout.index = opt.currentContainer.attr("data-containerindex");
                                if (typeof (opt.impl.toEditor) === 'function') {
                                    opt.impl.toEditor(opt);
                                }
                            }
                        }
                        else {
                            var index = $("#settingsContainerId").val();
                            var container = $("#spEasyFormsContainer" + index);
                            if ($("#settingsContainerName").val().length > 0) {
                                opt.currentContainerLayout.name = $("#settingsContainerName").val();
                                if (opt.currentContainerLayout.name.length === 0) {
                                    opt.currentContainerLayout.name = opt.currentContainerLayout.containerType;
                                }
                                container.attr("data-containername", opt.currentContainerLayout.name);
                                container.find(".speasyforms-itemtitle:first").text(opt.currentContainerLayout.name);
                                if (opt.currentContainerLayout.name !== opt.currentContainerLayout.containerType) {
                                    container.find(".speasyforms-itemtype:first").text(opt.currentContainerLayout.containerType);
                                }
                            }
                            groupNames = $("#settingsCollectionNames").val().split('\n');
                            $.each($(groupNames), function (idx, name) {
                                if (name.trim().length > 0) {
                                    opt.currentContainerLayout = {
                                        name: name.trim(),
                                        containerType: "FieldCollection",
                                        index: $.spEasyForms.containerCollection.nextContainerIndex++,
                                        fields: []
                                    };
                                    var table = containerCollection.createFieldCollection(opt);
                                    if (container.find("ol").length === 0) {
                                        container.append("<ol>");
                                    }
                                    opt.currentContainerParent = container.children("ol");
                                    opt.impl = $.spEasyForms.fieldCollection;
                                    var newItem = containerCollection.appendContainer(opt);
                                    newItem.find(".speasyforms-itemtitle").html(opt.currentContainerLayout.name);
                                    if (opt.currentContainerLayout.name !== opt.currentContainerLayout.containerType) {
                                        newItem.find(".speasyforms-itemtype").html("&nbsp;[" + opt.currentContainerLayout.containerType + "]");
                                    }
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
                        if ($.spEasyForms.isSettingsPage(opt)) {
                            opt.rowInfo.row.find("td.ms-formbody").prepend(
                                "<div data-transformAdded='true'>&nbsp;</div>");
                        }
                        var text = tdh.find("nobr").html();
                        if (typeof (text) === "undefined") {
                            text = tdh.text();
                        }
                        opt.rowInfo.row.find("td.ms-formbody").prepend(
                            "<div><nobr data-transformAdded='true' class='speasyforms-columnheader'>" + text + "</nobr></div>");
                        tdh.attr("data-transformHidden", "true").hide();
                        opt.rowInfo.row.attr("data-headerontop", "true");
                    }
                    else {
                        opt.rowInfo.row.find("h3.ms-standardheader, span.ms-h3").removeClass("ms-standardheader").removeClass("ms-h3").addClass("speasyforms-columnsheader");
                        opt.rowInfo.row.find(".ms-formlabel").removeClass("ms-formlabel").addClass("speasyforms-columnheader");
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
                var impl = containerCollection.containerImplementations[name];
                if (typeof (impl.transform) === "function") {
                    opt.currentContainerLayout = opt.fieldCollection;
                    var div = $("<div/>", {
                        "class": "speasyforms-container",
                        "data-containerindex": opt.currentContainerLayout.index,
                        "data-containertype": opt.currentContainerLayout.containerType,
                        "data-containername": opt.currentContainerLayout.name
                    });
                    opt.parentElement.append(div);
                    opt.currentContainerParent = div;
                    $.merge(opt.result, impl.transform(opt));
                }
            }
        }
    };
})(spefjQuery);

