/*
 * SPEasyForms - modify SharePoint forms using jQuery (i.e. put fields on 
 * tabs, show/hide fields, validate field values, etc.)
 *
 * @version 2014.00.01
 * @requires jQuery v1.8.3 (I intend to test it with later 1.x versions
 *     but have not done so yet)
 * @requires jQuery-ui v1.9.2 (I intend to test it with later 1.x 
 *     versions but have not done so yet)
 * @requires jQuery.SPServices v2014.01 or greater
 * @optional ssw Session Storage Wrapper - Cross Document Transport of 
 *    JavaScript Data; used to cache the context across pages if available 
 *    and options.useCache === true
 * @copyright 2014 Joe McShea 
 * @license under the MIT license: 
 *    http://www.opensource.org/licenses/mit-license.php
 *
 * TBD - make localizable?
 */
(function ($, undefined) {

    // cross-page caching object
    var cache = (typeof (ssw) != 'undefined' ? ssw.get() : undefined);

    // define Object.keys for browsers that don't support it
    if (!Object.keys) {
        Object.keys = function (obj) {
            return $.map(obj, function (v, k) {
                return k;
            });
        };
    }

    ////////////////////////////////////////////////////////////////////////////
    // Main entry point is init.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms = {
        defaults: {
            // use cross-page caching
            useCache: (typeof (ssw) != 'undefined' || typeof (ssw_init) != 'undefined'),
            // the maximum number of webs to cache
            maxWebCache: 6,
            // the maximum number of lists to cache per web
            maxListCache: 10,
            // path to the jquery-ui style sheet
            jQueryUITheme: undefined,
            // path to the spEasyForms style sheet
            css: undefined,
            // selector for an element in a form table row from which row 
            // will be obtained via .closest("tr")
            formBodySelector: "table.ms-formtable td.ms-formbody",
            // regex for capturing field internal name, expects 
            // .match(tr.html(fieldInternalNameRegex)) result in match[1]
            fieldInternalNameRegex: /FieldInternalName=\"([^\"]*)\"/i,
            // regex for capturing field display name, expects 
            // tr.html().match() result in match[1]
            fieldDisplayNameRegex: /FieldName=\"([^\"]*)\"/i,
            // regex for capturing field type, expects tr.html().match() 
            // result in match[1]
            fieldTypeRegex: /FieldType=\"([^\"]*)\"/i,
            // appends a table with a bunch of context info to the page body
            verbose: window.location.href.indexOf('fiddle') >= 0
        },

        /********************************************************************
         * Initialize the library.  If we're on a form
         * that's been configured, apply configured transformations.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        init: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            this.initCacheLibrary(opt);
            this.loadDynamicStyles(opt);
            opt.currentContext = spContext.get(opt);
            opt.rows = spRows.init(opt);
            if (window.location.href.indexOf('SPEasyFormsSettings.aspx') >= 0 ||
                window.location.href.indexOf('fiddle') >= 0) {
                master.toEditor(opt);
            } else {
                master.transform(opt);
            }
            this.appendContext(opt);
            $("#s4-bodyContainer").scrollTop();
            return this;
        },
    
        /********************************************************************
         * Initialize the ssw caching library.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        initCacheLibrary: function(options) {
            if (typeof (cache) === 'undefined' && options.cache !== undefined) {
                cache = options.cache;
            }

            if (typeof (ssw) == 'undefined' && typeof (ssw_init) != 'undefined') {
                ssw_init(window, document);
                if (typeof (cache) === 'undefined') {
                    cache = ssw.get();
                }
            }
        },
        
        /********************************************************************
         * Load the jquery-ui and spEasyForms style sheets.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        loadDynamicStyles: function(options) {
            if(options.jQueryUITheme === undefined) {
                options.jQueryUITheme = _spPageContextInfo.siteServerRelativeUrl + 
                    '/Style Library/SPEasyFormsAssets/2014.00.02/Css/jquery-ui-redmond/jquery-ui.css';
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + options.jQueryUITheme + '">');

            if (options.css === undefined) {
                options.css = _spPageContextInfo.siteServerRelativeUrl +
                    '/Style Library/SPEasyFormsAssets/2014.00.02/Css/speasyforms.css';
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + options.css + '">');
        },

        /*********************************************************************
         * Clear the cross page cache and set any objects retrieved from it
         * to undefined.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        clearCachedContext: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.useCache) {
                cache = {};
                ssw.clear();
            }
        },

        /*********************************************************************
         * Stores the local context variable in cache if options.useCache
         * equals true.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        writeCachedContext: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (typeof (ssw) != 'undefined') {
                var key = "spEasyForms_spContext_" + opt.currentContext.webRelativeUrl;
                if (!(key in cache)) {
                    if (Object.keys(cache).length >= opt.maxWebCache) {
                        ssw.remove(Object.keys(cache)[0]);
                    }
                }
                var obj = {};
                obj[key] = opt.currentContext;
                ssw.add(obj);
            }
        },

        /*********************************************************************
         * Reads the local context variable from cache if options.useCache
         * equals true.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        readCachedContext: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.useCache === true) {
                var key = "spEasyForms_spContext_";
                if (opt.siteUrl) {
                    key += opt.siteUrl;
                }
                return cache[key];
            }
            return undefined;
        },

        /*********************************************************************
         * Append a dump of all of the cached context information to the body
         * of the current page if defaults.verbose equals true.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        appendContext: function () {
            if (spEasyForms.defaults.verbose) {
                $('#outputTable').remove();
                var output = "<table id='outputTable'><tr><td><pre>";
                output += "cache = " + JSON.stringify(cache, null, 4) + "\r\n";
                output += "</pre></td></tr></table>";
                if (window.location.href.indexOf('fiddle') <= 0) {
                    $("#s4-bodyContainer").append(output);
                } else {
                    $("body").append(output);
                }
            }
        }
    };
    var spEasyForms = $.spEasyForms;

    ////////////////////////////////////////////////////////////////////////////
    // Compound container representing the array of containers for a layout. This
    // container handles the layout for the default form, and also controls when
    // the other containers transform, draw editors, or convert editors back to
    // layouts.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.masterContainer = {
        containerType: "masterContainer",
        initialized: false,
        containerImplementations: {},
        hiddenObjects: {},

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
            var opt = $.extend({}, spEasyForms.defaults, options);
            var listctx = spContext.getListContext(opt);
            var fieldsInUse = [];

            // if it looks like a form, apply transforms
            if (Object.keys(opt.rows).length > 0) {
                $("#spEasyFormsContainersPre").remove();
                $("#spEasyFormsContainersPost").remove();

                var currentLayout = this.getLayout(opt);

                $('<div id="spEasyFormsContainersPre"></div>').insertBefore("table.ms-formtable");
                $('<div id="spEasyFormsContainersPost"></div>').insertAfter("table.ms-formtable");

                opt.prepend = true;
                $.each(currentLayout, function (index, layout) {
                    if (layout.containerType != 'DefaultForm') {
                        var implementation = layout.containerType[0].toLowerCase() +
                            layout.containerType.substring(1);

                        opt.index = index;
                        opt.layout = layout;
                        opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");
                        $.merge(fieldsInUse,
                            master.containerImplementations[implementation].transform(opt));
                    } else {
                        opt.prepend = false;
                    }
                });
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
        toEditor: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.listctx = spContext.getListContext(options);

            // get the rows if not passed in
            var currentListId = spContext.getCurrentListId(opt);
            if (opt.rows === undefined || Object.keys(opt.rows).length === 0) {
                if (currentListId !== undefined && currentListId.length > 0) {
                    var context = spContext.get();
                    $.ajax({
                        async: false,
                        cache: false,
                        url: context.webAppUrl + context.webRelativeUrl +
                            "/_layouts/listform.aspx?PageType=6&ListId=" +
                        encodeURIComponent(currentListId).replace('-', '%2D') + "&RootFolder=",
                        complete: function (xData) {
                            opt.input = $(xData.responseText);
                            opt.rows = spRows.init(opt);
                            $.each(opt.rows, function (fieldIdx, row) {
                                $('.ms-formtable').append(row.row);
                            });
                            delete opt.input;
                        }
                    });
                }
            }

            // undo changes to the row that might have been applied by the transforms,
            // since they may have moved.
            $.each(opt.rows, function (i, currentRow) {
                currentRow.row.find("*[data-transformAdded='true']").remove();
                currentRow.row.find("*[data-transformHidden='true']").attr("data-transformHidden", "false").show();
            });

            // draw the editor properties panel
            opt.layout = this.getLayout(opt);
            $("td.speasyforms-sortablecontainers").parent().remove();
            opt.fieldsInUse = this.initContainers(opt);
            this.initDefaultFieldGroup(opt);
            
            // wire buttons, click events, and sorting events
            this.wireContainerEvents(opt);
            if (!this.initialized) {
                this.wireButtonEvents(opt);
                this.wireDialogEvents(opt);
            }
            this.transform(opt);
            $("#spEasyFormsOuterDiv").show();

            // hide any objects that were hidden when we started
            var i;
            var keys = Object.keys(this.hiddenObjects);
            for (i = 0; i < keys.length; i++) {
                var obj = this.hiddenObjects[keys[i]];
                var container = $("td[data-containerIndex='" + obj.primaryIndex + "']");
                if ("secondaryIndex" in obj) {
                    var table = $("table[data-tableIndex='" + obj.secondaryIndex + "']");
                    table.hide();
                }
                else {
                    container.find(".speasyforms-sortablefields").hide();
                }
            }

            this.initialized = true;
        },

        /*********************************************************************
         * Convert a an editor properties panel back to a layout, by looping through each 
         * editor and calling the appropriate implementation's toLayout function.
         *
         * @returns {object} - the layout
         *********************************************************************/        
        toLayout: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var containers = $("td.speasyforms-sortablecontainers");
            var result = [];
            $.each(containers, function (idx, container) {
                var type = $(container).find("input[type='hidden'][id$='Hidden']").val();
                var impl = type[0].toLowerCase() + type.substring(1);
                if (impl in master.containerImplementations) {
                    if (impl != 'defaultForm') {
                        opt.container = container;
                        opt.containerType = type;
                        result.push(
                            master.containerImplementations[impl].toLayout(opt));
                    } else {
                        result.push({
                            containerType: "DefaultForm",
                            index: $(container).attr("data-containerIndex")
                        });
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
            var result = true;

            var hasValidationErrors = true;
            if (typeof (SPClientForms) !== undefined &&
                typeof (SPClientForms.ClientFormManager) !== undefined &&
                typeof (SPClientForms.ClientFormManager.SubmitClientForm) === "function") {
                hasValidationErrors = SPClientForms.ClientFormManager.SubmitClientForm('WPQ2');
            }

            if (hasValidationErrors) {
                var opt = $.extend({}, spEasyForms.defaults, {});
                var layout = this.getLayout(opt);
                $.each(layout, function(index, current) {
                    if (layout.containerType != 'DefaultForm') {
                        var containerType = current.containerType[0].toLowerCase() +
                            current.containerType.substring(1);
                        if(containerType != "defaultForm") {
                            var impl = master.containerImplementations[containerType];
                            opt.index = index;
                            opt.layout = current;
                            result = result && impl.preSaveItem(opt);
                        }
                    }
                });
            }

            $("#s4-bodyContainer").scrollTop();

            return result;
        },

        /*********************************************************************
         * Get the current layout for the current form, either by calling spContext
         * to read it from the server, or pulling it from the hidden div where the
         * working copy is stored.
         *
         * @returns {object} - the layout
         *********************************************************************/        
        getLayout: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var currentLayout;

            if ($("#spEasyFormsJson pre").text().length > 0) {
                currentLayout = utils.parseJSON($("#spEasyFormsJson pre").text());
            } else {
                currentLayout = spContext.getLayout(opt);
            }

            if (currentLayout === undefined) {
                currentLayout = [{
                    "containerType": "DefaultForm"
                }];
            }

            return currentLayout;
        },

        /*********************************************************************
         * Loop through the layouts and call the implementation's toEditor function.
         *
         * @returns {object} - an array of all internal field names that are already
         *     on one of the editors.
         *********************************************************************/        
        initContainers: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var fieldsInUse = [];
            $.each(opt.layout, function (index, layout) {
                if (layout.containerType != 'DefaultForm') {
                    opt.id = "spEasyFormsContainer" + index;
                    opt.title = layout.containerType;
                    opt.currentLayout = layout;
                    opt.containerIndex = (layout.index !== undefined ? layout.index : index);
                    master.appendContainer(opt);
                    var implementation = layout.containerType[0].toLowerCase() +
                        layout.containerType.substring(1);
                    var tmp = master.containerImplementations[implementation].toEditor({
                        index: index,
                        rows: opt.rows,
                        layout: layout,
                        parentId: opt.id
                    });
                    $.merge(fieldsInUse, tmp);
                } else {
                    opt.id = "spEasyFormsFormTd";
                    opt.title = "Default Form";
                    opt.currentLayout = layout;
                    opt.containerIndex = "d";
                    master.appendContainer(opt);
                }
            });
            return fieldsInUse;
        },

        /*********************************************************************
         * Put any fields not on an editor on the default form editor.
         *
         * @param {object} options - {
         *    fieldsInUse: [string] - array of field internal names that are on
         *        one of the editors.
         * }
         *********************************************************************/        
        initDefaultFieldGroup: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var table = "";
            $.each(opt.rows, function (fieldIdx, row) {
                if ($.inArray(fieldIdx, opt.fieldsInUse) < 0) {
                    table += master.createFieldRow({
                        row: row
                    });
                }
            });
            $("#spEasyFormsFormTd").append(this.createFieldGroup({
                trs: table,
                id: "spEasyFormsFormTable",
                name: "",
                tableIndex: "d"
            }));
        },

        /*********************************************************************
         * Wire the container sorting, clicking, and editor button events.
         *********************************************************************/        
        wireContainerEvents: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            // make the field rows in the editor sortable sortable
            $("tbody.speasyforms-sortablefields").sortable({
                connectWith: ".speasyforms-sortablefields",
                items: "> tr:not(:first)",
                helper: "clone",
                zIndex: 990,
                update: function (event, ui) {
                    if (!event.handled) {
                        $("#spEasyFormsJson pre").text(
                        JSON.stringify(master.toLayout(opt), null, 4));
                        master.toEditor(opt);
                        event.handled = true;
                    }
                }
            });

            // make the containers in the editor sortable
            $("tbody.speasyforms-sortablecontainers").sortable({
                connectWith: ".speasyforms-sortablecontainers",
                items: "> tr",
                helper: "clone",
                zIndex: 90,
                update: function (event, ui) {
                    if (!event.handled) {
                        $("#spEasyFormsJson pre").text(
                        JSON.stringify(master.toLayout(opt), null, 4));
                        master.toEditor(opt);
                        event.handled = true;
                    }
                }
            });

            // make the field tables individually collapsible
            $("h3.speasyforms-sortablefields").dblclick(function (e) {
                if (e.handled !== true) {
                    var currentId, i, j;
                    if ($(this).next().length === 0) {
                        $(this).closest("table").next().toggle();
                        i = $(this).closest("table").closest("td").attr("data-containerIndex");
                        j = $(this).closest("table").next().attr("data-tableIndex");
                        if ($(this).closest("table").next().css("display") == "none") {
                            master.hiddenObjects[i + "_" + j] = {
                                primaryIndex: i,
                                secondaryIndex: j
                            };
                        }
                        else if (i + "_" + j in master.hiddenObjects) {
                            delete master.hiddenObjects[i + "_" + j];
                        }
                    } else {
                        $(this).next().toggle();
                        i = $(this).closest("td").attr("data-containerIndex");
                        j = $(this).next().attr("data-tableIndex");
                        if ($(this).next().css("display") == "none") {
                            master.hiddenObjects[i + "_" + j] = {
                                primaryIndex: i,
                                secondaryIndex: j
                            };
                        }
                        else if (i + "_" + j in master.hiddenObjects) {
                            delete master.hiddenObjects[i + "_" + j];
                        }
                    }
                    e.handled = true;
                } else {
                    $(this).unbind(e);
                }
                return false;
            });

            // make the containers individually collapsible
            $("td.speasyforms-sortablecontainers").dblclick(function (e) {
                if (e.handled !== true) {
                    $('#' + this.id + ' .speasyforms-sortablefields').toggle();
                    var k = $('#' + this.id).attr("data-containerIndex");
                    if ($('#' + this.id + ' .speasyforms-sortablefields').css("display") == "none") {
                        master.hiddenObjects[k] = { primaryIndex: k };
                    }
                    else if (k in master.hiddenObjects) {
                        delete master.hiddenObjects[k];
                    }

                    e.handled = true;
                } else {
                    $(this).unbind(e);
                }
            });

            // wire the edit buttons for each field group
            $(".speasyforms-editfields").button({
                icons: {
                    primary: "ui-icon-gear"
                },
                text: false
            }).click(function () {
                $("#fieldGroupName").val("");
                $("#editFieldGroupContainerId").val($(this).closest("tr").
                find("h3.speasyforms-sortablefields")[0].id);
                $('#editFieldGroupDialog').dialog('open');
                return false;
            });

            // wire the delete buttons for each field group
            $(".speasyforms-deletefields").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function () {
                $(this).closest("div").remove();
                $("#spEasyFormsJson pre").text(
                JSON.stringify(master.toLayout(opt), null, 4));
                master.toEditor(opt);
                return false;
            });
        },

        /*********************************************************************
         * Wire the top/bottom button bar events.
         *********************************************************************/        
        wireButtonEvents: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            // wire the add buttons
            $(".speasyforms-add").button({
                icons: {
                    primary: "ui-icon-plusthick"
                },
                label: 'Add'
            }).click(function () {
                $("#containerType").val("");
                $("#chooseContainerError").html("");
                $("#chooseContainerDialog").dialog("open");
                return false;
            });

            // wire the expand buttons
            $(".speasyforms-expand").button({
                icons: {
                    primary: "ui-icon-folder-open"
                },
                label: 'Expand'
            }).click(function () {
                master.hiddenObjects = [];
                $('.speasyforms-sortablefields').show();
                return false;
            });

            // wire the collapse buttons
            $(".speasyforms-collapse").button({
                icons: {
                    primary: "ui-icon-folder-collapsed"
                },
                label: 'Collapse'
            }).click(function () {
                $("td.speasyforms-sortablecontainers").each(function () {
                    var containerIndex = $(this).attr("data-containerIndex");
                    master.hiddenObjects[containerIndex] = { primaryIndex: containerIndex };
                });
                $('.speasyforms-sortablefields').hide();
                return false;
            });

            // wire the save buttons
            $(".speasyforms-save").button({
                icons: {
                    primary: "ui-icon-disk"
                },
                label: 'Save'
            }).click(function () {
                var ctx = spContext.get();
                $.ajax({
                    url: ctx.webAppUrl + ctx.webRelativeUrl + "/SiteAssets/spef-layout-" +
                        spContext.getCurrentListId(opt) + ".txt",
                    type: "PUT",
                    headers: {
                        "Content-Type": "text/plain",
                        "Overwrite": "T"
                    },
                    data: $("#spEasyFormsJson pre").text(),
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Error uploading configuration.\nStatus: " + xhr.status +
                              "\nStatus Text: " + thrownError);
                    }
                });
                return false;
            });

            //$(".speasyforms-add").button({ disabled: true });
        },

        /*********************************************************************
         * Wire the dialog events.
         *********************************************************************/        
        wireDialogEvents: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var chooseContainerOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        if ($("#containerType").val().length > 0) {
                            $("#chooseContainerDialog").dialog("close");
                            var implname = $("#containerType").val()[0].toLowerCase() +
                                $("#containerType").val().substring(1);
                            var impl = master.containerImplementations[implname];
                            opt.containerType = $("#containerType").val();
                            $("#addMultiGroupContainerType").val(opt.containerType);
                            impl.settings(opt);
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
            $.each(master.containerImplementations, function (index, intfc) {
                if (master.containerImplementations[index].containerType !=
                    "masterContainer") {
                    $("#containerType").append($('<option>', {
                        text: master.containerImplementations[index].containerType,
                        value: master.containerImplementations[index].containerType
                    }));
                }
            });

            $("#chooseContainerDialog").dialog(chooseContainerOpts);

            var editFieldsTableOpts = {
                modal: true,
                buttons: {
                    "Save": function () {
                        $("#" + $("#editFieldGroupContainerId").val()).
                        html($("#fieldGroupNames").val());
                        opt.layout = master.toLayout(opt);
                        $("#spEasyFormsJson pre").text(
                        JSON.stringify(opt.layout, null, 4));
                        master.toEditor(opt);
                        $("#editFieldGroupDialog").dialog("close");
                    },
                    "Cancel": function () {
                        $("#editFieldGroupDialog").dialog("close");
                    }
                },
                autoOpen: false
            };

            $('#editFieldGroupDialog').dialog(editFieldsTableOpts);
        },

        /*********************************************************************
         * Utility function to create a uniform container div for a given editor.
         *
         * @param {object} options - {
         *    id: {string} - the element id to be used for the container td
         *    containerIndex: {string} - an immutable container index that is assigned
         *        to a container the first time it is created (generally containers.length,
         *        but it really doesn't matter as long as it doesn't change); this is needed
         *        to uniquely identify containers as they move around, for instance for the
         *        hiddenObjects array.
         *    title: {string} - usually the container implementation, it's displayed as the
         *        header for the editor.
         *    currentLayout: {object} - the layout configuration instance of the container.
         * }
         *********************************************************************/        
        appendContainer: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            $("#" + opt.id).parent().remove();

            var tr = "<tr>" +
                "<td class='speasyforms-sortablecontainers' id='" + opt.id +
                "' data-containerIndex='" + opt.containerIndex + "'>" +
                "<table class='speasyforms-fieldstitle'><tr>" +
                "<td class='speasyforms-headercell'><h1>" + opt.title +
                "</h1></td><td class='speasyforms-buttoncell' align='right'>";

            if (opt.title !== 'Default Form') {
                tr += "<button id='" + opt.id +
                    "Delete' class='speasyforms-containerbtn'>Delete</button></td>";
            }

            tr += "</tr></table><input type='hidden' name='" + opt.id +
                "Hidden' id='" + opt.id + "Hidden' value='" +
                opt.currentLayout.containerType +
                "' /></td></tr>";

            var result = $("#spEasyFormsContainerTable").append(tr);

            if (opt.title !== 'Default Form') {
                $("#" + opt.id + "Delete").button({
                    icons: {
                        primary: "ui-icon-closethick"
                    },
                    text: false
                }).click(function () {
                    $(this).closest("td.speasyforms-sortablecontainers").remove();
                    $("#spEasyFormsJson pre").text(
                    JSON.stringify(master.toLayout(opt), null, 4));
                    master.toEditor(opt);
                });
            }

            return result;
        },

        /*********************************************************************
         * Utility function to construct the HTML for a single row in a field groups
         * table.
         *
         * @param {object} options - {
         *    row: {string} - the row object representing the field, as returned
         *        by spFieldRows.init(opt).
         * }
         *********************************************************************/        
        createFieldRow: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var r = opt.row;

            var tr = "<tr class='speasyforms-sortablefields'>" +
                "<td class='speasyforms-sortablefields'>" + r.displayName + "</td>" +
                "<td class='speasyforms-sortablefields'>" + r.internalName + "</td>" +
                "<td class='speasyforms-sortablefields'>" + r.spFieldType + "</td>" +
                "</tr>";

            return tr;
        },

        /*********************************************************************
         * Utility function to construct the HTML the table representing a field
         * group.
         *
         * @param {object} options - {
         *    trs {string} - the HTML for all of the table rows for the table
         *    name {string} - the name of the field group used for the header
         *    id {string} - the element id for the table
         *    tableIndex {string} - an immutable table index that is assigned
         *        to a table the first time it is created (generally tables.length 
         *        for the tables within the current editor/container, but it really 
         *        doesn't matter as long as it doesn't change); this is needed
         *        to uniquely identify tables as their containers move around, for instance for the
         *        hiddenObjects array.
         * }
         *********************************************************************/        
        createFieldGroup: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var trs = opt.trs;
            var name = (opt.name !== undefined ? opt.name : "");
            var id = (opt.id !== undefined ? opt.id : Math.floor(Math.random() * 1000) + 1);

            var result = "<h3 id='" + id + "Header' class='speasyforms-sortablefields'>" +
                name + "</h3>";

            if (opt.id !== "spEasyFormsFormTable") {
                result = "<table class='speasyforms-fieldsheader'><tr><td>" + result +
                    "</td><td align='right'>";
                result += "<button id='" + opt.id +
                    "Edit' class='speasyforms-containerbtn speasyforms-editfields'>" +
                    "Edit Settings</button><button id='" + opt.id +
                    "Delete' class='speasyforms-containerbtn  " +
                    "speasyforms-deletefields'>Delete</button>";
                result += "</td></tr></table>";
            }

            result += "<table id='" + id + "' class='speasyforms-sortablefields' " +
                "cellPadding='0' cellSpacing='3' data-tableIndex='" +
                opt.tableIndex + "'>" +
                "<tbody class='speasyforms-sortablefields'>" +
                "<th class='speasyforms-name'>Display Name</th>" +
                "<th class='speasyforms-name'>Internal Name</th>" +
                "<th class='speasyforms-type'>Field Type</th>" + opt.trs +
                "</tbody></table>";

            return "<div id='" + opt.id + "Div' class='speasyforms-sortablefields'>" +
                result + "</div>";
        }
    };
    var master = $.spEasyForms.masterContainer;
    master.containerImplementations.defaultForm = master;

    ////////////////////////////////////////////////////////////////////////////
    // This abstract container implements all of the editor functionality for any
    // container type comprised of one or more groups of fields (which I imagine
    // is all containers).  It implements everything but the transform function.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.baseContainer = {

        /*********************************************************************
         * Convert the layout to an editor for any container containing one or 
         * more field groups.
         *
         * @param {object} options = {
         *     parentId {string} - the id of the outer div for the container
         *     index {string} - one up index of the container, use to create unique ids
         *     rows [object] - array of objects representing rows in the form
         *     layout {object} - object representing the configuration for this container
         * }
         *********************************************************************/
        toEditor: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var parent = opt.parentId;
            var index = opt.index;
            var rows = opt.rows;
            var layout = opt.layout;
            var result = [];

            $.each(layout.fieldGroups, function (idx, fieldGroup) {
                var tableId = "spEasyFormsSortableFields" + index + "" + idx;
                var table = "";

                $.each(fieldGroup.fields, function (fieldIdx, field) {
                    opt.row = rows[field.fieldInternalName];
                    table += master.createFieldRow(opt);
                    result.push(field.fieldInternalName);
                });

                opt.trs = table;
                opt.id = tableId;
                opt.name = fieldGroup.name;
                opt.tableIndex = idx;
                table = master.createFieldGroup(opt);
                $("#" + parent).append(table);
            });

            this.wireDialogEvents(opt);

            if ($("#" + parent + "AddTFieldGroups").length === 0) {
                $("#" + parent + "Delete").parent().prepend(
                    '<button id="' + parent +
                    'AddFieldGroups" title="Add Field Groups" ' +
                    'class="speasyforms-containerbtn">Add Field Groups</button>');

                $('#' + parent + 'AddFieldGroups').button({
                    icons: {
                        primary: "ui-icon-plusthick"
                    },
                    text: false
                }).click(function () {
                    $("#addFieldGroupNames2").val("");
                    $("#addFieldGroupsContainerId").val(index);
                    $("#addFieldGroupsToContainerDialog").dialog('open');
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
        toLayout: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = {
                containerType: opt.containerType,
                index: $(opt.container).attr("data-containerIndex"),
                fieldGroups: []
            };
            var tables = $(opt.container).find("table.speasyforms-sortablefields");
            $.each(tables, function (index, table) {
                var fieldGroup = {
                    name: $(table).prev().
                        find("h3.speasyforms-sortablefields").text()
                };
                fieldGroup.fields = [];
                var trs = $(table).find("tr:not(:first)");
                $.each(trs, function (idx, tr) {
                    var tds = $(tr).find("td");
                    fieldGroup.fields.push({
                        fieldInternalName: $(tds[1]).text()
                    });
                });
                result.fieldGroups.push(fieldGroup);
            });
            return result;
        },

        /*********************************************************************
         * Launch the settings dialog for this container.
         *********************************************************************/
        settings: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("#addFieldGroupNames").val("");
            this.wireDialogEvents(opt);
            $("#addMultiGroupContainerDialog").dialog("open");
        },

        /*********************************************************************
         * Wire the initial configuration and add field group dialogs for this
         * container.
         *********************************************************************/
        wireDialogEvents: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            var configureTabsOpts = {
                width: 400,
                modal: true,
                buttons: {
                    "Ok": function () {
                        if ($("#addFieldGroupNames").val().length > 0) {
                            var groupNames = $("#addFieldGroupNames").val().split('\n');
                            var newLayout = {
                                containerType: $("#addMultiGroupContainerType").val(),
                                fieldGroups: []
                            };
                            $.each($(groupNames), function (idx, name) {
                                if (name.trim().length > 0) {
                                    newLayout.fieldGroups.push({
                                        name: name,
                                        fields: []
                                    });
                                }
                            });
                            opt.layout = master.getLayout(opt);
                            opt.layout.push(newLayout);
                            $("#spEasyFormsJson pre").text(
                                JSON.stringify(opt.layout, null, 4));
                            master.toEditor(opt);
                            $("#addMultiGroupContainerDialog").dialog("close");
                        } else {
                            $("#addMultiGroupContainerError").html(
                                "* You must enter at least one tab name.");
                        }
                        return false;
                    },
                    "Cancel": function () {
                        $("#addMultiGroupContainerDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false
            };

            $("#addMultiGroupContainerDialog").dialog(configureTabsOpts);

            var addTabsOpts = {
                width: 400,
                modal: true,
                buttons: {
                    "Ok": function () {
                        if ($("#addFieldGroupNames2").val().length > 0) {
                            var tabNames = $("#addFieldGroupNames2").val().split('\n');
                            var index = $("#addFieldGroupsContainerId").val();
                            var nextFieldGroupIndex = $("#spEasyFormsContainer" +
                                index + " table.speasyforms-sortablefields").length;
                            $.each(tabNames, function (idx, name) {
                                opt.trs = "";
                                opt.id = "spEasyFormsSortableFields" +
                                    index + "" + nextFieldGroupIndex++;
                                opt.name = name;
                                opt.tableIndex = idx;
                                var table = master.createFieldGroup(opt);
                                $("#spEasyFormsContainer" + index).append(table);
                            });
                            opt.layout = master.toLayout(opt);
                            $("#spEasyFormsJson pre").text(
                                JSON.stringify(opt.layout, null, 4));
                            master.toEditor(opt);
                            $("#addFieldGroupsToContainerDialog").dialog("close");
                        } else {
                            $("#addFieldGroupsToContainerDialogError").html(
                                "* You must enter at least one field group name.");
                        }
                        return false;
                    },
                    "Cancel": function () {
                        $("#addFieldGroupsToContainerDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false
            };

            $("#addFieldGroupsToContainerDialog").dialog(addTabsOpts);
        }
    };
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Accordion container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.accordion = Object.create(baseContainer);
    $.spEasyForms.accordion.containerType = "Accordion";
    
    $.spEasyForms.accordion.transform = function (options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var result = [];
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var divClass = "speasyforms-container speasyforms-accordion speasyforms-accordion" + opt.index;
        $("#" + opt.containerId).append("<div id='" + divId + "' class='" + divClass + "'></div>");
        $.each(opt.layout.fieldGroups, function (idx, fieldGroup) {
            var itemClass = "speasyforms-accordion speasyforms-accordion" +
                opt.index + "" + idx;
            var tableClass = "speasyforms-accordion speasyforms-accordion" +
                opt.index + "" + idx;
            var tableId = "spEasyFormsAccordionTable" + opt.index + "" + idx;
            var headerId = "spEasyFormsAccordionHeader" + opt.index + "" + idx;
            $("#" + divId).append("<h3 id='" + headerId + "' class='" + tableClass + "'>" + fieldGroup.name + "</h3>");
            $("#" + divId).append(
                "<div><table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldGroup.fields, function (fieldIdx, field) {
                var currentRow = opt.rows[field.fieldInternalName];
                result.push(field.fieldInternalName);
                if (currentRow !== undefined) {
                    currentRow.row.appendTo("#" + tableId);
                }
            });
        });
        $("#" + divId).accordion({ heightStyle: "auto" });
        return result;
    };
    
    $.spEasyForms.accordion.preSaveItem = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var selected = false;
        $("#" + divId).find("table.speasyforms-accordion").each(function(idx, content) {
            if ($(content).find(".ms-formbody span.ms-formvalidation").length > 0) {
                $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).addClass("speasyforms-accordionvalidationerror");
                if(!selected) {
                    $("#" + divId).accordion({ active: idx });
                    selected = true;
                }
            }
            else {
                $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).removeClass("speasyforms-accordionvalidationerror");
            }
        });
        return true;
    };

    master.containerImplementations.accordion = $.spEasyForms.accordion;

    ////////////////////////////////////////////////////////////////////////////
    // Columns container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.columns = Object.create(baseContainer);
    $.spEasyForms.columns.containerType = "Columns";
    
    $.spEasyForms.columns.transform = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
        var outerTableClass = "speasyforms-container speasyforms-columns speasyforms-columns" + opt.index;
        $("#" + opt.containerId).append("<table id='" + outerTableId +
            "' class='" + outerTableClass + "'><tr></tr></table>");
        $.each(opt.layout.fieldGroups, function (idx, fieldGroup) {
            var itemClass = "speasyforms-columns speasyforms-columns" +
                opt.index + "" + idx;
            var tableClass = "speasyforms-columns speasyforms-columns" +
                opt.index + "" + idx;
            var tableId = "spEasyFormsColumnsTable" + opt.index + "" + idx;
            $("#" + outerTableId).append(
                "<td><table class='" + tableClass + "' id='" + tableId +
                "'></table></td>");
            $.each(fieldGroup.fields, function (fieldIdx, field) {
                var currentRow = opt.rows[field.fieldInternalName];
                result.push(field.fieldInternalName);
                if (currentRow !== undefined) {
                    if (currentRow.row.find("td.ms-formbody").find("h3.ms-standardheader").length === 0) {
                        var tdh = currentRow.row.find("td.ms-formlabel");
                        currentRow.row.find("td.ms-formbody").prepend(
                            tdh.html() + "<br data-transformAdded='true'/>");
                        currentRow.row.find("td.ms-formbody").find("h3.ms-standardheader").attr("data-transformAdded", "true");
                        tdh.hide();
                        tdh.attr("data-transformHidden", "true");
                    }
                    currentRow.row.appendTo("#" + tableId);
                }
            });
        });
        return result;
    };
        
    $.spEasyForms.columns.preSaveItem = function(options) {
        return true;
    };

    master.containerImplementations.columns = $.spEasyForms.columns;

    ////////////////////////////////////////////////////////////////////////////
    // Tabs container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.tabs = Object.create(baseContainer);
    $.spEasyForms.tabs.containerType = "Tabs";
    
    $.spEasyForms.tabs.transform = function (options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var result = [];
        var divId = "spEasyFormsTabDiv" + opt.index;
        var divClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" + opt.index;
        var listId = "spEasyFormsTabsList" + opt.index;
        var listClass = "speasyforms-tabs speasyforms-tabs" + opt.index;
        var containerDiv = $("#" + opt.containerId);
        containerDiv.append("<div id='" + divId + "' class='" + divClass +
            "'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
        var mostFields = 0;
        $.each(opt.layout.fieldGroups, function (idx, fieldGroup) {
            if(fieldGroup.fields.length > mostFields) {
                mostFields = fieldGroup.fields.length;
            }
        });
        $.each(opt.layout.fieldGroups, function (idx, fieldGroup) {
            var itemClass = "speasyforms-tabs speasyforms-tabs" +
                opt.index + "" + idx;
            var tableClass = "speasyforms-tabs speasyforms-tabs" +
                opt.index + "" + idx;
            var tableId = "spEasyFormsTabsTable" + opt.index + "" + idx;
            $("#" + listId).append("<li class='" + itemClass +
                "'><a href='#" + tableId + "'>" + fieldGroup.name + "</a></li>");
            $("#" + divId).append(
                "<table class='" + tableClass + "' id='" + tableId +
                "'></table>");
            $.each(fieldGroup.fields, function (fieldIdx, field) {
                var currentRow = opt.rows[field.fieldInternalName];
                result.push(field.fieldInternalName);
                if (currentRow !== undefined) {
                    currentRow.row.appendTo("#" + tableId);
                }
            });
            for(var i=fieldGroup.fields.length; i<mostFields; i++) {
                $("<tr><td><br /><br /></td></tr>").appendTo("#" + tableId);
            }
        });
        $("#" + divId).tabs({ heightStyle: "auto" });
        return result;
    };
    
    $.spEasyForms.tabs.preSaveItem = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var divId = "spEasyFormsTabDiv" + opt.index;
        var selected = false;
        $("#" + divId).find("table.speasyforms-tabs").each(function(idx, tab) {
            if ($(tab).find(".ms-formbody span.ms-formvalidation").length > 0) {
                $("a[href$='#spEasyFormsTabsTable" + opt.index + "" + idx + "']").addClass("speasyforms-tabvalidationerror");
                if (!selected) {
                    $("#" + divId).tabs('select', idx);
                    selected = true;
                }
            }
            else {
                $("a[href$='#spEasyFormsTabsTable" + opt.index + "" + idx + "']").removeClass("speasyforms-tabvalidationerror");                
            }
        });
        return true;
    };

    master.containerImplementations.tabs = $.spEasyForms.tabs;

    ////////////////////////////////////////////////////////////////////////////
    // Utility class to parse field rows into a map.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.sharePointFieldRows = {
        rows: {},

        /********************************************************************
         * Parse a SharePoint form into a map of 
         *     field names => structured representation of the field.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     input: {$(src)} // a jQuery object wrapping a string with the
         *         // source to be parsed, if undefined defaults to parse
         *         // from the current page
         * }
         *
         * @returns {object} rows - {
         *     <internalName>: {object},
         *     <displayName>: {object},
         *     ... // at least one key is added for each row object, two if
         *         // the displayName is not already in use
         * }
         *
         * The row structure looks like:
         * 
         * {
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     internalName: {string},
         *     displayName: {string},
         *     spFieldType: {string},
         *     value: {string} // an attempt to get the current value from
         *                     // the row based on spFieldType
         * }
         *
         * For example, to get rows for a page other than the current page,
         * you can do something like:
         *
         *     $.ajax({
         *         async: false,
         *         url: <your url>,
         *         complete: function (xData) {
         *             var rows $.spEasyForms.sharePointFieldRows.init(
         *                 $(xData.responseText));
         *             // have fun with rows
         *         }
         ********************************************************************/
        init: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var input;
            if (opt.input !== undefined) {
                input = opt.input.find(opt.formBodySelector).closest("tr");
            } else {
                input = $(opt.formBodySelector).closest("tr");
                this.rows = {};
            }
            var results = {};
            input.each(function () {
                opt.tr = $(this);
                var current = spRows.processTr(opt);
                if (current.internalName !== undefined) {
                    results[current.internalName] = current;
                }
            });
            if (opt.input === undefined) {
                this.rows = results;
            }
            return results;
        },

        /*********************************************************************
         * Parse the source from a tr from the form into a structure.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     tr: {$(<the tr>)} // a jQuery wrapper for the DOM tr from the form
         * }
         *
         * @returns {object} - {
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     internalName: {string},
         *     displayName: {string},
         *     spFieldType: {string},
         *     value: {string} // an attempt to get the current value from
         *                     // the row based on spFieldType
         * }
         ********************************************************************/
        processTr: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var current = opt.tr;
            var internal = this.capture({
                row: current,
                regex: opt.fieldInternalNameRegex
            });
            var display = this.capture({
                row: current,
                regex: opt.fieldDisplayNameRegex
            });
            var fieldType = this.capture({
                row: current,
                regex: opt.fieldTypeRegex
            });
            var result = {
                row: current,
                internalName: internal,
                displayName: display,
                spFieldType: fieldType
            };
            if (result.internalName !== undefined) {
                if (result.displayName === undefined) {
                    result.displayName = result.internalName;
                }
                if (result.spFieldType === undefined) {
                    result.spFieldType = "SPFieldText";
                }
                result.value = this.value({
                    row: result
                });
            }
            return result;
        },

        /*********************************************************************
         * Run a regex against the source from a tr and return the first match
         * or undefined if there are no matches.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     row: {$(<the tr>)}, // the jQuery wrapper for the DOM tr
         *     regex: {string}    // a regular expression to run against the
         *                        // the row source
         * }
         *
         * @returns {string} - the first match or undefined
         ********************************************************************/
        capture: function (options) {
            var matches = options.row.html().match(options.regex);
            if (matches.length >= 2) return matches[1];
            return undefined;
        },

        /*********************************************************************
         * Parse the value from the source from a tr based on the SPFieldType.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     tr: {object}, // the structure obtained from processTr
         * }
         *
         * @returns {string} - the first match or undefined
         ********************************************************************/
        value: function (options) {
            var tr = options.row;
            try {
                switch (tr.spFieldType) {
                    /*
             case "SPFieldNote":
                 tr.value = tr.row.find("td[id^='SPField']").
                     find("div").html().trim();
                 break;
             case "SPFieldURL":
                 tr.value = tr.row.find("td[id^='SPField']").
                     find("img").attr("src");
                 break;
                 */
                    default: tr.value = tr.row.find("td.ms-formbody").text().trim();
                        break;
                }
            } catch (e) {
                console.log(e);
            }
        }
    };
    var spRows = $.spEasyForms.sharePointFieldRows;

    ////////////////////////////////////////////////////////////////////////////
    // Unitlity class to capture the current SharePoint context.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.sharePointContext = {
        /*********************************************************************
         * Builds a basic SharePoint context, which may be extended later by 
         * calling other spContext functions.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         * }
         *
         * @returns {object} - {
         *     webAppUrl: <string>, // the url of the SharePoint web application
         *     siteRelativeUrl: <string>, // relative url of the current site
         *     webRelativeUrl: <string>, // relative url of the current web
         *     webUIVersion: <string>, // the user interface version of the
         *                             // current web
         *     listId: <string>, // the GUID of the current list, undefined if
         *                       // we're not in a list context
         *     userId: <string>, // the integer id of the current user
         *     userProfile: <object>, // map of user profile name/value pairs,
         *         // with the names converted to camel case with SPS- removed,
         *         // lazy loaded (i.e. an empty object until 
         *         // $.spEasyForms.sharePointContext.get() is called)
         * }
         *********************************************************************/
        get: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = this.ctx;
            if(result === undefined) {
                if (opt.useCache) {
                    opt.siteUrl = this.getCurrentSiteUrl(opt);
                    result = spEasyForms.readCachedContext(opt);
                }
                if (typeof (result) == 'undefined') {
                    result = {};
                    result.siteRelativeUrl = _spPageContextInfo.siteServerRelativeUrl;
                    result.webAppUrl = window.location.href.substring(0,
                        window.location.href.indexOf(window.location.pathname));
                    result.webRelativeUrl = opt.siteUrl;
                    result.webUIVersion = _spPageContextInfo.webUIVersion;
                    if ("pageListId" in _spPageContextInfo) {
                        result.listId = _spPageContextInfo.pageListId;
                    } else {
                        result.listId = "";
                    }
                    result.userId = _spPageContextInfo.userId;
                    result.userProfile = {};
                    result.userInformation = {};
                    result.groups = {};
                    result.listContexts = {};
                }
            }
            if ("pageListId" in _spPageContextInfo) {
                result.listId = _spPageContextInfo.pageListId;
            } else {
                result.listId = "";
            }
            if (opt.useCache) {
                opt.currentContext = result;
                spEasyForms.writeCachedContext(opt);                
            }
            this.ctx = result;
            return result;
        },

        /*********************************************************************
         * Get information about a user from ~site/_layouts/userdisp.aspx.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     userId: <int> // the integer id of person whose information you
         *         // want, default undefined meaning current user
         * }
         *
         * @returns {object} - {
         *     preferredName: <string>, 
         *     firstName: <string>,
         *     lastName: <string>,
         *     workEmail: <string>, 
         *     userName: <string>
         * }
         *********************************************************************/
        getUserInformation: function (options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var user = ("userInformation" in currentContext ? currentContext.userInformation : {});
            if (!opt.useCache || 'userId' in opt || $.isEmptyObject(user)) {
                var id = (typeof (opt.userId) != 'undefined' ? "ID=" +
                          opt.userId + "&" : "");
                $.ajax({
                    async: false,
                    url: currentContext.webAppUrl + currentContext.webRelativeUrl +
                        "/_layouts/userdisp.aspx?Force=True&" + id + new Date().getTime(),
                    complete: function (xData) {
                        $(xData.responseText).find(
                            "table.ms-formtable td[id^='SPField']").each(

                        function () {
                            var tr = $(this).closest("tr");
                            var nv = utils.row2FieldRef(tr);
                            if (nv.internalName.length > 0) {
                                var prop = nv.internalName[0].toLowerCase() +
                                    nv.internalName.substring(1);
                                user[prop] = nv.value;
                            }
                        });
                    }
                });
                if (opt.useCache && !("userId" in opt)) {
                    currentContext.userInformation = user;
                    opt.currentContext = currentContext;
                    $.spEasyForms.writeCachedContext(opt);
                }
            }
            return user;
        },

        /*********************************************************************
         * Get a user profile by account login. Returns a map of user profile 
         * name/value pairs, with the names converted to camel case with 
         * SPS- removed.  More commonly used field names are documented in 
         * the return below.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     accountName: <string> // the person whose profile you want,
         *         // default undefined meaning current user
         * }
         *
         * @returns {object} - {
         *     preferredName: <string>, 
         *     firstName: <string>,
         *     lastName: <string>,
         *     workEmail: <string>, 
         *     userName: <string>
         * }
         *********************************************************************/
        getUserProfile: function (options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            var user = ("userProfile" in currentContext ? currentContext.userProfile : {});
            if (!opt.useCache || "accountName" in opt || $.isEmptyObject(user)) {
                var params = {
                    operation: 'GetUserProfileByName',
                    async: false,
                    completefunc: function (xData, Status) {
                        $(xData.responseXML).SPFilterNode("PropertyData").each(function () {
                            var name = $(this).find("Name").text().replace(
                                "SPS-", "");
                            name = name[0].toLowerCase() + name.substring(1);
                            user[name] = $(this).find("Value").text();
                        });
                    }
                };
                $().SPServices(params);
                if (opt.useCache && !("accountName" in opt)) {
                    currentContext.userProfile = user;
                    opt.currentContext = currentContext;
                    spEasyForms.writeCachedContext(opt);
                }
            }
            return user;
        },

        /*********************************************************************
         * Get a map of SharePoint groups by account login, keyed on group id
         * and/or name.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     accountName: <string> // the person whose profile you want,
         *         // default undefined meaning current user
         * }
         *
         * @returns {object} - {
         *     <groupid>: { id: <id>, name: <name> },
         *     <groupname>: { id: <id>, name: <name> }
         * }
         *********************************************************************/
        getGroups: function (options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            var groups = ("groups" in currentContext ? currentContext.groups : {});
            if (!opt.useCache || "accountName" in opt || $.isEmptyObject(groups)) {
                $().SPServices({
                    operation: "GetGroupCollectionFromUser",
                    userLoginName: (("accountName" in opt && opt.accountName.length > 0) ? 
                        opt.accountName : this.getUserInformation(opt).name),
                    async: false,
                    completefunc: function (xData, Status) {
                        $(xData.responseXML).find("Group").each(function () {
                            group = {};
                            group.name = $(this).attr("Name");
                            group.id = $(this).attr("ID");
                            groups[group.id] = group;
                            groups[group.name] = group;
                        });
                    }
                });
                if (opt.useCache && (!("accountName" in opt) || opt.accountName.length < 1)) {
                    currentContext.groups = groups;
                    opt.currentContext = currentContext;
                    spEasyForms.writeCachedContext(opt);
                }
            }
            return groups;
        },

        /*********************************************************************
         * Get a list context (namely an object containing a list of fields 
         * with their internal name, display name, and type for now, but I
         * imagine I'll be adding to it as my needs evolve).
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     listId: <guid>, // the guid of the list you want a context for,
         *         // default undefined meaning current list
         * }
         *
         * @returns {object} - {
         *     <groupid>: { id: <id>, name: <name> },
         *     <groupname>: { id: <id>, name: <name> }
         * }
         *********************************************************************/
        getListContext: function (options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.currentContext = currentContext;
            opt.listId = this.getCurrentListId(opt);
            if (opt.listId === undefined || opt.listId.length === 0) {
                return undefined;
            }
            if (opt.useCache && opt.listId in currentContext.listContexts) {
                return currentContext.listContexts[opt.listId];
            } else {
                result = {};
                result.fields = {};
                $.ajax({
                    async: false,
                    url: currentContext.webAppUrl + currentContext.webRelativeUrl +
                        "/_layouts/listform.aspx?PageType=6&ListId=" + opt.listId + "&RootFolder=",
                    complete: function (xData) {
                        $(xData.responseText).find("table.ms-formtable td.ms-formbody").each(function () {
                            var tr = $(this).closest("tr");
                            var fieldRef = utils.row2FieldRef(tr);
                            result.fields[fieldRef.internalName] = fieldRef;
                        });
                    }
                });
                if (opt.useCache) {
                    var listCount = Object.keys(currentContext.listContexts).length;
                    if (listCount >= opt.maxListCache) {
                        delete currentContext.listContexts[Object.keys(currentContext.listContexts)[0]];
                    }
                    currentContext.listContexts[opt.listId] = result;
                    opt.currentContext = currentContext;
                    spEasyForms.writeCachedContext(opt);
                }
                return result;
            }
        },

        /*********************************************************************
         * Get the stored layout for a given list list.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         *     listId: <guid>, // the guid of the list you want a context for,
         *         // default undefined meaning current list
         * }
         *
         * @returns {object} - the layout.
         *********************************************************************/
        getLayout: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.currentContext = this.get(opt);
            opt.listId = this.getCurrentListId(opt);
            if (opt.listId === undefined || opt.listId.length === 0) {
                return undefined;
            }            
            var listctx;
            if (opt.useCache && opt.listId in opt.currentContext.listContexts) {
                listctx = opt.currentContext[opt.listId];
            }
            if (listctx === undefined) {
                listctx = this.getListContext(opt);
            }
            if (opt.useCache && listctx !== undefined && listctx.layout !== undefined) {
                return listctx.layout;
            }

            var resultText = '';
            $.ajax({
                type: "GET",
                url: opt.currentContext.webAppUrl + opt.currentContext.webRelativeUrl + "/SiteAssets/spef-layout-" +
                    opt.listId + ".txt",
                headers: {
                    "Content-Type": "text/plain"
                },
                async: false,
                cache: false,
                success: function (data) {
                    resultText = data;
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    if (xhr.status != 404) {
                        alert("Error getting configuration.\nStatus: " + xhr.status +
                              "\nStatus Text: " + thrownError);
                    }
                }
            });
            var result = utils.parseJSON(resultText);
            if (opt.useCache) {
                opt.currentContext.listContexts[opt.listId].layout = result;
                spEasyForms.writeCachedContext(opt);
            }
            return result;
        },

        /*********************************************************************
         * Get the current list id.  First check for ListId in the request params,
         * and if not present use spContext.get().ListId.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         * }
         *
         * @returns {string} - the guid of the list.
         *********************************************************************/
        getCurrentListId: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var currentContext;
            if("currentContext" in opt) {
                currentContext = opt.currentContext;
            }
            else {
                currentContext = this.get(opt);
            }
            if (!("listId" in opt)) {
                opt.listId = utils.getRequestParameters().ListId;
                if (opt.listId === undefined) {
                    opt.listId = currentContext.listId;
                }
            }
            return opt.listId;
        },
        
        /*********************************************************************
         * Get the current site relative url.  First check the request params for
         * SiteUrl, and if not present use spContext.get().webRelativeUrl.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for 
         *     // additional globally applicable options
         * }
         *
         * @returns {string} - the relative url of the current site (SPWeb).
         *********************************************************************/
        getCurrentSiteUrl: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!("siteUrl" in opt)) {
                opt.siteUrl = utils.getRequestParameters().SiteUrl;
                if (opt.siteUrl === undefined) {
                    opt.siteUrl = _spPageContextInfo.webServerRelativeUrl;
                } else {
                    var a = document.createElement("a");
                    a.href = opt.siteUrl;
                    opt.siteUrl = '/' + a.pathname;
                }
            }
            return opt.siteUrl;
        }
    };
    var spContext = $.spEasyForms.sharePointContext;

    $.spEasyForms.utilities = {
        /*********************************************************************
         * Get value from a display form row.
         *
         * @param {object} tr - the jQuery obect representing a row in the 
         * form table.
         *
         * @returns {object} - {
         *     internalName: <string>, // the field internal name
         *     displayName: <string>, // the display name of the field
         *     type: <string>, // the SPField type
         *     value: <string> // the current value of the field
         * }
         *********************************************************************/
        row2FieldRef: function (tr) {
            var result = {
                internalName: "",
                displayName: "",
                type: "",
                value: ""
            };
            var src = tr.html();
            try {
                result.internalName = src.match(/FieldInternalName=\"([^\"]*)\"/)[1];
                result.displayName = src.match(/FieldName=\"([^\"]*)\"/)[1];
                result.type = src.match(/FieldType=\"([^\"]*)\"/)[1];
                switch (result.type) {
                    case "SPFieldNote":
                        result.value = tr.find("td[id^='SPField']").find("div")
                            .html().trim();
                        break;
                    case "SPFieldURL":
                        result.value = tr.find("td[id^='SPField']").find("img")
                            .attr("src");
                        break;
                    default:
                        result.value = tr.find("td[id^='SPField']").text().trim();
                        break;
                }
                if (typeof (result.value) == 'undefined') result.value = '';
            } catch (e) {
                console.log(e);
            }
            return result;
        },

        /*********************************************************************
         * Wrapper for jQuery.parseJSON; I really don't want to check for null
         * or undefined everywhere to avoid exceptions. I'd rather just get 
         * null or undefined out for null or undefined in with no exception,
         * and jQuery used to work this way but doesn't any more
         * thus the wrapper.
         *
         * @param {string} json - a string representation of a json object
         * @returns {object} - the deserialized object
         *********************************************************************/
        parseJSON: function (json) {
            if (typeof (json) == 'undefined' || json === null || json.length === 0)
                return undefined;
            return $.parseJSON(json);
        },

        /*********************************************************************
         * Get a map of name/value pairs (request paramaters for the 
         * current page).
         *
         * @returns {
         *     <name>: <value>, // the name of the parameter mapped to the
         *                      // decoded value
         *     ...              // one property for each request parameter
         * }
         *********************************************************************/
        getRequestParameters: function () {
            var result = {};
            if(window.location.search.length > 0 && window.location.search.indexOf('?') >= 0) {
                var nvPairs = window.location.search.slice(
                    window.location.search.indexOf('?') + 1).split('&');
                for (var i = 0; i < nvPairs.length; i++) {
                    var nvPair = nvPairs[i].split('=', 2);
                    if (nvPair.length == 2) {
                        result[nvPair[0]] = decodeURIComponent(nvPair[1]);
                    }
                }
            }
            return result;
        }
    };
    var utils = $.spEasyForms.utilities;
    
    if (typeof(PreSaveItem) !== 'undefined') {
        var originalPreSaveItem = PreSaveItem;
        PreSaveItem = function() {
            var result = master.preSaveItem();
            if(result && "function" === typeof(OriginalPreSaveItem)) {
                return originalPreSaveItem();
            }
            return result;
        };
    }
})(jQuery);


if (window.location.href.indexOf('fiddle') >= 0) {
    _spPageContextInfo = {
        siteServerRelativeUrl: "/sites/devjmcshea",
        webServerRelativeUrl: "/sites/devjmcshea",
        webUIVersion: 15,
        pageListId: "{8fcf63aa-827d-4b9b-88bb-958abb8bf105}",
        userId: 9
    };
    var hardCodedCache = {
        "spEasyForms_spContext_/sites/devjmcshea": {
            "siteRelativeUrl": "/sites/devjmcshea",
            "webAppUrl": "https://flexpointtech.sharepoint.com",
            "webRelativeUrl": "/sites/devjmcshea",
            "webUIVersion": 15,
            "listId": "{8fcf63aa-827d-4b9b-88bb-958abb8bf105}",
            "userId": 9,
            "userProfile": {},
            "userInformation": {
                "name": "i:0#.f|membership|jmcshea@haystax.com",
                "title": "Joe McShea",
                "eMail": "jmcshea@haystax.com",
                "mobilePhone": "703-439-7822",
                "notes": "",
                "picture": "https://flexpointtech-my.sharepoint.com:443/User%20Photos/Profile%20Pictures/jmcshea_haystax_com_MThumb.jpg",
                "department": "",
                "jobTitle": "",
                "sipAddress": "jmcshea@haystax.com",
                "firstName": "Joe",
                "lastName": "McShea",
                "workPhone": "",
                "userName": "jmcshea@haystax.com",
                "webSite": "",
                "sPSResponsibility": "",
                "office": "",
                "sPSPictureTimestamp": "63531755205",
                "sPSPicturePlaceholderState": "",
                "sPSPictureExchangeSyncState": "",
                "attachments": ""
            },
            "groups": {
                "6": {
                    "name": "Joe McShea - Dev Site Owners",
                    "id": "6"
                },
                "8": {
                    "name": "Joe McShea - Dev Site Members",
                    "id": "8"
                },
                "19": {
                    "name": "Test Group",
                    "id": "19"
                },
                "Joe McShea - Dev Site Members": {
                    "name": "Joe McShea - Dev Site Members",
                    "id": "8"
                },
                "Joe McShea - Dev Site Owners": {
                    "name": "Joe McShea - Dev Site Owners",
                    "id": "6"
                },
                "Test Group": {
                    "name": "Test Group",
                    "id": "19"
                }
            },
            "listContexts": {
                "{8fcf63aa-827d-4b9b-88bb-958abb8bf105}": {
                    "fields": {
                        "Title": {
                            "internalName": "Title",
                            "displayName": "Last Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Last Name": {
                            "internalName": "Title",
                            "displayName": "Last Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "FirstName": {
                            "internalName": "FirstName",
                            "displayName": "First Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "First Name": {
                            "internalName": "FirstName",
                            "displayName": "First Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "FullName": {
                            "internalName": "FullName",
                            "displayName": "Full Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Full Name": {
                            "internalName": "FullName",
                            "displayName": "Full Name",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Email": {
                            "internalName": "Email",
                            "displayName": "Email Address",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Email Address": {
                            "internalName": "Email",
                            "displayName": "Email Address",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Company": {
                            "internalName": "Company",
                            "displayName": "Company",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "JobTitle": {
                            "internalName": "JobTitle",
                            "displayName": "Job Title",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Job Title": {
                            "internalName": "JobTitle",
                            "displayName": "Job Title",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkPhone": {
                            "internalName": "WorkPhone",
                            "displayName": "Business Phone",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Business Phone": {
                            "internalName": "WorkPhone",
                            "displayName": "Business Phone",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "HomePhone": {
                            "internalName": "HomePhone",
                            "displayName": "Home Phone",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Home Phone": {
                            "internalName": "HomePhone",
                            "displayName": "Home Phone",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "CellPhone": {
                            "internalName": "CellPhone",
                            "displayName": "Mobile Number",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Mobile Number": {
                            "internalName": "CellPhone",
                            "displayName": "Mobile Number",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkFax": {
                            "internalName": "WorkFax",
                            "displayName": "Fax Number",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Fax Number": {
                            "internalName": "WorkFax",
                            "displayName": "Fax Number",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkAddress": {
                            "internalName": "WorkAddress",
                            "displayName": "Address",
                            "type": "SPFieldNote",
                            "value": ""
                        },
                        "Address": {
                            "internalName": "WorkAddress",
                            "displayName": "Address",
                            "type": "SPFieldNote",
                            "value": ""
                        },
                        "WorkCity": {
                            "internalName": "WorkCity",
                            "displayName": "City",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "City": {
                            "internalName": "WorkCity",
                            "displayName": "City",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkState": {
                            "internalName": "WorkState",
                            "displayName": "State/Province",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "State/Province": {
                            "internalName": "WorkState",
                            "displayName": "State/Province",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkZip": {
                            "internalName": "WorkZip",
                            "displayName": "ZIP/Postal Code",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "ZIP/Postal Code": {
                            "internalName": "WorkZip",
                            "displayName": "ZIP/Postal Code",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WorkCountry": {
                            "internalName": "WorkCountry",
                            "displayName": "Country/Region",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "Country/Region": {
                            "internalName": "WorkCountry",
                            "displayName": "Country/Region",
                            "type": "SPFieldText",
                            "value": ""
                        },
                        "WebPage": {
                            "internalName": "WebPage",
                            "displayName": "Web Page",
                            "type": "SPFieldURL",
                            "value": ""
                        },
                        "Web Page": {
                            "internalName": "WebPage",
                            "displayName": "Web Page",
                            "type": "SPFieldURL",
                            "value": ""
                        },
                        "Comments": {
                            "internalName": "Comments",
                            "displayName": "Notes",
                            "type": "SPFieldNote",
                            "value": ""
                        },
                        "Notes": {
                            "internalName": "Comments",
                            "displayName": "Notes",
                            "type": "SPFieldNote",
                            "value": ""
                        },
                        "Attachments": {
                            "internalName": "Attachments",
                            "displayName": "Attachments",
                            "type": "SPFieldAttachments",
                            "value": ""
                        }
                    },
                    "layout": [{
                        "containerType": "Tabs",
                        "index": "0",
                        "fieldGroups": [
                            {
                                "name": "one",
                                "fields": [
                                    {
                                        "fieldInternalName": "Title"
                                    },
                                    {
                                        "fieldInternalName": "FirstName"
                                    }
                                ]
                            },
                            {
                                "name": "two",
                                "fields": [
                                    {
                                        "fieldInternalName": "FullName"
                                    },
                                    {
                                        "fieldInternalName": "JobTitle"
                                    },
                                    {
                                        "fieldInternalName": "Email"
                                    },
                                    {
                                        "fieldInternalName": "Company"
                                    }
                                ]
                            }
                        ]
                    }, {
                        "containerType": "DefaultForm"
                    }, {
                        "containerType": "Accordion",
                        "fieldGroups": [{
                            "name": "alpha",
                            "fields": [{
                                "fieldInternalName": "WorkState"
                            }]
                        }, {
                            "name": "beta",
                            "fields": [{
                                "fieldInternalName": "CellPhone"
                            }]
                        }]
                    }]
                }
            }
        }
    };
    $().ready(function () {
        $.spEasyForms.defaults = $.extend({}, $.spEasyForms.defaults, {
            useCache: true,
            cache: hardCodedCache
        });
        $.spEasyForms.init();
    });
}