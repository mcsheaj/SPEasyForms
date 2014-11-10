/*
 * SPEasyForms.sharePointFieldRows - object to hold and manage all containers.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, SPClientForms */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Compound container representing the array of containers for a layout. This
    // container handles the layout for the default form, and also controls when
    // the other containers transform, draw editors, or convert editors back to
    // layouts, including the visibility rule collection.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.containerCollection = {
        initialized: false,
        containerImplementations: {},
        hiddenObjects: {},
        rowCache: {},

        /*********************************************************************
         * Transform the OOB form by looping through each layout part and calling
         * the appropriate implementation to transform that part.
         *
         * @param {object} options - {
         *     rows: {obect} - map of field internal names to a structured break down
         *         of form rows, including the jQuery object representing the actual tr.
         * }
         *********************************************************************/
        transform: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var fieldsInUse = [];

            this.initializeRows(opt);

            // if it looks like a form, apply transforms
            if (Object.keys(containerCollection.rows).length > 0) {
                $("#spEasyFormsContainersPre").remove();
                $("#spEasyFormsContainersPost").remove();

                $('<div id="spEasyFormsContainersPre"></div>').insertBefore(
                    "table.ms-formtable");
                $('<div id="spEasyFormsContainersPost"></div>').insertAfter(
                    "table.ms-formtable");

                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                opt.prepend = true;
                $.each(opt.currentConfig.layout.def, function(index, layout) {
                    var implementation = $.spEasyForms.utilities.jsCase(layout.containerType);
                    if (implementation in containerCollection.containerImplementations) {
                        var impl = containerCollection.containerImplementations[implementation];
                        if(typeof(impl.transform) === 'function') {
                            opt.index = index;
                            opt.currentContainerLayout = layout;
                            opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");                            
                            $.merge(fieldsInUse, impl.transform(opt));
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

                if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                    $.spEasyForms.visibilityRuleCollection.transform(opt);
                    $.spEasyForms.adapterCollection.transform(opt);
                }

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
                });

                this.highlightValidationErrors(opt);

            }

            return fieldsInUse;
        },

        /*********************************************************************
         * Convert a layout to an editor properties panel by looping through each
         * layout part and calling the appropriate implementation's toEditor function.
         *
         * @param {object} options - {
         *     rows: {obect} - map of field internal names to a structured break down
         *         of form rows, including the jQuery object representing the actual tr.
         *         If ommitted, call the current lists edit form and parse it to get rows.
         * }
         *********************************************************************/
        toEditor: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            this.initializeRows(opt);

            // draw the editor properties panel
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            $("td.speasyforms-sortablecontainers").parent().remove();
            this.initContainers(opt);

            // wire buttons, click events, and sorting events
            this.wireContainerEvents(opt);
            if (!this.initialized) {
                this.wireButtonEvents(opt);
                this.wireDialogEvents(opt);
                this.initConditionalFieldChoices(opt);
            }
            $("#spEasyFormsOuterDiv").show();
            this.transform(opt);

            $.spEasyForms.visibilityRuleCollection.toEditor(opt);
            $.spEasyForms.adapterCollection.toEditor(opt);
            this.initializeHiddenObjects(opt);

            $(".speasyforms-dblclickdialog").dblclick(function() {
                opt.dialogType = $(this).parent().attr("data-dialogtype");
                opt.fieldName = $(this).parent().attr("data-fieldname");
                if(opt.fieldName in containerCollection.rows) {
                    opt.spFieldType = containerCollection.rows[opt.fieldName].spFieldType;
                }
                else {
                    opt.spFieldType = opt.fieldName;
                }
                if (opt.dialogType === "visibility") {
                    $.spEasyForms.visibilityRuleCollection.launchDialog(opt);
                } else if (opt.dialogType === "adapter") {
                    $.spEasyForms.adapterCollection.launchDialog(opt);
                }
            });

            this.initialized = true;
        },

        /*********************************************************************
         * Convert a an editor properties panel back to a layout, by looping through each
         * editor and calling the appropriate implementation's toLayout function.
         *
         * @returns {object} - the layout
         *********************************************************************/
        toConfig: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var containers = $("td.speasyforms-sortablecontainers");
            var result = $.spEasyForms.configManager.get(opt);
            result.layout = {
                def: []
            };
            $.each(containers, function(idx, container) {
                var type = $(container).find("input[type='hidden'][id$='Hidden']").val();
                var impl = type[0].toLowerCase() + type.substring(1);
                if (impl in containerCollection.containerImplementations) {
                        opt.container = container;
                        opt.containerType = type;
                        if (impl in containerCollection.containerImplementations) {
                            result.layout.def.push(
                                containerCollection.containerImplementations[impl].toLayout(opt));
                        }
                }
            });
            return result;
        },

        /*********************************************************************
         * Called on submit.  Overridden from core.js to allow containers to
         * perform actions on submit (like highlight tabs with validation errors
         * and select the first tab with validation errors).
         *
         * @returns {bool} - true if the submit should proceed, false if it should
         *     be cancelled.
         *********************************************************************/
        preSaveItem: function() {
            var opt = $.extend({}, $.spEasyForms.defaults, {});
            var result = true;

            var hasValidationErrors = false;
            if (typeof(SPClientForms) !== 'undefined' &&
                typeof(SPClientForms.ClientFormManager) !== 'undefined' &&
                typeof(SPClientForms.ClientFormManager.SubmitClientForm) === "function") {
                hasValidationErrors = SPClientForms.ClientFormManager.SubmitClientForm('WPQ2');
            }
            
            result = result && $.spEasyForms.adapterCollection.preSaveItem(opt);
            if (hasValidationErrors) {
                result = result && this.highlightValidationErrors(opt);
            }

            return result && !hasValidationErrors;
        },

        highlightValidationErrors: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = true;
            var config = $.spEasyForms.configManager.get(opt);
            $.each(config.layout.def, function(index, current) {
                var containerType = current.containerType[0].toLowerCase() +
                    current.containerType.substring(1);
                if (containerType in containerCollection.containerImplementations) {
                    var impl = containerCollection.containerImplementations[containerType];
                    if(typeof(impl.preSaveItem) === 'function') {
                        opt.index = index;
                        result = result && impl.preSaveItem(opt);
                    }
                }
            });
            return result;
        },

        /*********************************************************************
         * Loop through the layouts and call the implementation's toEditor function.
         *
         * @returns {object} - an array of all internal field names that are already
         *     on one of the editors.
         *********************************************************************/
        initContainers: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var fieldsInUse = [];
            var defaultFormContainerId;
            $.each(opt.currentConfig.layout.def, function(index, layout) {
                opt.id = "spEasyFormsContainer" + index;
                opt.title = layout.containerType;
                opt.currentContainerLayout = layout;
                opt.containerIndex = (layout.index !== undefined ? layout.index : index);
                containerCollection.appendContainer(opt);
                if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                    var implementation = layout.containerType[0].toLowerCase() +
                        layout.containerType.substring(1);
                    if (implementation in containerCollection.containerImplementations) {
                        var impl = containerCollection.containerImplementations[implementation];
                        if(typeof(impl.toEditor) === 'function') {
                            opt.index = index;
                            opt.currentContainerLayout = layout;
                            var tmp = impl.toEditor(opt);
                            $.merge(fieldsInUse, tmp);
                        }
                    }
                }
                else {
                    defaultFormContainerId = opt.id;
                }
                if (!opt.verbose) {
                    $("#" + opt.id).find("tr.speasyforms-fieldmissing").hide();
                }
            });
            opt.id = defaultFormContainerId;
            opt.fieldsInUse = fieldsInUse;
            $.spEasyForms.defaultFormContainer.toEditor(opt);
            return fieldsInUse;
        },
        
        initConditionalFieldChoices: function() {
            
            var fields = {};
            $.each(Object.keys(containerCollection.rows), function(idx, name) {
                fields[containerCollection.rows[name].displayName] = containerCollection.rows[name];
            });
            $.each(Object.keys(fields).sort(), function(idx, displayName) {
                var name = fields[displayName].internalName;
                if(name !== $.spEasyForms.defaultFormContainer.containerType) {
                    $(".speasyforms-conditionalfield").append(
                        '<option value="' + name + '">' + displayName + '</option>');
                }
            });
            
            $.each(Object.keys($.spEasyForms.visibilityRuleCollection.stateHandlers), function(idx, name) {
                $("#addVisibilityRuleState").append("<option>" + $.spEasyForms.utilities.titleCase(name) + "</option>");
            });
            
            $.each(Object.keys($.spEasyForms.visibilityRuleCollection.comparisonOperators), function(idx, name) {
                $(".speasyforms-conditionaltype").append("<option>" + $.spEasyForms.utilities.titleCase(name) + "</option>");
            });
            
            $(".speasyforms-conditionalvalue[value='']").not(":first").parent().hide();
        },
        
        initializeRows: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var currentContentType = $("#spEasyFormsContentTypeSelect").val();
            if(window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
            }
            else if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                if (!containerCollection.currentCt || containerCollection.currentCt !== currentContentType) {
                    containerCollection.currentCt = currentContentType;
                    if(containerCollection.currentCt in containerCollection.rowCache) {
                        containerCollection.rows = containerCollection.rowCache[containerCollection.currentCt];
                    }
                }
                else {
                    containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
                }
                if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                    var currentListId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
                    if (currentListId !== undefined && currentListId.length > 0) {
                        var formText = "";
                        if ($.spEasyForms.sharePointContext.formCache !== undefined) {
                            formText = $.spEasyForms.sharePointContext.formCache;
                        } else {
                            $.ajax({
                                async: false,
                                cache: false,
                                url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/listform.aspx") +
                                    "?PageType=6&ListId=" +
                                    currentListId + 
                                    ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") + 
                                    "&RootFolder=",
                                complete: function(xData) {
                                    formText = xData.responseText;
                                }
                            });
                        }
        
                        opt.input = $(formText);
                        containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
                        $.each(containerCollection.rows, function(fieldIdx, row) {
                            var td = row.row.find("td.ms-formbody");
                            td.html("");
                            $('.ms-formtable').append(row.row);
                        });
                    }
                }
            }
            // undo changes to the row that might have been applied by the transforms,
            // since they may have moved.
            $.each(containerCollection.rows, function(i, currentRow) {
                currentRow.row.find("*[data-transformAdded='true']").remove();
                currentRow.row.find("*[data-transformHidden='true']").
                attr("data-transformHidden", "false").show();
            });
            containerCollection.rowCache[containerCollection.currentCt] = containerCollection.rows;
            return containerCollection.rows;
        },
        
        initializeHiddenObjects: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!this.initialized && $("td.speasyforms-sortablecontainers").length > 2) {
                $("td.speasyforms-sortablecontainers").each(function() {
                    if(!(opt.verbose && $(this).find(".speasyforms-fieldmissing").length !== 0)) {
                        var containerIndex = $(this).attr("data-containerIndex");
                        containerCollection.hiddenObjects[containerIndex] = {
                            primaryIndex: containerIndex
                        };
                        $(this).find(".speasyforms-sortablefields").hide();
                    }
                });
            } else {
                // hide any objects that were hidden when we started
                var i;
                var keys = Object.keys(this.hiddenObjects);
                for (i = 0; i < keys.length; i++) {
                    var obj = this.hiddenObjects[keys[i]];
                    if(obj && "primaryIndex" in obj) {
                        var container = $("td[data-containerIndex='" + obj.primaryIndex + "']");
                        if ("secondaryIndex" in obj) {
                            $("td[data-containerIndex='" + obj.primaryIndex + "']").find(
                                "table[data-tableIndex='" + obj.secondaryIndex + "']").hide();
                        } else {
                            container.find(".speasyforms-sortablefields").hide();
                        }
                    }
                }
            }
            
        },
        
        /*********************************************************************
         * Wire the container sorting, clicking, and editor button events.
         *********************************************************************/
        wireContainerEvents: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            
            var top = 0;
            // make the field rows in the editor sortable
            $("tbody.speasyforms-sortablefields").sortable({
                connectWith: ".speasyforms-sortablefields",
                items: "> tr:not(:first)",
                helper: "clone",
                zIndex: 990,
                start: function() {
                    top = $("div.speasyforms-panel").scrollTop();
                },
                stop: function() {
                    $("div.speasyforms-panel").scrollTop(top);
                },
                update: function(event) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                    return false;
                }
            });

            // make the containers in the editor sortable
            $("tbody.speasyforms-sortablecontainers").sortable({
                connectWith: ".speasyforms-sortablecontainers",
                items: "> tr",
                helper: "clone",
                zIndex: 90,
                update: function(event) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                },
                start: function(event, ui) {
                    ui.placeholder.height("100px");
                }
            });

            // make the field tables individually collapsible
            $("h3.speasyforms-sortablefields").dblclick(function(e) {
                if (e.handled !== true) {
                    var i, j;
                    if ($(this).next().length === 0) {
                        $(this).closest("table").next().toggle();
                        i = $(this).closest("table").closest("td").attr("data-containerIndex");
                        j = $(this).closest("table").next().attr("data-tableIndex");
                        if ($(this).closest("table").next().css("display") === "none") {
                            containerCollection.hiddenObjects[i + "_" + j] = {
                                primaryIndex: i,
                                secondaryIndex: j
                            };
                        } else if (i + "_" + j in containerCollection.hiddenObjects) {
                            delete containerCollection.hiddenObjects[i + "_" + j];
                        }
                    } else {
                        $(this).next().toggle();
                        i = $(this).closest("td").attr("data-containerIndex");
                        j = $(this).next().attr("data-tableIndex");
                        if ($(this).next().css("display") === "none") {
                            containerCollection.hiddenObjects[i + "_" + j] = {
                                primaryIndex: i,
                                secondaryIndex: j
                            };
                        } else if (i + "_" + j in containerCollection.hiddenObjects) {
                            delete containerCollection.hiddenObjects[i + "_" + j];
                        }
                    }
                    e.handled = true;
                } else {
                    $(this).unbind(e);
                }
                return false;
            });

            // make the containers individually collapsible
            $("td.speasyforms-sortablecontainers").dblclick(function(e) {
                if (e.handled !== true) {
                    $('#' + this.id + ' .speasyforms-sortablefields:not(.speasyforms-hidden):not(.speasyforms-fieldmissing)').toggle();
                    var k = $('#' + this.id).attr("data-containerIndex");
                    if ($('#' + this.id + ' .speasyforms-sortablefields')
                        .css("display") === "none") {
                        containerCollection.hiddenObjects[k] = {
                            primaryIndex: k
                        };
                    } else if (k in containerCollection.hiddenObjects) {
                        delete containerCollection.hiddenObjects[k];
                    }

                    e.handled = true;
                } else {
                    $(this).unbind(e);
                }
            });

            // wire the edit buttons for each field collection
            $(".speasyforms-editfields").button({
                icons: {
                    primary: "ui-icon-gear"
                },
                text: false
            }).click(function() {
                var headerId = $(this).closest("tr").find(
                    "h3.speasyforms-sortablefields")[0].id;
                $("#fieldCollectionName").val($("#" + headerId).text());
                $("#editFieldCollectionContainerId").val(headerId);
                $('#editFieldCollectionDialog').dialog('open');
                return false;
            });

            // wire the delete buttons for each field collection
            $(".speasyforms-deletefields").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function() {
                $(this).closest("div").remove();
                opt.currentConfig = containerCollection.toConfig(opt);
                $.spEasyForms.configManager.set(opt);
                containerCollection.toEditor(opt);
                return false;
            });
        },

        /*********************************************************************
         * Wire the top/bottom button bar events.
         *********************************************************************/
        wireButtonEvents: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // wire the save button
            $("#spEasyFormsSaveButton").click(function(event) {
                if($("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return;
                    
                if (!event.handled) {
                    $.spEasyForms.configManager.save(opt);
                    event.handled = true;
                }
                return false;
            });

            // wire the cancel button
            $("#spEasyFormsCancelButton").click(function(event) {
                if (!event.handled) {
                    window.location.href = $.spEasyForms.utilities.getRequestParameters(opt).Source;
                }
                return false;
            });

            // wire the add button
            $("#spEasyFormsAddButton").click(function(event) {
               if (!event.handled) {
                    $("#containerType").val("");
                    $("#chooseContainerError").html("");
                    $("#chooseContainerDialog").dialog("open");
                    event.handled = true;
                }
                return false;
            });
            
            // wire the undo button
            $("#spEasyFormsUndoButton").click(function(event) {
                if($("#spEasyFormsUndoButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return;
                    
                if(!event.handled) {
                    var oldConfig = JSON.stringify($.spEasyForms.configManager.get(opt), null, 4);
                    var newConfig = $.spEasyForms.configManager.undoBuffer.pop();
                    $.spEasyForms.configManager.redoBuffer.push(oldConfig);
                    $("#spEasyFormsRedoButton img").removeClass("speasyforms-buttonimgdisabled");
                    $("#spEasyFormsRedoButton").removeClass("speasyforms-buttontextdisabled");
                    
                    opt.currentConfig = $.spEasyForms.utilities.parseJSON(newConfig);
                    $.spEasyForms.configManager.set(opt);
                    newConfig = $.spEasyForms.configManager.undoBuffer.pop();
                    if($.spEasyForms.configManager.undoBuffer.length === 0) {
                        $("#spEasyFormsUndoButton img").addClass("speasyforms-buttonimgdisabled");
                        $("#spEasyFormsUndoButton").addClass("speasyforms-buttontextdisabled");
                    }
                    
                    containerCollection.toEditor(opt);
                    event.handled = true;
                }                
            });
            
            // wire the redo button
            $("#spEasyFormsRedoButton").click(function(event) {
                if($("#spEasyFormsRedoButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return;
                    
                if(!event.handled) {
                    opt.currentConfig = $.spEasyForms.utilities.parseJSON($.spEasyForms.configManager.redoBuffer.pop());
                    $.spEasyForms.configManager.set(opt);
            
                    if($.spEasyForms.configManager.redoBuffer.length === 0) {
                        $("#spEasyFormsRedoButton img").addClass("speasyforms-buttonimgdisabled");
                        $("#spEasyFormsRedoButton").addClass("speasyforms-buttontextdisabled");
                    }
                    
                    containerCollection.toEditor(opt);
                    event.handled = true;
                }
            });            

            // wire the expand buttons
            $("#spEasyFormsExpandButton").click(function(event) {
                if (!event.handled) {
                    containerCollection.hiddenObjects = [];
                    if(opt.verbose) {
                        $('.speasyforms-sortablefields:not(.speasyforms-hidden)').show();
                    }
                    else {
                        $('.speasyforms-sortablefields:not(.speasyforms-hidden):not(.speasyforms-fieldmissing)').show();
                    }
                    event.handled = true;
                }
                return false;
            });

            // wire the collapse buttons
            $("#spEasyFormsCollapseButton").click(function() {
                $("td.speasyforms-sortablecontainers").each(function(event) {
                    if (!event.handled) {
                        var containerIndex = $(this).attr("data-containerIndex");
                        containerCollection.hiddenObjects[containerIndex] = {
                            primaryIndex: containerIndex
                        };
                        event.handled = true;
                    }
                });
                $('.speasyforms-sortablefields').hide();
                return false;
            });
            
            // wire the form button
            $("#spEasyFormsFormButton").click(function(event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-form").show();
                    containerCollection.transform(opt);
                }
                return false;
            });

            // wire the visibility button
            $("#spEasyFormsConditionalVisibilityButton").click(function(event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-visibility").show();
                }
                return false;
            });

            // wire the adapters button
            $("#spEasyFormsFieldAdaptersButton").click(function(event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-adapters").show();
                }
                return false;
            });

            // wire the clear cache button
            $("#spEasyFormsClearCacheButton").click(function () {
                $.spEasyForms.clearCachedContext(opt);
                window.location.reload();
                return false;
            });

            // wire the verbose button
            $("#spEasyFormsVerboseButton").click(function () {
                if (opt.verbose) {
                    window.location.href = window.location.href.replace("&spEasyFormsVerbose=true", "");
                } else {
                    window.location.href = window.location.href + "&spEasyFormsVerbose=true";
                }
                return false;
            });

            // wire the about button
            $("#spEasyFormsAboutButton").click(function (event) {
                if (!event.handled) {
                    $("#spEasyFormsAboutDialog").dialog("open");
                }
                return false;
            });
            
            // wire the help button
            $("#spEasyFormsHelpLink").click(function () {
                var helpFile = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2014.01.o/Help/speasyforms_help.aspx");
                window.open(helpFile);
                return false;
            });

            // wire the export button
            $("#spEasyFormsExportLink").click(function() {
                if($("#spEasyFormsExportButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return false;

                var configFileName = $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/SiteAssets") + 
                    "/spef-layout-" + $.spEasyForms.sharePointContext.getCurrentListId(opt).replace("{", "")
                    .replace("}", "") + ".txt";
                window.open(configFileName);
            });
            
            // wire the import button
            $("#spEasyFormsImportButton").click(function() {
                if($("#spEasyFormsImportButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return;
                    
                $("#importedJson").val("");
                $("#importConfigurationDialog").dialog('open');
            });

            // wire the async button
            $("#spEasyFormsInitAsyncBtn").button({
                icons: {
                    primary: "ui-icon-shuffle"
                },
                label: (opt.initAsync ? 'Initialize Synchronously' : 'Initialize Asynchronously')
            }).click(function() {
                if (opt.initAsync) {
                    window.location.href = window.location.href.replace("&spEasyFormsAsync=true", "");
                } else {
                    window.location.href = window.location.href + "&spEasyFormsAsync=false";
                }
                return false;
            });
        },

        /*********************************************************************
         * Wire the dialog events.
         *********************************************************************/
        wireDialogEvents: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            
            var aboutOpts = {
                modal: true,
                buttons: {
                    "OK": function() {
                        $("#spEasyFormsAboutDialog").dialog("close");
                    }
                },
                autoOpen: false,
                width: 800
            };
            $("#spEasyFormsAboutDialog").dialog(aboutOpts);

            // dialog for adding a new container
            var chooseContainerOpts = {
                modal: true,
                buttons: {
                    "Add": function() {
                        if ($("#containerType").val().length > 0) {
                            $("#chooseContainerDialog").dialog("close");
                            var implname = $("#containerType").val()[0].toLowerCase() +
                                $("#containerType").val().substring(1);
                            if (implname in containerCollection.containerImplementations) {
                                var impl = containerCollection.containerImplementations[implname];
                                opt.containerType = $("#containerType").val();
                                $("#addMultiGroupContainerType").val(opt.containerType);
                                impl.settings(opt);
                            }
                        } else {
                            $("#chooseContainerError").html(
                                "* You must select a container type.");
                        }
                    },
                    "Cancel": function() {
                        $("#chooseContainerDialog").dialog("close");
                    }
                },
                autoOpen: false
            };
            $("#containerType").find('option').remove();
            $("#containerType").append($('<option>', {
                text: "",
                value: ""
            }));
            $.each(containerCollection.containerImplementations, function(index) {
                var containerType = containerCollection.containerImplementations[index].containerType;
                if(containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                    $("#containerType").append($('<option>', {
                        text: containerType,
                        value: containerType
                    }));
                }
            });
            $("#chooseContainerDialog").dialog(chooseContainerOpts);

            // dialog to edit the name of a field collection
            var editFieldsTableOpts = {
                modal: true,
                buttons: {
                    "Save": function() {
                        $("#" + $("#editFieldCollectionContainerId").val()).
                        html($("#fieldCollectionName").val());
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        containerCollection.toEditor(opt);
                        $("#editFieldCollectionDialog").dialog("close");
                    },
                    "Cancel": function() {
                        $("#editFieldCollectionDialog").dialog("close");
                    }
                },
                autoOpen: false
            };
            $('#editFieldCollectionDialog').dialog(editFieldsTableOpts);

            // save confirmation dialog
            var importOpts = {
                modal: true,
                width: 630,
                buttons: {
                    "Ok": function() {
                        opt.currentConfig = $.spEasyForms.utilities.parseJSON($("#importedJson").val());
                        $.spEasyForms.configManager.set(opt);
                        containerCollection.toEditor(opt);
                        $("#importConfigurationDialog").dialog("close");
                    }
                },
                autoOpen: false
            };
            $('#importConfigurationDialog').dialog(importOpts);
        },

        /*********************************************************************
         * Utility function to create a uniform container div for a given editor.
         *
         * @param {object} options - {
         *    id: {string} - the element id to be used for the container td
         *    containerIndex: {string} - an immutable container index that is
         *        assigned to a container the first time it is created
         *        (generally containers.length, but it really doesn't matter as
         *        long as it doesn't change); this is needed to uniquely
         *         identify containers as they move around, for instance for the
         *        hiddenObjects array.
         *    title: {string} - usually the container implementation, it's
         *        displayed as the header for the editor.
         *    containerLayout: {object} - the layout configuration instance
         *        of the container.
         * }
         *********************************************************************/
        appendContainer: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#" + opt.id).parent().remove();

            var tr = "<tr>" +
                "<td class='speasyforms-sortablecontainers' id='" + opt.id +
                "' data-containerIndex='" + opt.containerIndex + "'>" +
                "<table class='speasyforms-fieldstitle'><tr>" +
                "<td class='speasyforms-headercell'><h1>" + opt.title +
                "</h1></td><td class='speasyforms-buttoncell' align='right'>";

            if (opt.title !== $.spEasyForms.defaultFormContainer.containerType) {
                tr += "<button id='" + opt.id +
                    "Delete' class='speasyforms-containerbtn'>Delete</button></td>";
            }

            tr += "</tr></table><input type='hidden' name='" + opt.id +
                "Hidden' id='" + opt.id + "Hidden' value='" +
                opt.currentContainerLayout.containerType + "' /></td></tr>";

            var result = $("#spEasyFormsContainerTable").append(tr);

            if (opt.title !== $.spEasyForms.defaultFormContainer.containerType) {
                $("#" + opt.id + "Delete").button({
                    icons: {
                        primary: "ui-icon-closethick"
                    },
                    text: false
                }).click(function() {
                    $(this).closest("td.speasyforms-sortablecontainers").remove();
                    opt.currentConfig = $.spEasyForms.options.currentConfig = containerCollection.toConfig(opt);
                    $.spEasyForms.configManager.set(opt);
                    containerCollection.toEditor(opt);
                });
            }

            return result;
        },

        /*********************************************************************
         * Utility function to construct the HTML for a single row in a field collections
         * table.
         *
         * @param {object} options - {
         *    row: {string} - the row object representing the field, as returned
         *        by spFieldRows.init(opt).
         * }
         *********************************************************************/
        createFieldRow: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var r = opt.row;
            var klass = "speasyforms-sortablefields";
            if (r.fieldMissing) {
                klass += " speasyforms-fieldmissing";
            }
            var tr = "<tr class='" + klass + "'" +
                "title='"+(r.fieldMissing ? "This field was not found in the form and may have been deleted." : "")+"'>" +
                "<td class='" + klass + "'>" + r.displayName + "</td>" +
                "<td class='" + klass + " speasyforms-hidden' style='display:none'>" + r.internalName + "</td>" +
                "<td class='" + klass + "'>" + r.spFieldType + "</td>" +
                "</tr>";
            return tr;
        },

        /*********************************************************************
         * Utility function to construct the HTML the table representing a field
         * group.
         *
         * @param {object} options - {
         *    trs {string} - the HTML for all of the table rows for the table
         *    name {string} - the name of the field collection used for the header
         *    id {string} - the element id for the table
         *    tableIndex {string} - an immutable table index that is assigned
         *        to a table the first time it is created (generally tables.length
         *        for the tables within the current editor/container, but it really
         *        doesn't matter as long as it doesn't change); this is needed
         *        to uniquely identify tables as their containers move around,
         *        for instance for the hiddenObjects array.
         * }
         *********************************************************************/
        createFieldCollection: function(options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var name = (opt.name !== undefined ? opt.name : "");
            var id = (opt.id !== undefined ?
                opt.id : Math.floor(Math.random() * 1000) + 1);

            var result = "<h3 id='" + id +
                "Header' class='speasyforms-sortablefields'>" + name + "</h3>";

            if (opt.id !== "spEasyFormsFormTable") {
                result = "<table class='speasyforms-fieldsheader'><tr><td>" +
                    result + "</td><td align='right'>";
                result += "<button id='" + opt.id +
                    "Edit' class='speasyforms-containerbtn speasyforms-editfields'>" +
                    "Edit Settings</button><button id='" + opt.id +
                    "Delete' class='speasyforms-containerbtn  " +
                    "speasyforms-deletefields'>Delete</button>";
                result += "</td></tr></table>";
            }

            result += "<table id='" + id +
                "' class='speasyforms-sortablefields' " +
                "cellPadding='0' cellSpacing='3' data-tableIndex='" +
                opt.tableIndex + "'>" +
                "<tbody class='speasyforms-sortablefields'><tr>" +
                "<th class='speasyforms-name'>Display Name</th>" +
                "<th class='speasyforms-name speasyforms-hidden' style='display:none'>Internal Name</th>" +
                "<th class='speasyforms-name'>Field Type</th></tr>" + opt.trs +
                "</tbody></table>";

            return "<div id='" + opt.id +
                "Div' class='speasyforms-sortablefields'>" + result + "</div>";
        }
    };
    var containerCollection = $.spEasyForms.containerCollection;
    
})(spefjQuery);
