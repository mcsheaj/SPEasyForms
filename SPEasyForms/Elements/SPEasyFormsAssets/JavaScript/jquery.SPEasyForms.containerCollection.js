/*
 * SPEasyForms.containerCollection - object to hold and manage all containers.
 *
 * @requires jQuery.SPEasyForms.2015.01.beta 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, SPClientForms */
(function ($, undefined) {

    $.spEasyForms.refresh = {
        form: 1,
        visibility: 2,
        adapters: 4,
        containers: 8,
        panel: 16,
        all: 31
    };
    var refresh = $.spEasyForms.refresh;

    ////////////////////////////////////////////////////////////////////////////
    // Compound container representing the array of containers for a layout. This
    // container handles the layout for the default form, and also controls when
    // the other containers transform, draw editors, or convert editors back to
    // layouts, including the visibility rule collection.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.containerCollection = {
        initialized: false,
        nextContainerIndex: 1,
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
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var fieldsInUse = [];

            this.initRows(opt);

            // if it looks like a form, apply transforms
            if (Object.keys(containerCollection.rows).length > 0) {
                $("#spEasyFormsContainersPre").remove();
                $("#spEasyFormsContainersPost").remove();

                var pre = $("<div/>", { "id": "spEasyFormsContainersPre" });
                var post = $("<div/>", { "id": "spEasyFormsContainersPost" });

                pre.insertBefore("table.ms-formtable");
                post.insertAfter("table.ms-formtable");

                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                opt.prepend = true;
                var name, impl;
                $.each(opt.currentConfig.layout.def, function (index, layout) {
                    name = $.spEasyForms.utilities.jsCase(layout.containerType);
                    if (name in containerCollection.containerImplementations) {
                        impl = containerCollection.containerImplementations[name];
                        var parent = (opt.prepend ? pre : post);
                        if (layout.containerType !== $.spEasyForms.defaultFormContainer.containerType) {
                            var div = $("<div/>", {
                                "class": "speasyforms-container",
                                "data-containerindex": layout.index,
                                "data-containertype": layout.containerType,
                                "data-containername": layout.name
                            });
                            parent.append(div);
                            opt.currentContainerParent = div;
                        }
                        else {
                            opt.currentContainerParent = parent;
                        }
                        if (typeof (impl.transform) === "function") {
                            opt.currentContainerLayout = layout;
                            $.merge(fieldsInUse, impl.transform(opt));
                        }
                        if (layout.containerType === $.spEasyForms.defaultFormContainer.containerType) {
                            opt.prepend = false;
                        }
                    }
                });

                if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                    $.spEasyForms.visibilityRuleCollection.transform(opt);
                    $.spEasyForms.adapterCollection.transform(opt);
                }

                this.postTransform(opt);
            }

            return fieldsInUse;
        },

        /*********************************************************************
         * Call each containers postTransform method, after all containers have
         * completed transform, to perform final steps like hiding empty containers
         * or parts of containers. This has to be done post transform, because
         * visibility rules may have made a container/part 'empty' after it was
         * transformed.
         *********************************************************************/
        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            function postTransformHelper(layout) {
                if (layout.fieldCollections) {
                    $.each(layout.fieldCollections, function (i, l) {
                        postTransformHelper(l);
                    });
                }

                var name = $.spEasyForms.utilities.jsCase(layout.containerType);
                if (name in containerCollection.containerImplementations) {
                    var impl = containerCollection.containerImplementations[name];
                    if (typeof (impl.postTransform) === 'function') {
                        opt.currentContainerLayout = layout;
                        impl.postTransform(opt);
                    }
                }
            }

            $.each(opt.currentConfig.layout.def, function (index, layout) {
                postTransformHelper(layout);
            });
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
        /* jshint -W016 */
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            this.initRows(opt);

            if (!this.initialized) {
                this.wireRibbonButtonEvents(opt);
                this.wireDialogEvents(opt);
                this.initConditionalFieldChoices(opt);
            }

            if (!this.initialized || opt.refresh & refresh.panel) {
                $("ol.speasyforms-nestedsortable").empty();

                this.initContainers(opt);

                if (this.nextContainerIndex > 2) {
                    var item = $("ol.speasyforms-nestedsortable").find('li');
                    var statusIcon = item.children(".speasyforms-menudiv").find('.speasyforms-nestedsortable-status');
                    item.children('ol').hide();
                    item.children('.speasyforms-nestedsortable-content').hide();
                    statusIcon.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
                }
            }

            if (!this.initialized || opt.refresh & refresh.form) {
                this.transform(opt);
                this.wireContainerEvents(opt);
            }

            if (!this.initialized || opt.refresh & refresh.visibility) {
                $.spEasyForms.visibilityRuleCollection.toEditor(opt);
            }

            if (!this.initialized || opt.refresh & refresh.adapters) {
                $.spEasyForms.adapterCollection.toEditor(opt);
            }

            $(".speasyforms-panel").show();
            $(".speasyforms-content").show();

            this.initialized = true;
        },
        /* jshint -W016 */

        /*********************************************************************
         * Convert the editor properties panel back to a layout, by looping through each
         * editor and calling the appropriate implementation's toLayout function.
         *
         * @returns {object} - the layout
         *********************************************************************/
        toConfig: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var containers = $("ol.speasyforms-nestedsortable").children();
            var result = $.spEasyForms.configManager.get(opt);
            result.layout = {
                def: []
            };
            $.each(containers, function (idx, container) {
                var type = $(container).attr("data-containertype");
                var impl = $.spEasyForms.utilities.jsCase(type);
                if (impl in containerCollection.containerImplementations) {
                    opt.container = container;
                    result.layout.def.push(
                        containerCollection.containerImplementations[impl].toLayout(opt));
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
        preSaveItem: function () {
            var opt = $.extend({}, $.spEasyForms.defaults);

            if (!$.spEasyForms.adapterCollection.preSaveItem(opt)) {
                this.highlightValidationErrors(opt);
                return false;
            }

            if (typeof (SPClientForms) !== 'undefined' &&
                typeof (SPClientForms.ClientFormManager) !== 'undefined' &&
                typeof (SPClientForms.ClientFormManager.SubmitClientForm) === "function") {
                if (SPClientForms.ClientFormManager.SubmitClientForm('WPQ2')) {
                    this.highlightValidationErrors(opt);
                    return false;
                }
            }

            return true;
        },


        /*********************************************************************
         * Helper to iterate containers and call their preSaveItem methods.
         *********************************************************************/
        highlightValidationErrors: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = true;
            var config = $.spEasyForms.configManager.get(opt);
            var containerType, impl;

            function highlightValidationErrorsHelper(layout) {
                var r = true;
                if (layout.fieldCollections) {
                    $.each(layout.fieldCollections, function (i, l) {
                        r = highlightValidationErrorsHelper(l) && r;
                    });
                }

                containerType = $.spEasyForms.utilities.jsCase(layout.containerType);
                if (containerType in containerCollection.containerImplementations) {
                    impl = containerCollection.containerImplementations[containerType];
                    if (typeof (impl.preSaveItem) === 'function') {
                        opt.currentContainerLayout = layout;
                        result = impl.preSaveItem(opt) && r;
                    }
                }
                return r;
            }

            $.each(config.layout.def, function (index, current) {
                containerType = $.spEasyForms.utilities.jsCase(current.containerType);
                if (containerType in containerCollection.containerImplementations) {
                    result = highlightValidationErrorsHelper(current) && result;
                }
            });

            return result;
        },

        /*********************************************************************
         * This adds a row to the ms-formtable for each field that would appear
         * in a real edit form.
         *********************************************************************/
        initRows: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var currentContentType = $("#spEasyFormsContentTypeSelect").val();
            if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
            }
            else if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                if (!containerCollection.currentCt || containerCollection.currentCt !== currentContentType) {
                    containerCollection.currentCt = currentContentType;
                    if (containerCollection.currentCt in containerCollection.initRows) {
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
                                complete: function (xData) {
                                    formText = xData.responseText;
                                }
                            });
                        }

                        opt.input = $(formText);
                        containerCollection.rows = $.spEasyForms.sharePointFieldRows.init(opt);
                        $.each(containerCollection.rows, function (fieldIdx, row) {
                            var td = row.row.find("td.ms-formbody");
                            td.html("");
                            $('.ms-formtable').append(row.row);
                        });
                    }
                }
            }
            // undo changes to the row that might have been applied by the transforms,
            // since they may have moved.
            $.each(containerCollection.rows, function (i, current) {
                current.row.find("*[data-transformAdded='true']").remove();
                current.row.find("*[data-transformHidden='true']").attr("data-transformHidden", "false").show();
                current.row.find(".speasyforms-columnheader").removeClass("speasyforms-columnheader").addClass("ms-h3").addClass("ms-standardheader");
                if (current.fieldMissing) {
                    current.row.detach();
                }
                else {
                    current.row.appendTo($("table.ms-formtable"));
                }
            });
            containerCollection.rowCache[containerCollection.currentCt] = containerCollection.rows;
            return containerCollection.rows;
        },

        /*********************************************************************
         * Loop through the layouts and call the implementation's toEditor function.
         *
         * @returns {object} - an array of all internal field names that are already
         *     on one of the editors.
         *********************************************************************/
        initContainers: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var defaultFormContainer;
            var defaultFormLayout;

            opt.fieldsInUse = [];
            $.each(opt.currentConfig.layout.def, function (index, layout) {
                if (!layout.name) {
                    layout.name = layout.containerType;
                }
                opt.currentContainerLayout = layout;
                opt.currentContainerParent = $(".speasyforms-panel ol.speasyforms-nestedsortable");
                opt.impl = containerCollection.containerImplementations[$.spEasyForms.utilities.jsCase(opt.currentContainerLayout.containerType)];
                opt.currentContainer = containerCollection.appendContainer(opt);
                layout.index = opt.currentContainer.attr("data-containerindex");

                if (layout.containerType === $.spEasyForms.defaultFormContainer.containerType) {
                    defaultFormContainer = opt.currentContainer;
                    defaultFormLayout = opt.currentContainerLayout;
                }
                else {
                    containerCollection.initContainer(opt);
                }
            });

            if (!opt.verbose) {
                $("#" + opt.id).find("tr.speasyforms-fieldmissing").hide();
            }

            opt.currentContainer = defaultFormContainer;
            opt.currentContainerLayout = defaultFormLayout;
            $.spEasyForms.defaultFormContainer.toEditor(opt);

            return opt.fieldsInUse;
        },

        initContainer: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var name = $.spEasyForms.utilities.jsCase(opt.currentContainerLayout.containerType);
            if (name in containerCollection.containerImplementations) {
                var impl = containerCollection.containerImplementations[name];
                if (typeof (impl.toEditor) === 'function') {
                    var tmp = impl.toEditor(opt);
                    $.merge(opt.fieldsInUse, tmp);
                }
            }
        },

        // TBD move this to visibility rules collection
        initConditionalFieldChoices: function () {
            var fields = {};
            $.each(Object.keys(containerCollection.rows), function (idx, name) {
                fields[containerCollection.rows[name].displayName] = containerCollection.rows[name];
            });
            $.each(Object.keys(fields).sort(), function (idx, displayName) {
                var name = fields[displayName].internalName;
                if (name !== $.spEasyForms.defaultFormContainer.containerType) {
                    $(".speasyforms-conditionalfield").append(
                        '<option value="' + name + '">' + displayName + '</option>');
                }
            });

            $.each(Object.keys($.spEasyForms.visibilityRuleCollection.stateHandlers), function (idx, name) {
                $("#addVisibilityRuleState").append("<option>" + $.spEasyForms.utilities.titleCase(name) + "</option>");
            });

            $.each(Object.keys($.spEasyForms.visibilityRuleCollection.comparisonOperators), function (idx, name) {
                $(".speasyforms-conditionaltype").append("<option>" + $.spEasyForms.utilities.titleCase(name) + "</option>");
            });

            $(".speasyforms-conditionalvalue[value='']").not(":first").parent().hide();
        },

        /*********************************************************************
         * Wire the container sorting, clicking, and editor button events.
         *********************************************************************/
        wireContainerEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // make the field rows in the editor sortable
            $("tbody.speasyforms-sortablefields").sortable({
                connectWith: ".speasyforms-sortablefields",
                items: "> tr:not(:first)",
                helper: "clone",
                placeholder: "speasyforms-placeholder",
                zIndex: 990,
                update: function (event) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = refresh.form;
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                }
            });

            // make the containers in the editor sortable
            $('ol.speasyforms-nestedsortable').nestedSortable({
                forcePlaceholderSize: true,
                handle: 'div',
                helper: 'clone',
                items: 'li',
                opacity: 0.4,
                placeholder: 'speasyforms-placeholder',
                revert: 250,
                tabSize: 20,
                tolerance: 'pointer',
                toleranceElement: '> div',
                maxLevels: opt.maxNestingLevels,
                isTree: true,
                expandOnHover: 700,
                startCollapsed: false,
                branchClass: "speasyforms-nestedsortable-branch",
                collapsedClass: "speasyforms-nestedsortable-collapsed",
                disableNestingClass: "speasyforms-nestedsortable-no-nesting",
                errorClass: "speasyforms-nestedsortable-error",
                expandedClass: "speasyforms-nestedsortable-expanded",
                hoveringClass: "speasyforms-nestedsortable-hovering",
                leafClass: "speasyforms-nestedsortable-leaf",
                disabledClass: "speasyforms-nestedsortable-disabled",
                isAllowed: function (placeholder, parent, current) {
                    if (current.hasClass("speasyforms-nestedsortable-nomove")) {
                        return false;
                    }
                    else if (parent && parent.hasClass("speasyforms-nestedsortable-nochildren")) {
                        return false;
                    }
                    else if (!parent && current.hasClass("speasyforms-nestedsortable-needsparent")) {
                        return false;
                    }
                    else if (parent && current.hasClass("speasyforms-nestedsortable-noparent") && !parent.hasClass("speasyforms-nestedsortable")) {
                        return false;
                    }
                    return true;
                },
                update: function (event) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = refresh.form;
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                }
            });

            $('.speasyforms-nestedsortable-delete').attr('title', 'Click to delete container.');
            $('.speasyforms-nestedsortable-edit').attr('title', 'Click to edit container.');
            $('td.speasyforms-icon-visibility').attr('title', 'Click to add or modify visibility rules.');
            $('td.speasyforms-icon-adapter').attr('title', 'Click to add or remove a field control adapter.');

            if (!this.initialized) {
                // make the containers individually collapsible
                var toggleContainer = function () {
                    var item = $(this).closest('li');
                    var statusIcon = item.children(".speasyforms-menudiv").find('.speasyforms-nestedsortable-status');
                    item.children('ol').toggle();
                    item.children('.speasyforms-nestedsortable-content').toggle();
                    if (statusIcon.hasClass('ui-icon-triangle-1-s')) {
                        statusIcon.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
                    }
                    else {
                        statusIcon.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
                    }
                };

                var toggleContainerAndChildren = function () {
                    var item = $(this).closest('li');
                    var statusIcon = item.find('.speasyforms-nestedsortable-status');
                    if (item.children(".speasyforms-menudiv").find('.speasyforms-nestedsortable-status').hasClass('ui-icon-triangle-1-s')) {
                        statusIcon.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
                        item.find('ol').hide();
                        item.find('.speasyforms-nestedsortable-content').hide();
                    }
                    else {
                        item.find('ol').show();
                        item.find('.speasyforms-nestedsortable-content').show();
                        statusIcon.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
                    }
                };

                $("ol.speasyforms-nestedsortable").on("click", "span.speasyforms-nestedsortable-status", toggleContainer);
                $("ol.speasyforms-nestedsortable").on("dblclick", "div.speasyforms-menudiv", toggleContainerAndChildren);

                // wire the edit buttons for each field collection
                $("ol.speasyforms-nestedsortable").on("click", "span.speasyforms-nestedsortable-edit", function () {
                    var container = $(this).closest("li");
                    var index = container.attr("data-containerindex");
                    opt.currentConfig = containerCollection.toConfig(opt);

                    var findContainerById = function (containerArray) {
                        var result;
                        $.each($(containerArray), function (idx, layout) {
                            if (layout.index === index) {
                                result = layout;
                                return false;
                            }
                            result = findContainerById(layout.fieldCollections);
                            if (typeof (result) !== 'undefined') {
                                return false;
                            }
                        });
                        return result;
                    };
                    opt.currentContainerLayout = findContainerById(opt.currentConfig.layout.def);

                    var implname = $.spEasyForms.utilities.jsCase(opt.currentContainerLayout.containerType);
                    if (implname in containerCollection.containerImplementations) {
                        var impl = containerCollection.containerImplementations[implname];
                        impl.settings(opt);
                    }
                    else {
                        $.spEasyForms.baseContainer.settings(opt);
                    }
                });

                // wire the delete buttons for each field collection
                $("ol.speasyforms-nestedsortable").on("click", "span.speasyforms-nestedsortable-delete", function () {
                    $(this).closest("li").find("tr.speasyforms-sortablefields").each(function () {
                        $("li.speasyforms-nestedsortable-defaultform table.speasyforms-sortablefields").append(this);
                    });
                    $(this).closest("li").remove();
                    opt.currentConfig = containerCollection.toConfig(opt);
                    $.spEasyForms.configManager.set(opt);
                    opt.refresh = refresh.form;
                    containerCollection.toEditor(opt);
                });

                $("ol.speasyforms-nestedsortable").on("click", "td.speasyforms-icon-visibility", function () {
                    opt.currentConfig = $.spEasyForms.configManager.get(opt);
                    opt.fieldName = $(this).closest("tr").find(".speasyforms-fieldinternal").text();
                    $.spEasyForms.visibilityRuleCollection.launchDialog(opt);
                    $(".tabs-min").hide();
                    $("#tabs-min-visibility").show();
                });

                $("#tabs-min-visibility").on("dblclick", "td.speasyforms-staticrules", function () {
                    opt.currentConfig = $.spEasyForms.configManager.get(opt);
                    opt.fieldName = $(this).closest("tr").children(".speasyforms-hidden").text();
                    $.spEasyForms.visibilityRuleCollection.launchDialog(opt);
                });

                $("ol.speasyforms-nestedsortable").on("click", "td.speasyforms-icon-adapter", function () {
                    opt.currentConfig = $.spEasyForms.configManager.get(opt);
                    opt.fieldName = $(this).closest("tr").find(".speasyforms-fieldinternal").text();
                    opt.spFieldType = $(this).closest("tr").find(".speasyforms-fieldtype").text();
                    $.spEasyForms.adapterCollection.launchDialog(opt);
                    $(".tabs-min").hide();
                    $("#tabs-min-adapters").show();
                });

                $("#tabs-min-adapters").on("dblclick", "td.speasyforms-adapter-static", function () {
                    opt.currentConfig = $.spEasyForms.configManager.get(opt);
                    opt.fieldName = $(this).closest("tr").children(".speasyforms-hidden").text();
                    opt.spFieldType = containerCollection.rows[opt.fieldName].spFieldType;
                    $.spEasyForms.adapterCollection.launchDialog(opt);
                });
            }
        },

        /*********************************************************************
         * Wire the button events for the ribbon buttons.
         *********************************************************************/
        wireRibbonButtonEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // wire the save button
            $("#spEasyFormsSaveButton").click(function (event) {
                if ($("#spEasyFormsSaveButton").hasClass("speasyforms-disabled"))
                    return;

                if (!event.handled) {
                    $.spEasyForms.configManager.save(opt);
                    event.handled = true;
                }
                return false;
            });

            // wire the cancel button
            $("#spEasyFormsCancelButton").click(function (event) {
                if (!event.handled) {
                    window.location.href = $.spEasyForms.utilities.getRequestParameters(opt).Source;
                }
                return false;
            });

            // wire the add button
            $("#spEasyFormsAddButton").click(function (event) {
                if (!event.handled) {
                    $("#containerType").val("");
                    $("#chooseContainerError").html("");
                    $("#chooseContainerDialog").dialog("open");
                    event.handled = true;
                }
                return false;
            });

            // wire the undo button
            $("#spEasyFormsUndoButton").click(function (event) {
                if ($("#spEasyFormsUndoButton").hasClass("speasyforms-disabled"))
                    return;

                if (!event.handled) {
                    var oldConfig = JSON.stringify($.spEasyForms.configManager.get(opt), null, 4);
                    var newConfig = $.spEasyForms.configManager.undoBuffer.pop();
                    $.spEasyForms.configManager.redoBuffer.push(oldConfig);
                    $("#spEasyFormsRedoButton").removeClass("speasyforms-disabled").css({ opacity: 1.0 });

                    opt.currentConfig = $.spEasyForms.utilities.parseJSON(newConfig);
                    $.spEasyForms.configManager.set(opt);
                    newConfig = $.spEasyForms.configManager.undoBuffer.pop();
                    if ($.spEasyForms.configManager.undoBuffer.length === 0) {
                        $("#spEasyFormsUndoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                    }

                    opt.refresh = refresh.all;
                    containerCollection.toEditor(opt);
                    event.handled = true;
                }
            });

            // wire the redo button
            $("#spEasyFormsRedoButton").click(function (event) {
                if ($("#spEasyFormsRedoButton").hasClass("speasyforms-disabled"))
                    return;

                if (!event.handled) {
                    opt.currentConfig = $.spEasyForms.utilities.parseJSON($.spEasyForms.configManager.redoBuffer.pop());
                    $.spEasyForms.configManager.set(opt);

                    if ($.spEasyForms.configManager.redoBuffer.length === 0) {
                        $("#spEasyFormsRedoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                    }

                    opt.refresh = refresh.all;
                    containerCollection.toEditor(opt);
                    event.handled = true;
                }
            });

            // wire the expand buttons
            $("#spEasyFormsExpandButton").click(function () {
                var item = $("ol.speasyforms-nestedsortable").find('li');
                var statusIcon = item.children(".speasyforms-menudiv").find('.speasyforms-nestedsortable-status');
                item.children('ol').show();
                item.children('.speasyforms-nestedsortable-content').show();
                statusIcon.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
            });

            // wire the collapse buttons
            $("#spEasyFormsCollapseButton").click(function () {
                var item = $("ol.speasyforms-nestedsortable").find('li');
                var statusIcon = item.children(".speasyforms-menudiv").find('.speasyforms-nestedsortable-status');
                item.children('ol').hide();
                item.children('.speasyforms-nestedsortable-content').hide();
                statusIcon.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
            });

            // wire the form button
            $("#spEasyFormsFormButton").click(function (event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-form").show();
                    containerCollection.transform(opt);
                }
                return false;
            });

            // wire the visibility button
            $("#spEasyFormsConditionalVisibilityButton").click(function (event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-visibility").show();
                }
                return false;
            });

            // wire the adapters button
            $("#spEasyFormsFieldAdaptersButton").click(function (event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-adapters").show();
                }
                return false;
            });

            // wire the settings button
            $("#spEasyFormsSettingsButton").click(function (event) {
                if (!event.handled) {
                    $(".tabs-min").hide();
                    $("#tabs-min-settings").show();
                }
                return false;
            });

            // wire the theme radio buttons
            $("input:radio[name='jqueryuitheme']").change(function () {
                var value = $("input:radio[name='jqueryuitheme']:checked").val();
                if (value === "gallery") {
                    $("#selGalleryTheme").show();
                    $("#inpCustomTheme").hide();
                }
                else if (value === "custom") {
                    $("#inpCustomTheme").show();
                    $("#selGalleryTheme").hide();
                }
                else {
                    $("#inpCustomTheme").hide();
                    $("#selGalleryTheme").hide();
                }
            });

            // wire the theme apply button
            $("#applyThemeButton").button({
                label: "Apply Theme"
            }).click(function (e) {
                e.preventDefault();
                var themeType = $("input:radio[name='jqueryuitheme']:checked").val();
                var theme;
                opt.currentConfig = $.spEasyForms.configManager.get(opt);

                if (themeType === "gallery" && $("#selGalleryTheme").val() !== "none") {
                    theme = $("#selGalleryTheme").val();
                    theme = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/2015.01.beta/Css/jquery-ui-' + theme + '/jquery-ui.css');
                    opt.currentConfig.jQueryUITheme = theme;
                }
                else if (themeType === "custom") {
                    theme = $("#inpCustomTheme").val();
                    opt.currentConfig.jQueryUITheme = theme;
                }
                else {
                    delete opt.currentConfig.jQueryUITheme;
                }
                $.spEasyForms.configManager.set(opt);

                if (theme) {
                    opt.source = theme;
                }
                else {
                    opt.source = opt.jQueryUITheme;
                }
                $("head").append('<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');

                return false;
            });

            var currentGalleryTheme;
            $.each($(opt.jQueryUIGallery), function (idx, item) {
                if (opt.currentConfig.jQueryUITheme && opt.currentConfig.jQueryUITheme.indexOf("/jquery-ui-" + item.toLowerCase() + "/") > 0) {
                    currentGalleryTheme = item;
                }
                $("#selGalleryTheme").append("<option value='" + item.toLowerCase() + "'>" + item + "</option>");
            });

            if (currentGalleryTheme) {
                $("input:radio[value='gallery']").prop("checked", "checked");
                $("#selGalleryTheme").val("smoothness");
                $("#inpCustomTheme").hide();
                $("#selGalleryTheme").show();
            }
            else if (opt.currentConfig.jQueryUITheme) {
                $("#inpCustomTheme").val(opt.currentConfig.jQueryUITheme);
                $("input:radio[value='custom']").prop("checked", "checked");
                $("#inpCustomTheme").show();
                $("#selGalleryTheme").hide();
            }
            else {
                $("input:radio[value='none']").prop("checked", "checked");
                $("#inpCustomTheme").hide();
                $("#selGalleryTheme").hide();
            }

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
                var helpFile = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01.beta/Help/speasyforms_help.aspx");
                window.open(helpFile);
                return false;
            });

            // wire the export button
            $("#spEasyFormsExportLink").click(function () {
                if ($("#spEasyFormsExportButton").hasClass("speasyforms-disabled"))
                    return false;

                var configFileName = $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/SiteAssets") +
                    "/spef-layout-" + $.spEasyForms.sharePointContext.getCurrentListId(opt).replace("{", "")
                    .replace("}", "") + ".txt";
                window.open(configFileName);
            });

            // wire the import button
            $("#spEasyFormsImportButton").click(function () {
                if ($("#spEasyFormsImportButton").hasClass("speasyforms-disabled"))
                    return;

                $("#importedJson").val("");
                $("#importConfigurationDialog").dialog('open');
            });
        },

        /*********************************************************************
         * Wire the dialog events.
         *********************************************************************/
        wireDialogEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var maxHeight = $(window.top).height() - 50;
            var aboutOpts = {
                modal: true,
                buttons: {
                    "OK": function () {
                        $("#spEasyFormsAboutDialog").dialog("close");
                    }
                },
                autoOpen: false,
                width: 800,
                height: (maxHeight > 900 ? 900 : maxHeight),
                open: function () {
                    var max = $(window.top).height() - 50;
                    $("#spEasyFormsAboutDialog").dialog({ height: (max > 900 ? 900 : max) });
                }
            };
            $("#spEasyFormsAboutDialog").dialog(aboutOpts);

            // dialog for adding a new container
            var chooseContainerOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        if ($("#containerType").val().length > 0) {
                            $("#chooseContainerDialog").dialog("close");
                            var implname = $.spEasyForms.utilities.jsCase($("#containerType").val());
                            if (implname in containerCollection.containerImplementations) {
                                var impl = containerCollection.containerImplementations[implname];
                                opt.containerType = $("#containerType").val();
                                $("#settingsContainerType").val(opt.containerType);
                                impl.settings(opt);
                            }
                        } else {
                            $("#chooseContainerError").html(
                                "* You must select a container type.");
                        }
                    },
                    "Cancel": function () {
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
            $.each(containerCollection.containerImplementations, function (index) {
                var containerType = containerCollection.containerImplementations[index].containerType;
                if (!containerCollection.containerImplementations[index].cannotBeAdded) {
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
                    "Save": function () {
                        $("#" + $("#editFieldCollectionContainerId").val()).
                        html($("#fieldCollectionName").val());
                        opt.currentConfig = containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = refresh.all;
                        containerCollection.toEditor(opt);
                        $("#editFieldCollectionDialog").dialog("close");
                    },
                    "Cancel": function () {
                        $("#editFieldCollectionDialog").dialog("close");
                    }
                },
                autoOpen: false
            };
            $('#editFieldCollectionDialog').dialog(editFieldsTableOpts);

            // save confirmation dialog
            var importOpts = {
                modal: true,
                width: 670,
                buttons: {
                    "Ok": function () {
                        opt.currentConfig = $.spEasyForms.utilities.parseJSON($("#importedJson").val());
                        $.spEasyForms.sharePointContext.fixAdapterListReferences(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = refresh.all;
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
         *    currentContainerLayout {object} - the layout
         *    currentContainerParent: {object} - the jQuery node to which this
         *        container should be attached.
         * }
         *********************************************************************/
        appendContainer: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var template = $("#spEasyFormsTemplates .speasyforms-nestedsortable-container").clone();
            if (!opt.currentContainerLayout.containerType || opt.currentContainerLayout.containerType === "FieldCollection") {
                opt.currentContainerLayout.containerType = "FieldCollection";
                template = $("#spEasyFormsTemplates .speasyforms-nestedsortable-fieldcollection").clone();
            }
            else if (opt.currentContainerLayout.containerType === $.spEasyForms.defaultFormContainer.containerType) {
                template = $("#spEasyFormsTemplates .speasyforms-nestedsortable-defaultform").clone();
            }

            if (opt.impl && opt.impl.noChildren) {
                template.addClass("speasyforms-nestedsortable-nochildren");
            }
            else if (opt.impl && opt.impl.needsParent) {
                template.addClass("speasyforms-nestedsortable-needsparent");
            }
            else if (opt.impl && opt.impl.noParent) {
                template.addClass("speasyforms-nestedsortable-noparent");
            }

            opt.currentContainerParent.append(template);
            template.attr("id", "spEasyFormsContainer" + this.nextContainerIndex);
            template.attr("data-containerindex", this.nextContainerIndex++);
            template.attr("data-containertype", opt.currentContainerLayout.containerType);
            template.attr("data-containername", opt.currentContainerLayout.name);
            template.find(".speasyforms-itemtitle").html(opt.currentContainerLayout.name);
            if (opt.currentContainerLayout.name !== opt.currentContainerLayout.containerType) {
                template.find(".speasyforms-itemtype").html("&nbsp;[" + opt.currentContainerLayout.containerType + "]");
            }

            return template;
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
        createFieldRow: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var r = opt.row;

            var tr = $($("#spEasyFormsTemplates .speasyforms-fieldrowtemplate").clone());

            if (r.fieldMissing) {
                tr.addClass("speasyforms-fieldmissing");
            }

            tr.find(".speasyforms-fieldname").html(r.displayName);
            tr.find(".speasyforms-fieldinternal").html(r.internalName);
            tr.find(".speasyforms-fieldtype").html(r.spFieldType);

            return tr;
        },

        /*********************************************************************
         * Utility function to construct the HTML the table representing a field
         * group.
         *********************************************************************/
        createFieldCollection: function () {
            var result = $("#spEasyFormsTemplates .speasyforms-fieldtabletemplate").clone();
            return result;
        }
    };
    var containerCollection = $.spEasyForms.containerCollection;

})(spefjQuery);
