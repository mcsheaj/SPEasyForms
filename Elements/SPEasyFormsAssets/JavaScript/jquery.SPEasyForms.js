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
 * TBD - cleanup/normalize
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
        /*
         * You must set useCache to false before any call to a function that
         * uses the cross-page cache or a cross-paged cached object is already
         * in use.  Most objects will only be loaded once within a page
         * regardless of the value of this option, so once a cross-page cached
         * object is in use it will continue to be used even if you set this
         * option to false later.  
         */
        defaults: {
            // use cross-page caching
            useCache: (typeof (ssw) != 'undefined' || typeof (ssw_init) != 'undefined'),
            // the maximum number of webs to cache
            maxWebCache: 6,
            // the maximum number of lists to cache per web
            maxListCache: 10,
            jQueryUITheme: undefined,
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
            //fieldDisplayNameAlt: /<nobr>([^<]*)</i,
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

            if (typeof (cache) === 'undefined' && opt.cache !== undefined) {
                cache = opt.cache;
            }

            if (typeof (ssw) == 'undefined' && typeof (ssw_init) != 'undefined') {
                ssw_init(window, document);
                if (typeof (cache) === 'undefined') {
                    cache = ssw.get();
                }
            }

            if(opt.jQueryUITheme === undefined) {
                opt.jQueryUITheme = _spPageContextInfo.siteServerRelativeUrl + 
                    '/Style Library/SPEasyFormsAssets/2014.00.01/Css/jquery-ui-redmond/jquery-ui.css';
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + opt.jQueryUITheme + '">');

            if (opt.css === undefined) {
                opt.css = _spPageContextInfo.siteServerRelativeUrl +
                    '/Style Library/SPEasyFormsAssets/2014.00.01/Css/speasyforms.css';
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + opt.css + '">');

            var groups = spContext.getGroups(opt);
            var userInfo = spContext.getUserInformation(opt);
            if (spContext.getCurrentListId(opt) !== undefined) {
                var listCtx = spContext.getListContext(opt);
            }

            opt.rows = spRows.init(opt);
            if (window.location.href.indexOf('SPEasyFormsSettings.aspx') >= 0 ||
                window.location.href.indexOf('fiddle') >= 0) {
                master.toEditor(opt);
            } else {
                master.transform(opt);
            }
            this.appendContext(opt);

            return this;
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
                spContext.ctx = undefined;
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
                var key = "spEasyForms_spContext_" + spContext.get().webRelativeUrl;

                if (!(key in cache)) {
                    if (Object.keys(cache).length >= opt.maxWebCache) {
                        ssw.remove(Object.keys(cache)[0]);
                    }
                }
                var obj = {};
                obj[key] = spContext.get();
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
                spContext.ctx = cache[key];
            }
        },

        /*********************************************************************
         * Append a dump of all of the cached context information to the body
         * of the current page.
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

        toEditor: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.listctx = spContext.getListContext(options);

            var currentListId = spContext.getCurrentListId(opt);
            if (opt.rows === undefined || Object.keys(opt.rows).length === 0) {
                if (currentListId !== undefined && currentListId.length > 0) {
                    $.ajax({
                        async: false,
                        cache: false,
                        url: spContext.get().webRelativeUrl +
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

            opt.layout = this.getLayout(opt);
            $("td.speasyforms-sortablecontainers").parent().remove();
            opt.fieldsInUse = this.initContainers(opt);
            this.initDefaultFieldGroup(opt);
            this.wireContainerEvents(opt);
            if (!this.initialized) {
                this.wireButtonEvents(opt);
                this.wireDialogEvents(opt);
            }
            this.transform(opt);
            $("#spEasyFormsOuterDiv").show();

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
                $.ajax({
                    url: spContext.get().webRelativeUrl + "/SiteAssets/spef-layout-" +
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

        settings: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("#addFieldGroupNames").val("");
            this.wireDialogEvents(opt);
            $("#addMultiGroupContainerDialog").dialog("open");
        },

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
            var tableClass = "speasyforms-accordions speasyforms-accordions" +
                opt.index + "" + idx;
            var tableId = "spEasyFormsTabsTable" + opt.index + "" + idx;
            $("#" + divId).append("<h3>" + fieldGroup.name + "</h3>");
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
    }
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
                    currentRow.row.appendTo("#" + tableId);
                }
            });
        });
        return result;
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
        });
        $("#" + divId).tabs({ heightStyle: "auto" });
        return result;
    }
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
            if (typeof (this.ctx) == 'undefined') {
                if (typeof (opt.useCache) != 'undefined' && opt.useCache) {
                    opt.siteUrl = this.getCurrentSiteUrl(opt);
                    spEasyForms.readCachedContext(opt);
                }
                if (typeof (this.ctx) == 'undefined') {
                    this.ctx = {};
                    this.ctx.siteRelativeUrl = _spPageContextInfo.siteServerRelativeUrl;
                    this.ctx.webAppUrl = window.location.href.substring(0,
                        window.location.href.indexOf(window.location.pathname));
                    this.ctx.webRelativeUrl = opt.siteUrl;
                    this.ctx.webUIVersion = _spPageContextInfo.webUIVersion;
                    if ("pageListId" in _spPageContextInfo) {
                        this.ctx.listId = _spPageContextInfo.pageListId;
                    } else {
                        this.ctx.listId = "";
                    }
                    this.ctx.userId = _spPageContextInfo.userId;
                    this.ctx.userProfile = {};
                    this.ctx.userInformation = {};
                    this.ctx.groups = {};
                    this.ctx.listContexts = {};
                    spEasyForms.writeCachedContext(opt);
                    return this;
                }
            }
            this.ctx.webUIVersion = _spPageContextInfo.webUIVersion;
            if ("pageListId" in _spPageContextInfo) {
                this.ctx.listId = _spPageContextInfo.pageListId;
            } else {
                this.ctx.listId = "";
            }
            return this.ctx;
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
            this.get(options);
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var user = (typeof (this.ctx.userInformation) != 'undefined' ?
                        this.ctx.userInformation : {});
            if (!('name' in this.ctx.userInformation) ||
                this.ctx.userInformation.name.length === 0 ||
                'userId' in opt) {
                var id = (typeof (opt.userId) != 'undefined' ? "ID=" +
                          opt.userId + "&" : "");
                $.ajax({
                    async: false,
                    url: this.ctx.webRelativeUrl +
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
                if (typeof (opt.userId) === 'undefined') {
                    this.ctx.userInformation = user;
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
            this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            var user = (typeof (this.ctx.userProfile) != 'undefined' ?
                        this.ctx.userProfile : {});
            if (typeof (this.ctx.userProfile.accountName) == 'undefined' ||
                (typeof (opt.accountName) != 'undefined' && opt.accountName.length > 0)) {
                var params = {
                    operation: 'GetUserProfileByName',
                    async: false,
                    completefunc: function (xData, Status) {
                        $(xData.responseXML).SPFilterNode(
                            "PropertyData").each(function () {
                                var name = $(this).find("Name").text().replace(
                                    "SPS-", "");
                                name = name[0].toLowerCase() + name.substring(
                                1);
                                user[name] = $(this).find("Value").text();
                            });
                    }
                };
                $().SPServices(params);
                if (typeof (opt.accountName) == 'undefined') {
                    this.ctx.userProfile = user;
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
            this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            var groups = ("groups" in this.ctx ? this.ctx.groups : {});
            if (("accountName" in opt && opt.accountName.length > 0) ||
                $.isEmptyObject(groups)) {
                $().SPServices({
                    operation: "GetGroupCollectionFromUser",
                    userLoginName: (
                    ("accountName" in opt && opt.accountName.length > 0) ? opt.accountName :
                        this.getUserInformation().name),
                    async: false,
                    completefunc: function (xData, Status) {
                        $(xData.responseXML).find("Group").each(

                        function () {
                            group = {};
                            group.name = $(this).attr("Name");
                            group.id = $(this).attr("ID");
                            groups[group.id] = group;
                            groups[group.name] = group;
                        });
                    }
                });
                if (!("loginName" in opt) || opt.loginName.length < 1) {
                    this.ctx.groups = groups;
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
            this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.listId = this.getCurrentListId();
            if (opt.listId === undefined || opt.listId.length === 0) {
                return undefined;
            }
            if (opt.listId in this.ctx.listContexts) {
                return this.ctx.listContexts[opt.listId];
            } else {
                result = {};
                result.fields = {};
                $.ajax({
                    async: false,
                    url: this.ctx.webRelativeUrl +
                        "/_layouts/listform.aspx?PageType=6&ListId=" +
                        opt.listId + "&RootFolder=",
                    complete: function (xData) {
                        $(xData.responseText).find(
                            "table.ms-formtable td.ms-formbody").each(

                        function () {
                            var tr = $(this).closest("tr");
                            var fieldRef = utils.row2FieldRef(tr);
                            result.fields[fieldRef.internalName] = fieldRef;
                            result.fields[fieldRef.displayName] = fieldRef;
                        });
                    }
                });
                var listCount = Object.keys(this.ctx.listContexts).length;
                if (listCount >= opt.maxListCache) {
                    delete this.ctx.listContexts[
                    Object.keys(this.ctx.listContexts)[0]];
                }
                this.ctx.listContexts[opt.listId] = result;
                spEasyForms.writeCachedContext(opt);
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
            var listctx = this.getListContext(opt);
            if (listctx === undefined) {
                return undefined;
            }
            if (listctx.layout !== undefined) {
                return listctx.layout;
            }
            opt.listId = this.getCurrentListId();
            if (opt.listId === undefined || opt.listId.length === 0) {
                return undefined;
            }
            var resultText = '';
            $.ajax({
                type: "GET",
                url: spContext.get().webRelativeUrl + "/SiteAssets/spef-layout-" +
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
            return utils.parseJSON(resultText);
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
            if (!("listId" in opt)) {
                opt.listId = utils.getRequestParameters().ListId;
                if (opt.listId === undefined) {
                    opt.listId = this.ctx.listId;
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
                    a = document.createElement("a");
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
            var nvPairs = window.location.search.slice(
            window.location.search.indexOf('?') + 1).split('&');
            for (var i = 0; i < nvPairs.length; i++) {
                var nvPair = nvPairs[i].split('=', 2);
                if (nvPair.length == 2) {
                    result[nvPair[0]] = decodeURIComponent(nvPair[1]);
                }
            }
            return result;
        }
    };
    var utils = $.spEasyForms.utilities;
})(jQuery);

