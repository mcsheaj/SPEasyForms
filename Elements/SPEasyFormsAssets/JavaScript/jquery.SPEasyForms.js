/*
 * SPEasyForms - modify SharePoint forms using jQuery (i.e. put fields on
 * tabs, show/hide fields, validate field values, modify the controls used
 * to enter field values etc.)
 *
 * @version 2014.00.08.e
 * @requires jQuery v1.11.1 
 * @requires jQuery-ui v1.9.2 
 * @requires jQuery.SPServices v2014.01 or greater
 * @optional ssw Session Storage Wrapper - Cross Document Transport of
 *    JavaScript Data; used to cache the context across pages if available
 *    and options.useCache === true
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

// save a reference to our instance of jQuery just in case
spefjQuery = jQuery.noConflict(true);

function shouldSPEasyFormsRibbonButtonBeEnabled() {
    if (spefjQuery.spEasyForms.isConfigurableList()) {
        return true;
    } else {
        return false;
    }
}

(function($, undefined) {

    // cross-page caching object
    var cache = (typeof(ssw) != 'undefined' ? ssw.get() : undefined);

    // define Object.keys for browsers that don't support it
    if (!Object.keys) {
        Object.keys = function(obj) {
            return $.map(obj, function(v, k) {
                return k;
            });
        };
    }

    // define Object.create for bowsers that don't support it
    if (!Object.create) {
        Object.create = function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    ////////////////////////////////////////////////////////////////////////////
    // Main entry point is init.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms = {
        defaults: {
            // use cross-page caching
            useCache: (typeof(ssw) != 'undefined' || typeof(ssw_init) != 'undefined'),
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
            formBodySelector: "table td.ms-formbody",
            // regex for capturing field internal name, expects 
            // .match(tr.html(fieldInternalNameRegex)) result in match[1]
            fieldInternalNameRegex: /FieldInternalName=\"([^\"]*)\"/i,
            // regex for capturing field display name, expects 
            // tr.html().match() result in match[1]
            fieldDisplayNameRegex: /FieldName=\"([^\"]*)\"/i,
            // regex for capturing field type, expects tr.html().match() 
            // result in match[1]
            fieldTypeRegex: /FieldType=\"([^\"]*)\"/i,
            // if the above expressions do not work, this selector will be used to find
            // the field display name, pulling it's text and stripping any * or leading/trailing white space
            fieldDisplayNameAltSelector: 'h3.ms-standardheader',
            // appends a table with a bunch of context info to the page body
            verbose: window.location.href.indexOf('spEasyFormsVerbose=true') >= 0,
            initAsync: window.location.href.indexOf('spEasyFormsAsync=false') < 0
        },

        /********************************************************************
         * Are we in a list context for a list type that SPEasyForms 
         * supports (currently we do not support Surveys or Discussion Boards,
         * but the list may grow as testing continues).
         ********************************************************************/
        isConfigurableList: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we wern't passed a list context, try to get one
            if (!opt.currentListContext) {
                opt.currentListContext = spContext.getListContext(this.defaults);
            }
            // if we still don't have a list context
            if (!opt.currentListContext) {
                return false;
            }
            // if the list template is one we don't support
            if (opt.currentListContext.template === "102" || // survey
                opt.currentListContext.template === "108") { // discussion
                return false;
            }
            return true;
        },

        /********************************************************************
         * Initialize the library.  If we're on a form
         * that's been configured, apply configured transformations.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        init: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            this.initCacheLibrary(opt);
            this.loadDynamicStyles(opt);
            opt.callback = spEasyForms.contextReady;
            this.options = opt;
            $("#spEasyFormsBusyScreen").dialog({
                autoOpen: false,
                dialogClass: "speasyforms-busyscreen",
                closeOnEscape: false,
                draggable: false,
                width: 250,
                minHeight: 25,
                modal: true,
                buttons: {},
                resizable: false
            });
            $("#spEasyFormsBusyScreen").html("Initializing Form...").dialog('open');
            if (opt.initAsync) {
                spContext.initAsync(opt);
            } else {
                this.contextReady(options);
            }
        },

        /********************************************************************
         * Callback to complete initialization after all asynchronous calls
         * are complete.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        contextReady: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            try {
                opt.currentContext = spContext.get(opt);
                opt.source = utils.getRequestParameters(opt).Source;
                opt.currentListContext = spContext.getListContext(opt);

                /***
                 * Produce the editor on the SPEasyForms settings page.
                 ***/
                if (spEasyForms.isSettingsPage(opt)) {
                    spEasyForms.toEditor(opt);
                }
                /***
                 * If it looks like a transformable form, try to transform it.
                 ***/
                else if (spEasyForms.isTransformable(opt)) {
                    spEasyForms.transform(opt);
                }
                /***
                 * If it looks like a transformable list settings page, insert an SPEasyForms link.
                 ***/
                else if (spEasyForms.isConfigurableListSettings(opt)) {
                    spEasyForms.insertSettingsLink(opt);
                }
            } finally {
                $("table.ms-formtable ").show();
                $("#spEasyFormsBusyScreen").dialog('close');
            }
            return this;
        },

        /********************************************************************
         * Are we on the OOB list settings page (listedit.aspx) for a list 
         * type that SPEasyForms supports.
         ********************************************************************/
        isConfigurableListSettings: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we're not in the context of a configurable list
            if (!spEasyForms.isConfigurableList(opt)) {
                return false;
            }
            return window.location.href.toLowerCase().indexOf("listedit.aspx") >= 0;
        },

        /********************************************************************
         * Are we on the SPEasyForms settings page (SPEassyFormsSettings.aspx).
         ********************************************************************/
        isSettingsPage: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we're not in the context of a configurable list
            if (!spEasyForms.isConfigurableList(opt)) {
                if (window.location.href.toLowerCase().indexOf('speasyformssettings.aspx') >= 0) {
                    $("#spEasyFormsInitializationError").show();
                }
                return false;
            }
            return window.location.href.toLowerCase().indexOf('speasyformssettings.aspx') >= 0;
        },

        /********************************************************************
         * Are we on the new, edit, or display form of a list type that
         * SPEasyForms supports.
         ********************************************************************/
        isTransformable: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we're not in the context of a configurable list
            if (!spEasyForms.isConfigurableList(opt)) {
                return false;
            }
            // if the page name doesn't contain new, edit, or view
            if (visibilityRuleCollection.getFormType(opt).length === 0) {
                return false;
            }
            // if we're on a new form for a folder
            if (visibilityRuleCollection.getFormType(opt) === "new" && window.location.href.toLowerCase().indexOf("&type=1&") >= 0) {
                return false;
            }
            // if we're on any other form for a folder
            else if (window.location.href.toLowerCase().indexOf("&contenttypeid=0x0120") >= 0) {
                return false;
            }
            return true;
        },

        /********************************************************************
         * See if we have a configuration for the current list context and if so
         * execute any transformations, visibility rules, and/or field adapters
         * in the configuration.
         ********************************************************************/
        transform: function(opt) {
            opt.currentConfig = configManager.get(opt);
            // convert all lookups to simple selects, only for 2010 and
            // earlier, from Marc Anderson's SPServices documentation and 
            // attributed to Dan Kline
            $('.ms-lookuptypeintextbox').each(function() {
                $().SPServices.SPComplexToSimpleDropdown({
                    columnName: $(this).attr('title'),
                    debug: opt.verbose
                });
            });
            // add ms-formtable to the...um, form table. For some reason 
            // designer does not put this in custom forms.
            if ($("table.ms-formtable").length === 0) {
                $("td.ms-formlabel h3.ms-standardheader").closest("table").addClass("ms-formtable");
            }
            containerCollection.transform(opt);
            // Override the core.js PreSaveItem function, to allow containers 
            // and/or adapters to react to validation errors.
            if (typeof(PreSaveItem) !== 'undefined') {
                var originalPreSaveItem = PreSaveItem;
                PreSaveItem = function() {
                    var result = containerCollection.preSaveItem();
                    if (result && "function" === typeof(originalPreSaveItem)) {
                        return originalPreSaveItem();
                    }
                    return result;
                };
            }
            // override the save button in 2013/O365 so validation 
            // occurs before PreSaveAction, like it did in previous
            // version of SharePoint
            $("input[value='Save']").each(function() {
                var onSave = this.getAttributeNode("onclick").nodeValue;
                onSave = onSave.replace(
                    "if (SPClientForms.ClientFormManager.SubmitClientForm('WPQ2')) return false;", "");
                var newOnSave = document.createAttribute('onclick');
                newOnSave.value = onSave;
                this.setAttributeNode(newOnSave);
            });
            spEasyForms.appendContext(opt);
        },

        /********************************************************************
         * See if we have a configuration for the current list context and setup
         * the editor for the current configuration (or the default configuration).
         ********************************************************************/
        toEditor: function(opt) {
            opt.currentConfig = configManager.get(opt);
            $(".ms-cui-topBar2").prepend("<h2 class='speasyforms-breadcrumbs'><a href='" + opt.source + "'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h2>");
            $.each(opt.currentListContext.contentTypes.order, function(i, ctid) {
                if(ctid.indexOf("0x0120") !== 0) {
                    $("#spEasyFormsContentTypeSelect").append("<option value='" +
                        opt.currentListContext.contentTypes[ctid].id + "'>" + 
                        opt.currentListContext.contentTypes[ctid].name + "</option>");
                }
            });
            /*
            var ctWidth = $("#spEasyFormsContentTypeSelect").width();
            if(ctWidth > 54) {
                $("#spEasyFormsContentType").width(ctWidth + 10);
                $("#spEasyFormsContentType").parent().find(".speasyforms-buttongrptext").width(ctWidth + 60);
            }
            */
            $("#spEasyFormsContentTypeSelect").change(function() {
                delete containerCollection.rows;
                delete spContext.formCache;
                opt.contentTypeChanged = true;
                containerCollection.toEditor(opt);
            });
            containerCollection.toEditor(opt);
            $(window).on("beforeunload", function() {
                if(!$("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled")) {
                    return "You have unsaved changes, are you sure you want to leave the page?";
                }
            });
            spEasyForms.appendContext(opt);
            $("div.speasyforms-panel").height($(window).height()-180);
            $(window).resize(function() {
                $("div.speasyforms-panel").height($(window).height()-180);
            });
        },

        /********************************************************************
         * Add a link to the SPEasyForms settings page to an OOB list settings
         * page (listedit.aspx).
         ********************************************************************/
        insertSettingsLink: function(opt) {
            var generalSettings = $("td.ms-descriptiontext:contains('description and navigation')").closest("table");
            if (generalSettings.length > 0) {
                source = window.location.href;
                if (source.indexOf("start.aspx#") >= 0) {
                    source = spContext.getCurrentSiteUrl() + source.substring(source.indexOf('#') + 1);
                }
                var settings = opt.currentContext.siteRelativeUrl +
                    "/Style Library/SPEasyFormsAssets/2014.00.08.e/Pages/SPEasyFormsSettings.aspx?" +
                    "ListId=" + spContext.getCurrentListId(opt) +
                    "&SiteUrl=" + spContext.getCurrentSiteUrl(opt) +
                    "&Source=" + encodeURIComponent(source);
                var newRow = "<tr>" +
                    "<td style='padding-top: 5px;' " +
                    "class='ms-descriptiontext ms-linksectionitembullet' " +
                    "vAlign='top' width='8' noWrap='nowrap'>" +
                    "<img alt='' src='/_layouts/images/setrect.gif?rev=37' width='5' height='5' />" +
                    "&nbsp;</td>" +
                    "<td class='ms-descriptiontext ms-linksectionitemdescription' vAlign='top'> " +
                    "<a href='" + settings + "'>SPEasyForms Configuration</a>" +
                    "</td>" +
                    "</tr>";
                generalSettings.append(newRow);
            }
        },

        /********************************************************************
         * Initialize the ssw caching library.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        initCacheLibrary: function(options) {
            if (typeof(cache) === 'undefined' && options.cache !== undefined) {
                cache = options.cache;
            }

            if (typeof(ssw) == 'undefined' && typeof(ssw_init) != 'undefined') {
                ssw_init(window, document);
                if (typeof(cache) === 'undefined') {
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
            if (options.jQueryUITheme === undefined) {
                options.jQueryUITheme =
                    (_spPageContextInfo.siteServerRelativeUrl != "/" ?
                    _spPageContextInfo.siteServerRelativeUrl : "") +
                    '/Style Library/SPEasyFormsAssets/2014.00.08.e/Css/jquery-ui/jquery-ui.css';
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + options.jQueryUITheme + '">');

            if (options.css === undefined) {
                options.css =
                    (_spPageContextInfo.siteServerRelativeUrl != "/" ?
                    _spPageContextInfo.siteServerRelativeUrl : "") +
                    '/Style Library/SPEasyFormsAssets/2014.00.08.e/Css/speasyforms.css';
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
        clearCachedContext: function(options) {
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
        writeCachedContext: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (typeof(ssw) != 'undefined') {
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
        readCachedContext: function(options) {
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
        appendContext: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (spEasyForms.defaults.verbose) {
                $('#outputTable').remove();
                var output = "<table id='outputTable'><tr><td></td>" +
                    "<a href='javascript:void(0)' class='nobr' id='toggleContext'>Toggle Context</a>" + 
                    "</tr><tr id='contextRow' style='display:none'><td><pre>";
                output += "_spPageContextInfo = {\r\n" +
                    "    siteServerRelativeUrl: '" + opt.currentContext.siteRelativeUrl + "',\r\n" +
                    "    webServerRelativeUrl: '" + opt.currentContext.webRelativeUrl + "',\r\n" +
                    "    webUIVersion: 15,\r\n" +
                    "    pageListId: '" + spContext.getCurrentListId(opt) + "',\r\n" +
                    "    userId: " + opt.currentContext.userId + "\r\n" +
                    "};\r\n";
                output += "var cache = " + JSON.stringify(cache, null, 4) + ";\r\n";
                output += "cache['spEasyForms_spContext_" +
                    opt.currentContext.webRelativeUrl + "'].groups = " +
                    JSON.stringify(spContext.getUserGroups(opt), null, 4) + ";\r\n";
                output += "cache['spEasyForms_spContext_" +
                    opt.currentContext.webRelativeUrl + "'].siteGroups = " +
                    JSON.stringify(spContext.getSiteGroups(opt), null, 4) + ";\r\n";
                output += "cache['spEasyForms_spContext_" + opt.currentContext.webRelativeUrl + "']." +
                    "listContexts['" + opt.currentContext.listId + "'].config = " +
                    JSON.stringify(opt.currentConfig, null, 4) + ";\r\n";
                output += "$().ready(function () {\r\n" +
                    "    $.spEasyForms.defaults = $.extend({}, $.spEasyForms.defaults, {\r\n" +
                    "        useCache: true,\r\n" +
                    "        cache: cache\r\n" +
                    "    });\r\n" +
                    "    $.spEasyForms.init();\r\n" +
                    "});\r\n";
                output += "</pre></td></tr></table>";
                if (window.location.href.toLowerCase().indexOf('fiddle') <= 0) {
                    $("#s4-bodyContainer").append(output);
                } else {
                    $("body").append(output);
                }
                $("#toggleContext").click(function() {
                    $("#contextRow").toggle();
                });
            }
        }
    };
    var spEasyForms = $.spEasyForms;

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
            var opt = $.extend({}, spEasyForms.defaults, options);
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

                opt.currentConfig = configManager.get(opt);
                opt.prepend = true;
                $.each(opt.currentConfig.layout.def, function(index, layout) {
                    var implementation = layout.containerType[0].toLowerCase() +
                        layout.containerType.substring(1);
                    if (implementation in containerCollection.containerImplementations) {
                        var impl = containerCollection.containerImplementations[implementation];
                        if(typeof(impl.transform) === 'function') {
                            opt.index = index;
                            opt.currentContainerLayout = layout;
                            opt.containerId = "spEasyFormsContainers" + (opt.prepend ? "Pre" : "Post");                            
                            $.merge(fieldsInUse, impl.transform(opt));
                        }
                    }
                    if (layout.containerType != defaultFormContainer.containerType) {
                        if ($("#" + opt.containerId).children().last().find("td.ms-formbody").length === 0) {
                            $("#" + opt.containerId).children().last().hide();
                        }
                    }
                    else {
                        opt.prepend = false;
                    }
                });

                this.highlightValidationErrors(opt);

                if (window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                    visibilityRuleCollection.transform(opt);
                    adapterCollection.transform(opt);
                }
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
            var opt = $.extend({}, spEasyForms.defaults, options);

            this.initializeRows(opt);

            // draw the editor properties panel
            opt.currentConfig = configManager.get(opt);
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

            visibilityRuleCollection.toEditor(opt);
            adapterCollection.toEditor(opt);
            this.initializeHiddenObjects(opt);

            $(".speasyforms-dblclickdialog").dblclick(function(e) {
                opt.dialogType = $(this).parent().attr("data-dialogtype");
                opt.fieldName = $(this).parent().attr("data-fieldname");
                if(opt.fieldName in containerCollection.rows) {
                    opt.spFieldType = containerCollection.rows[opt.fieldName].spFieldType;
                }
                else {
                    opt.spFieldType = opt.fieldName;
                }
                if (opt.dialogType === "visibility") {
                    visibilityRuleCollection.launchDialog(opt);
                } else if (opt.dialogType === "adapter") {
                    adapterCollection.launchDialog(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
            var containers = $("td.speasyforms-sortablecontainers");
            var result = configManager.get(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, {});
            var result = true;

            var hasValidationErrors = false;
            if (typeof(SPClientForms) !== 'undefined' &&
                typeof(SPClientForms.ClientFormManager) !== 'undefined' &&
                typeof(SPClientForms.ClientFormManager.SubmitClientForm) === "function") {
                hasValidationErrors = SPClientForms.ClientFormManager.SubmitClientForm('WPQ2');
            }
            
            result = result && adapterCollection.preSaveItem(opt);
            if (hasValidationErrors) {
                result = result && this.highlightValidationErrors(opt);
            }

            return result && !hasValidationErrors;
        },

        highlightValidationErrors: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = true;
            var config = configManager.get(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
            var fieldsInUse = [];
            var defaultFormContainerId;
            $.each(opt.currentConfig.layout.def, function(index, layout) {
                opt.id = "spEasyFormsContainer" + index;
                opt.title = layout.containerType;
                opt.currentContainerLayout = layout;
                opt.containerIndex = (layout.index !== undefined ? layout.index : index);
                containerCollection.appendContainer(opt);
                if (layout.containerType != defaultFormContainer.containerType) {
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
            defaultFormContainer.toEditor(opt);
            return fieldsInUse;
        },
        
        initConditionalFieldChoices: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            
            var fields = {};
            $.each(Object.keys(containerCollection.rows), function(idx, name) {
                fields[containerCollection.rows[name].displayName] = containerCollection.rows[name];
            });
            $.each(Object.keys(fields).sort(), function(idx, displayName) {
                var name = fields[displayName].internalName;
                if(name !== defaultFormContainer.containerType) {
                    $(".speasyforms-conditionalfield").append(
                        '<option value="' + name + '">' + displayName + '</option>');
                }
            });
            
            $.each(Object.keys(visibilityRuleCollection.stateHandlers), function(idx, name) {
                $("#addVisibilityRuleState").append("<option>" + utils.titleCase(name) + "</option>");
            });
            
            $.each(Object.keys(visibilityRuleCollection.comparisonOperators), function(idx, name) {
                $(".speasyforms-conditionaltype").append("<option>" + utils.titleCase(name) + "</option>");
            });
            
            $(".speasyforms-conditionalvalue[value='']").not(":first").parent().hide();
        },
        
        initializeRows: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var currentContentType = $("#spEasyFormsContentTypeSelect").val();
            if(window.location.href.indexOf("SPEasyFormsSettings.aspx") < 0) {
                containerCollection.rows = spRows.init(opt);
            }
            else if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                if (!containerCollection.currentCt || containerCollection.currentCt !== currentContentType) {
                    containerCollection.currentCt = currentContentType;
                    if(containerCollection.currentCt in containerCollection.rowCache) {
                        containerCollection.rows = containerCollection.rowCache[containerCollection.currentCt];
                    }
                }
                else {
                    containerCollection.rows = spRows.init(opt);
                }
                if (!containerCollection.rows || Object.keys(containerCollection.rows).length === 0) {
                    var currentListId = spContext.getCurrentListId(opt);
                    if (currentListId !== undefined && currentListId.length > 0) {
                        var formText = "";
                        if (spContext.formCache !== undefined) {
                            formText = spContext.formCache;
                        } else {
                            $.ajax({
                                async: false,
                                cache: false,
                                url: spContext.getCurrentSiteUrl(opt) +
                                    "/_layouts/listform.aspx?PageType=8&ListId=" +
                                    currentListId + 
                                    ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") + 
                                    "&RootFolder=",
                                complete: function(xData) {
                                    formText = xData.responseText;
                                }
                            });
                        }
        
                        opt.input = $(formText);
                        containerCollection.rows = spRows.init(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!this.initialized && $("td.speasyforms-sortablecontainers").length > 2) {
                $("td.speasyforms-sortablecontainers").each(function(event) {
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
                    var container = $("td[data-containerIndex='" + obj.primaryIndex + "']");
                    if ("secondaryIndex" in obj) {
                        $("td[data-containerIndex='" + obj.primaryIndex + "']").find(
                            "table[data-tableIndex='" + obj.secondaryIndex + "']").hide();
                    } else {
                        container.find(".speasyforms-sortablefields").hide();
                    }
                }
            }
            
        },
        
        /*********************************************************************
         * Wire the container sorting, clicking, and editor button events.
         *********************************************************************/
        wireContainerEvents: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            
            var top = 0;
            // make the field rows in the editor sortable
            $("tbody.speasyforms-sortablefields").sortable({
                connectWith: ".speasyforms-sortablefields",
                items: "> tr:not(:first)",
                helper: "clone",
                zIndex: 990,
                beforeStop: function(event, ui) {
                },
                change: function(event, ui) {
                },
                sort: function(event, ui) {
                },
                // added to fix issues with huge placeholder in SP 2010
                start: function(event, ui) {
                    top = $("div.speasyforms-panel").scrollTop();
                },
                stop: function(event, ui) {
                    $("div.speasyforms-panel").scrollTop(top);
                },
                update: function(event, ui) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        configManager.set(opt);
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
                update: function(event, ui) {
                    if (!event.handled) {
                        opt.currentConfig = containerCollection.toConfig(opt);
                        configManager.set(opt);
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                },
                // added to fix issues with huge placeholder in SP 2010
                start: function(event, ui) {
                    ui.placeholder.height("100px");
                }
            });

            // make the field tables individually collapsible
            $("h3.speasyforms-sortablefields").dblclick(function(e) {
                if (e.handled !== true) {
                    var currentId, i, j;
                    if ($(this).next().length === 0) {
                        $(this).closest("table").next().toggle();
                        i = $(this).closest("table").closest("td").attr("data-containerIndex");
                        j = $(this).closest("table").next().attr("data-tableIndex");
                        if ($(this).closest("table").next().css("display") == "none") {
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
                        if ($(this).next().css("display") == "none") {
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
                        .css("display") == "none") {
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
                configManager.set(opt);
                containerCollection.toEditor(opt);
                return false;
            });
        },

        /*********************************************************************
         * Wire the top/bottom button bar events.
         *********************************************************************/
        wireButtonEvents: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            // wire the save button
            $("#spEasyFormsSaveButton").click(function(event) {
                if($("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return;
                    
                if (!event.handled) {
                    configManager.save(opt);
                    event.handled = true;
                }
                return false;
            });

            // wire the cancel button
            $("#spEasyFormsCancelButton").click(function(event) {
                if (!event.handled) {
                    window.location.href = utils.getRequestParameters(opt).Source;
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
                    var oldConfig = JSON.stringify(configManager.get(opt), null, 4);
                    var newConfig = configManager.undoBuffer.pop();
                    configManager.redoBuffer.push(oldConfig);
                    $("#spEasyFormsRedoButton img").removeClass("speasyforms-buttonimgdisabled");
                    $("#spEasyFormsRedoButton").removeClass("speasyforms-buttontextdisabled");
                    
                    opt.currentConfig = utils.parseJSON(newConfig);
                    configManager.set(opt);
                    newConfig = configManager.undoBuffer.pop();
                    if(configManager.undoBuffer.length === 0) {
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
                    opt.currentConfig = utils.parseJSON(configManager.redoBuffer.pop());
                    configManager.set(opt);
            
                    if(configManager.redoBuffer.length === 0) {
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
            $("#spEasyFormsCollapseButton").click(function(event) {
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
            $("#spEasyFormsClearCacheButton").click(function (event) {
                spEasyForms.clearCachedContext(opt);
                window.location.reload();
                return false;
            });

            // wire the verbose button
            $("#spEasyFormsVerboseButton").click(function (event) {
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
                    $(".tabs-min").hide();
                    $("#tabs-min-about").show();
                }
                return false;
            });
            
            // wire the export button
            $("#spEasyFormsExportLink").click(function(event) {
                if($("#spEasyFormsExportButton img").hasClass("speasyforms-buttonimgdisabled"))
                    return false;

                var configFileName = spContext.getCurrentSiteUrl(opt) +
                    "/SiteAssets/spef-layout-" + spContext.getCurrentListId(opt).replace("{", "")
                    .replace("}", "") + ".txt";
                window.open(configFileName);
            });
            
            // wire the import button
            $("#spEasyFormsImportButton").click(function(event) {
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
            }).click(function(event) {
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
            var opt = $.extend({}, spEasyForms.defaults, options);

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
            $.each(containerCollection.containerImplementations, function(index, intfc) {
                var containerType = containerCollection.containerImplementations[index].containerType;
                if(containerType !== defaultFormContainer.containerType) {
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
                        configManager.set(opt);
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
                        opt.currentConfig = utils.parseJSON($("#importedJson").val());
                        configManager.set(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, options);

            $("#" + opt.id).parent().remove();

            var tr = "<tr>" +
                "<td class='speasyforms-sortablecontainers' id='" + opt.id +
                "' data-containerIndex='" + opt.containerIndex + "'>" +
                "<table class='speasyforms-fieldstitle'><tr>" +
                "<td class='speasyforms-headercell'><h1>" + opt.title +
                "</h1></td><td class='speasyforms-buttoncell' align='right'>";

            if (opt.title !== defaultFormContainer.containerType) {
                tr += "<button id='" + opt.id +
                    "Delete' class='speasyforms-containerbtn'>Delete</button></td>";
            }

            tr += "</tr></table><input type='hidden' name='" + opt.id +
                "Hidden' id='" + opt.id + "Hidden' value='" +
                opt.currentContainerLayout.containerType + "' /></td></tr>";

            var result = $("#spEasyFormsContainerTable").append(tr);

            if (opt.title !== defaultFormContainer.containerType) {
                $("#" + opt.id + "Delete").button({
                    icons: {
                        primary: "ui-icon-closethick"
                    },
                    text: false
                }).click(function() {
                    $(this).closest("td.speasyforms-sortablecontainers").remove();
                    opt.currentConfig = spEasyForms.options.currentConfig = containerCollection.toConfig(opt);
                    configManager.set(opt);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
            var trs = opt.trs;
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
    
    ////////////////////////////////////////////////////////////////////////////
    // Container implementation representing fields on the OOB SharePoint form.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.defaultFormContainer = {
        containerType: "DefaultForm",
        
        transform: function(options) {
            return [];
        },
        
        toEditor: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
            return {
                containerType: this.containerType,
                index: $(opt.container).attr("data-containerIndex")
            };
        }
    };
    var defaultFormContainer = $.spEasyForms.defaultFormContainer;
    containerCollection.containerImplementations.defaultForm = defaultFormContainer;

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
            var opt = $.extend({}, spEasyForms.defaults, options);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
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
            var opt = $.extend({}, spEasyForms.defaults, options);
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
            var opt = $.extend({}, spEasyForms.defaults, options);

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
                            opt.currentConfig = configManager.get(opt);
                            opt.currentConfig.layout.def.push(newLayout);
                            configManager.set(opt);
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
                            configManager.set(opt);
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
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Accordion container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.accordion = Object.create(baseContainer);
    $.spEasyForms.accordion.containerType = "Accordion";
    $.spEasyForms.accordion.fieldCollectionsDlgTitle = "Enter the names of the " +
        "accordion content areas, one per line";
    $.spEasyForms.accordion.fieldCollectionsDlgPrompt =
        "Content Area Names (one per line):";

    $.spEasyForms.accordion.transform = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var result = [];
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var divClass =
            "speasyforms-container speasyforms-accordion speasyforms-accordion" +
            opt.index;
        $("#" + opt.containerId).append("<div id='" + divId + "' class='" +
            divClass + "'></div>");
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            var itemClass = "speasyforms-accordion speasyforms-accordion" +
                opt.index + "" + idx;
            var tableClass = "speasyforms-accordion " +
                "speasyforms-accordion" + opt.index + "" + idx;
            var tableId = "spEasyFormsAccordionTable" + opt.index + "" + idx;
            var headerId = "spEasyFormsAccordionHeader" + opt.index + "" + idx;
            $("#" + divId).append("<h3 id='" + headerId + "' class='" +
                tableClass + "'>" + fieldCollection.name + "</h3>");
            $("#" + divId).append(
                "<div><table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldCollection.fields, function(fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                result.push(field.fieldInternalName);
                if (currentRow !== undefined) {
                    currentRow.row.appendTo("#" + tableId);
                }
            });
        });
        $("#" + divId).accordion({
            heightStyle: "auto",
            active: false,
            collapsible: true
        });

        $("#" + divId + " table.speasyforms-accordion").each(function() {
            if($(this).find("td.ms-formbody").length === 0) {
                var index = $(this)[0].id.replace("spEasyFormsAccordionTable", "");
                $("#spEasyFormsAccordionHeader" + index).hide();
            }
        });
        
        return result;
    };

    $.spEasyForms.accordion.preSaveItem = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var divId = "spEasyFormsAccordionDiv" + opt.index;
        var selected = false;
        $("#" + divId).find("table.speasyforms-accordion").each(function(idx, content) {
            if ($(content).find(".ms-formbody span.ms-formvalidation").length > 0) {
                $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).
                addClass("speasyforms-accordionvalidationerror");
                if (!selected) {
                    $("#" + divId).accordion({
                        active: idx
                    });
                    selected = true;
                }
            } else {
                $("#spEasyFormsAccordionHeader" + opt.index + "" + idx).
                removeClass("speasyforms-accordionvalidationerror");
            }
        });
        return true;
    };

    containerCollection.containerImplementations.accordion = $.spEasyForms.accordion;

    ////////////////////////////////////////////////////////////////////////////
    // Columns container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.columns = Object.create(baseContainer);
    $.spEasyForms.columns.containerType = "Columns";
    $.spEasyForms.columns.fieldCollectionsDlgTitle = "Enter the names of the columns, " +
        "one per line; these are only displayed on the settings page, " +
        "not on the form itself.";
    $.spEasyForms.columns.fieldCollectionsDlgPrompt = "Column Names (one per line):";

    $.spEasyForms.columns.transform = function(options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var result = [];
        var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
        var outerTableClass = "speasyforms-container speasyforms-columns";
        $("#" + opt.containerId).append("<table id='" + outerTableId +
            "' class='" + outerTableClass + "'></table>");

        var condensedFieldCollections = [];
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            var newCollection = {};
            newCollection.name = fieldCollection.name;
            newCollection.fields = [];
            $.each(fieldCollection.fields, function(i, field) {
                var row = containerCollection.rows[field.fieldInternalName];
                if(row && !row.fieldMissing) {
                    newCollection.fields.push(field);
                }
            });
            if(newCollection.fields.length > 0) {
                condensedFieldCollections.push(newCollection);
            }
        });

        var rowCount = 0;
        $.each(condensedFieldCollections, function(idx, fieldCollection) {
            if (fieldCollection.fields.length > rowCount) rowCount = fieldCollection.fields.length;
        });

        for (var i = 0; i < rowCount; i++) {
            var rowId = "spEasyFormsColumnRow" + opt.index + "" + i;
            $("#" + outerTableId).append("<tr id='" + rowId +
                "' class='speasyforms-columnrow'></tr>");
            for (var idx = 0; idx < condensedFieldCollections.length; idx++) {
                var fieldCollection = condensedFieldCollections[idx];
                var tdId = "spEasyFormsColumnCell" + opt.index + "" + i +
                    "" + idx;
                var innerTableId = "spEasyFormsInnerTable" + opt.index + "" +
                    i + "" + idx;
                if (fieldCollection.fields.length > i) {
                    var field = fieldCollection.fields[i];
                    var currentRow = containerCollection.rows[field.fieldInternalName];
                    if (currentRow && !currentRow.fieldMissing) {
                        result.push(field.fieldInternalName);
                        if (currentRow) {
                            if (currentRow.row.find("td.ms-formbody").find(
                                "h3.ms-standardheader").length === 0) {
                                var tdh = currentRow.row.find("td.ms-formlabel");
                                if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") >= 0) {
                                    currentRow.row.find("td.ms-formbody").prepend(
                                        "<div data-transformAdded='true'>&nbsp;</div>");
                                }
                                currentRow.row.find("td.ms-formbody").prepend(
                                    tdh.html());
                                currentRow.row.find("td.ms-formbody").find(
                                    "h3.ms-standardheader").
                                attr("data-transformAdded", "true");
                                tdh.hide();
                                tdh.attr("data-transformHidden", "true");
                            }
                            $("#" + rowId).append(
                                "<td id='" + tdId +
                                "' class='speasyforms-columncell'><table id='" +
                                innerTableId + "' style='width: 100%'></table></td>");
                            currentRow.row.appendTo("#" + innerTableId);
                        } else {
                            $("#" + rowId).append("<td id='" + tdId +
                                "' class='speasyforms-columncell'>&nbsp;</td>");
                        }
                    }
                } else {
                    $("#" + rowId).append("<td id='" + tdId +
                        "' class='speasyforms-columncell'>&nbsp;</td>");
                }
            }
        }

        $("#" + outerTableId + " tr.speasyforms-columnrow").each(function() {
            if($(this).find("td.ms-formbody").length === 0) {
                $(this).hide();
            }
        });
        
        return result;
    };

    containerCollection.containerImplementations.columns = $.spEasyForms.columns;

    ////////////////////////////////////////////////////////////////////////////
    // Tabs container implementation.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.tabs = Object.create(baseContainer);
    $.spEasyForms.tabs.containerType = "Tabs";
    $.spEasyForms.tabs.fieldCollectionsDlgTitle = "Enter the names of the tabs, one per line";
    $.spEasyForms.tabs.fieldCollectionsDlgPrompt = "Tab Names (one per line):";

    $.spEasyForms.tabs.transform = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var result = [];
        opt.divId = "spEasyFormsTabDiv" + opt.index;
        var divClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
            opt.index + " ui-tabs ui-widget ui-widget-content ui-corner-all";
        var listId = "spEasyFormsTabsList" + opt.index;
        var listClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
            opt.index +
            " ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all";
        var containerDiv = $("#" + opt.containerId);
        containerDiv.append("<div id='" + opt.divId + "' class='" + divClass +
            "' style='width: 99%;'><ul id='" + listId + "' class='" + listClass + "'></ul></div>");
        var mostFields = 0;
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            if (fieldCollection.fields.length > mostFields) {
                mostFields = fieldCollection.fields.length;
            }
        });
        $.each(opt.currentContainerLayout.fieldCollections, function(idx, fieldCollection) {
            var itemClass = "speasyforms-tabs speasyforms-tabs" + opt.index + "" + idx +
                " ui-state-default ui-corner-top";
            var tableClass = "speasyforms-container speasyforms-tabs speasyforms-tabs" +
                opt.index + "" + idx;
            var innerDivId = "spEasyFormsTabsDiv" + opt.index + "" + idx;
            var tableId = "spEasyFormsTabsTable" + opt.index + "" + idx;
            $("#" + listId).append("<li class='" + itemClass +
                "'><a href='#" + innerDivId + "'>" + fieldCollection.name +
                "</a></li>");
            $("#" + opt.divId).append(
                "<div id='" + innerDivId +
                "' class='ui-tabs-panel ui-widget-content ui-corner-bottom'>" +
                "<table class='" + tableClass + "' id='" + tableId +
                "'></table></div>");
            $.each(fieldCollection.fields, function(fieldIdx, field) {
                var currentRow = containerCollection.rows[field.fieldInternalName];
                if(currentRow && !currentRow.fieldMissing) {
                    result.push(field.fieldInternalName);
                    if (currentRow) {
                        currentRow.row.appendTo("#" + tableId);
                    }
                }
            });
            for (var i = fieldCollection.fields.length; i < mostFields; i++) {
                $("<tr><td><br /><br /></td></tr>").appendTo("#" + tableId);
            }
        });
        this.setHeight(opt);
        $("#" + listId).find("li:first").addClass("ui-tabs-active").addClass("ui-state-active");
        $("#" + opt.divId).find("div.ui-tabs-panel").hide();
        $("#" + opt.divId).find("div.ui-tabs-panel:first").show();
        $("#" + listId).find("a").click(function() {
            $("#" + listId).find("li").removeClass("ui-tabs-active").removeClass("ui-state-active");
            $(this).closest("li").addClass("ui-tabs-active").addClass("ui-state-active");
            $("#" + opt.divId).find("div.ui-tabs-panel").hide();
            $($(this).attr("href")).show();
            return false;
        });

        $("#" + opt.divId + " table.speasyforms-tabs").each(function() {
            if($(this).find("td.ms-formbody").length === 0) {
                var index = $(this)[0].id.replace("spEasyFormsTabsTable", "");
                if($(this).parent().css("display") !== "none") {
                    var nextIndex = -1;
                    if($(this).parent().next().length > 0) {
                        nextIndex = $(this).parent().next()[0].id.replace("spEasyFormsTabsDiv", "");
                        $(this).parent().next().show();
                        $("li.speasyforms-tabs" + nextIndex).addClass("ui-tabs-active").addClass("ui-state-active");
                    }
                    $(this).parent().hide();
                }
                $(".speasyforms-tabs" + index).hide();
            }
        });
        
        return result;
    };

    $.spEasyForms.tabs.setHeight = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var height = 0;
        $("#" + opt.divId).find("table.speasyforms-container").each(function(idx, table) {
            if ($(table).height() > height) {
                height = $(table).height();
            }
        });
        $("div.ui-tabs-panel").each(function(idx, div) {
            $(div).css("height", height + "px");
        });
    };

    $.spEasyForms.tabs.preSaveItem = function(options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var selected = false;
        $("#spEasyFormsTabDiv" + opt.index).find("table.speasyforms-tabs").each(function(idx, tab) {
            if ($(tab).find(".ms-formbody span.ms-formvalidation").length > 0) {
                $("a[href$='#spEasyFormsTabsDiv" + opt.index + "" + idx + "']").
                addClass("speasyforms-tabvalidationerror");
                if (!selected) {
                    $("#spEasyFormsTabDiv" + opt.index).find("div.ui-tabs-panel").hide();
                    $(tab).closest("div").show();
                    $("#spEasyFormsTabDiv" + opt.index).find("li").removeClass("ui-tabs-active").removeClass("ui-state-active");
                    $("#spEasyFormsTabDiv" + opt.index).find("a[href='#" + $(tab).closest("div")[0].id + "']").closest("li").
                    addClass("ui-tabs-active").addClass("ui-state-active");
                    selected = true;
                }
            } else {
                $("a[href$='#spEasyFormsTabsDiv" + opt.index + "" + idx + "']").
                removeClass("speasyforms-tabvalidationerror");
            }
        });
        return true;
    };

    containerCollection.containerImplementations.tabs = $.spEasyForms.tabs;

    ////////////////////////////////////////////////////////////////////////////
    // Enforcer of field visibility rules.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.visibilityRuleCollection = {
        initialized: false,

        comparisonOperators: {
            equals: function(value, test) {
                return (value == test);
            },
            matches: function(value, test) {
                var regex = new RegExp(test);
                return regex.test(value);
            },
            notMatches: function(value, test) {
                var regex = new RegExp(test);
                return !regex.test(value);
            }
        },
        
        stateHandlers: {
            hidden: function(options) {
                var opt = $.extend({}, spEasyForms.defaults, options);
                var row = opt.row;
                if (row.row.attr("data-visibilityhidden") !== "true") {
                    row.row.attr("data-visibilityhidden", "true").hide();
                }
            },
            readOnly: function(options) {
                var opt = $.extend({}, spEasyForms.defaults, options);
                var row = opt.row;
                var formType = visibilityRuleCollection.getFormType(opt);
                if (formType !== "display") {
                    var value = spRows.value(opt);
                    if (!value) {
                        setTimeout(function() {
                            var o = $.extend({}, spEasyForms.defauts, opt);
                            o.row = row;
                            var v = spRows.value(o);
                            $("#readOnly" + row.internalName).html(v);
                            visibilityRuleCollection.transform(opt);
                        }, 1000);                                                
                        value = "&nbsp;";
                    }
                    var html = '<tr data-visibilityadded="true">' +
                        '<td valign="top" width="350px" ' +
                        'class="ms-formlabel">' +
                        '<h3 class="ms-standardheader"><nobr>' +
                        row.displayName +
                        '</nobr></h3></td><td class="ms-formbody">' +
                        '<span id="readOnly'+row.internalName+'" ">' + value + '</td></tr>';
                    if (row.row.find("td.ms-formbody h3.ms-standardheader").length > 0) {
                        html = '<tr data-visibilityadded="true">' +
                            '<td valign="top" ' +
                            'width="350px" class="ms-formbody">' +
                            '<h3 class="ms-standardheader"><nobr>' +
                            row.displayName + '</nobr></h3>' +
                            value + '</td></tr>';
                    }
                    if (row.row.attr("data-visibilityhidden") !== "true") {
                        row.row.attr("data-visibilityhidden", "true").hide();
                    }
                    if (row.row.next().attr("data-visibilityadded") !== "true") {
                        row.row.after(html);
                    }
                }
            },
            editable: function(options) { /*do nothing*/ }
        },

        siteGroups: [],

        scrubCollection: function (collection) {
            collection.each(function (idx, current) {
                if ($(current).attr("data-visibilityadded") === "true") {
                    $(current).remove();
                }
                else {
                    if($(current).next().attr("data-visibilityadded") === "true") {
                        $(current).next().remove();
                    }
                    if ($(current).attr("data-visibilityhidden") === "true") {
                        $(current).attr("data-visibilityhidden", "false").show();
                    }
                    if ($(current).attr("data-visibilityclassadded")) {
                        $(current).removeClass($(current).attr("data-visibilityclassadded"));
                        $(current).attr("data-visibilityclassadded", "");
                    }
                    $(current).find("[data-visibilityadded='true']").remove();
                    $(current).find("[data-visibilityhidden='true']").attr("data-visibilityhidden", "false").show();
                    $(current).find("[data-visibilityclassadded!=''][data-visibilityclassadded]").each(function () {
                        var klass = $(this).attr("data-visibilityclassadded");
                        $(this).removeClass(klass).attr("data-visibilityclassadded", "");
                    });
                }
            });
        },

        /*********************************************************************
         * Transform the current form by hiding fields or makin them read-only
         * as required by the current configuration and the group membership
         * of the current user.
         *
         * @param {object} options - {
         *     config: {object}
         * }
         *********************************************************************/
        transform: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.currentConfig && opt.currentConfig.visibility && opt.currentConfig.visibility.def &&
                Object.keys(opt.currentConfig.visibility.def).length > 0) {
                $.each(containerCollection.rows, function(idx, row) {
                    opt.row = row;
                    if (row.internalName in opt.currentConfig.visibility.def) {
                        var ruleHandled = false;
                        $.each(opt.currentConfig.visibility.def[row.internalName], function(index, rule) {
                            opt.rule = rule;
                            if (!ruleHandled) {
                                var formMatch = visibilityRuleCollection.checkForm(opt);
                                var appliesMatch = visibilityRuleCollection.checkAppliesTo(opt);
                                var conditionalMatch = visibilityRuleCollection.checkConditionals(opt);
                                if (formMatch && appliesMatch && conditionalMatch) {
                                    var stateHandler = utils.jsCase(rule.state);
                                    if(stateHandler in visibilityRuleCollection.stateHandlers) {
                                        visibilityRuleCollection.scrubCollection(opt.row.row);
                                        visibilityRuleCollection.stateHandlers[stateHandler](opt);
                                        ruleHandled = true;
                                    }
                                }
                            }
                            if (rule.conditions) {
                                $.each(rule.conditions, function(idx, condition) {
                                    var tr = containerCollection.rows[condition.name];
                                    if (tr === undefined) {
                                        tr = {
                                            displayName: condition.name,
                                            internalName: condition.name,
                                            spFieldType: condition.name,
                                            value: "",
                                            row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                                            fieldMissing: true
                                        };
                                    }
                                    if (!tr.fieldMissing && tr.row.attr("data-visibilitychangelistener") != "true") {
                                        tr.row.find("input").change(function(e) {
                                            visibilityRuleCollection.transform(opt);
                                            adapterCollection.transform(opt);
                                        });
                                        tr.row.find("select").change(function(e) {
                                            visibilityRuleCollection.transform(opt);
                                            adapterCollection.transform(opt);
                                        });
                                        tr.row.find("textarea").change(function(e) {
                                            visibilityRuleCollection.transform(opt);
                                            adapterCollection.transform(opt);
                                        });
                                        tr.row.attr("data-visibilitychangelistener", "true");
                                    }
                                });
                            }
                        });
                        if (!ruleHandled) {
                            visibilityRuleCollection.scrubCollection(opt.row.row);
                        }
                    }
                });
            }
        },

        /*********************************************************************
         * Convert the conditional visibility rules for the current config into
         * an editor.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        toEditor: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!this.initialized) {
                this.wireDialogEvents(opt);
            }
            this.wireButtonEvents(opt);
            this.drawRuleTableTab(opt);
            this.initialized = true;
            
            if(!opt.verbose) {
                $("#staticVisibilityRules .speasyforms-fieldmissing").hide();
            }
            
            if($("#staticVisibilityRules .speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#visibilityTab").addClass("speasyforms-fieldmissing");
            }
            else {
                $("#visibilityTab").removeClass("speasyforms-fieldmissing");
            }
        },

        /*********************************************************************
         * Convert the editor back into a set of conditional visibility rules.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        toConfig: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var rules = [];
            var fieldName = $("#conditionalVisibilityField").val();
            $("#conditionalVisibilityRules tr:not(:first)").each(function(idx, tr) {
                var tds = $(tr).find("td");
                var appliesTo = tds[1].innerText != "Everyone" ? tds[1].innerText : "";
                var rule = {
                    state: tds[0].innerText,
                    appliesTo: appliesTo,
                    forms: tds[2].innerText,
                    conditions: []
                };
                $.each($(tds[3]).find("div.speasyforms-conditiondisplay"), function(idx, div) {
                    var conditionArray = $(div).text().split(";");
                    if (conditionArray.length === 3) {
                        var condition = {
                            name: conditionArray[0],
                            type: conditionArray[1],
                            value: conditionArray[2]
                        };
                        if (condition.name && condition.value) {
                            rule.conditions.push(condition);
                        }
                    }
                });
                rules.push(rule);
            });
            var config = configManager.get(opt);
            config.visibility.def[fieldName] = rules;
            return config;
        },

        launchDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var displayName = opt.fieldName;
            if (opt.fieldName in opt.currentListContext.fields) {
                displayName = opt.currentListContext.fields[opt.fieldName].displayName;
            }
            $("#conditionalVisibilityField").val(opt.fieldName);
            $('#conditionalVisibilityDialogHeader').text(
                "Rules for Column '" + displayName +
                "'");
            $("#conditonalVisibilityRulesDialog").dialog('open');
            opt.currentConfig.visibility = visibilityRuleCollection.getVisibility(opt);
            opt.stat = false;
            visibilityRuleCollection.drawRuleTable(opt);
        },

        /*********************************************************************
         * Draw a set of rules for a single field as a table. This function draws
         * the rules table for the conditional visibility dialog as well as all
         * the rule tables on the conditional visibility tab of the main editor.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        drawRuleTable: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.currentConfig.visibility.def[opt.fieldName].length === 0) {
                $("#conditionalVisibilityRules").html(
                    "There are currently no rules for this field. Click " +
                    "the plus sign to add one.");
            } else {
                var klass = 'speasyforms-sortablerules';
                var id = 'conditionalVisibilityRulesTable';
                var table = "<center>";
                table += "<table id='" + id + "' " +
                    "class='" + klass + "'><tbody class='" + klass + "'><tr>" +
                    "<th class='" + klass + "'>State</th>" +
                    "<th class='" + klass + "'>Applies To</th>" +
                    "<th class='" + klass + "'>On Forms</th>" +
                    "<th class='" + klass + "'>And When</th></tr>";
                var conditionalFieldsMissing = [];
                $.each(opt.currentConfig.visibility.def[opt.fieldName], function(idx, rule) {
                    var conditions = "";
                    if (rule.conditions) {
                        $.each(rule.conditions, function(i, condition) {
                            conditions += "<div class='speasyforms-conditiondisplay'>" +
                                condition.name + ";" + condition.type + ";" +
                                condition.value + "</div>";
                            if (!containerCollection.rows[condition.name] || containerCollection.rows[condition.name].fieldMissing) {
                                conditionalFieldsMissing.push(condition.name);
                            }
                        });
                    } else {
                        conditions = "&nbsp;";
                    }
                    table += "<tr class='" + klass + "'>" +
                        "<td class='" + klass + "'>" + rule.state +
                        "</td>" +
                        "<td class='" + klass + "'>" +
                        (rule.appliesTo.length > 0 ? rule.appliesTo : "Everyone") +
                        "</td>" +
                        "<td class='" + klass + "'>" + rule.forms + "</td>" +
                        "<td class='" + klass + "'>" + conditions + "</td>";
                    table += "<td class='speasyforms-visibilityrulebutton'>" +
                        "<button id='addVisililityRuleButton" + idx +
                        "' >Edit Rule</button></td>" +
                        "<td class='speasyforms-visibilityrulebutton'>" +
                        "<button id='delVisililityRuleButton" + idx +
                        "' >Delete Rule</button></td>";
                    table += "</tr>";
                });
                table += "</tbody></table>";
                $("#conditionalVisibilityRules").html(table + "</center>");
                this.wireVisibilityRulesTable(opt);
            }
        },
        
        drawRuleTableTab: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("#staticVisibilityRules").remove();
            var klass = 'speasyforms-staticrules';
            var table = "<table id='staticVisibilityRules' " +
                "class='" + klass + "'><tbody class='" + klass + "'><tr>" +
                "<th class='" + klass + "'>Display Name</th>" +
                "<th class='" + klass + " speasyforms-hidden' style='display:none'>Internal Name</th>" +
                "<th class='" + klass + "'>State</th>" +
                "<th class='" + klass + "'>Applies To</th>" +
                "<th class='" + klass + "'>On Forms</th>" +
                "<th class='" + klass + "'>And When</th></tr>";
            $.each(Object.keys(opt.currentConfig.visibility.def).sort(), function(idx, key) {
                $.each(opt.currentConfig.visibility.def[key], function(i, rule) {
                    title = "";
                    klass = 'speasyforms-staticrules';
                    opt.index = idx;
                    opt.fieldName = key;
                    opt.fieldMissing = false;
                    if (containerCollection.rows[key]) {
                        opt.displayName = containerCollection.rows[key].displayName;
                    }
                    else {
                        opt.displayName = opt.fieldName;
                        containerCollection.rows[key] = {
                            displayName: opt.fieldName,
                            internalName: opt.fieldName,
                            spFieldType: opt.fieldName,
                            value: "",
                            row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                            fieldMissing: true
                        };
                    }
                    if(containerCollection.rows[key].fieldMissing) {
                        klass += ' speasyforms-fieldmissing';
                    }
                    var conditions = "";
                    var conditionalFieldsMissing = [];
                    if(rule.conditions && rule.conditions.length > 0) {
                        $.each(rule.conditions, function(i, condition) {
                            if(conditions.length > 0)
                                conditions += "<br />";
                            conditions += condition.name + ";" + condition.type +
                                ";" + condition.value;
                            if (!containerCollection.rows[condition.name] || containerCollection.rows[condition.name].fieldMissing) {
                                conditionalFieldsMissing.push(condition.name);
                                if(klass.indexOf('speasyforms-fieldmissing') < 0) {
                                    klass += ' speasyforms-fieldmissing';
                                }
                            }
                        });
                    }
                    if(conditionalFieldsMissing.length > 0) {
                        if (conditionalFieldsMissing.length === 1) {
                            title += 'This rule has conditions which use the field [' + conditionalFieldsMissing[0] +
                                '], which was not found in the form and may have been deleted.';
                        }
                        else {
                            title += 'This rule has conditions which use the fields [' + conditionalFieldsMissing.toString() +
                                '], which were not found in the form and may have been deleted.';
                        }
                    }
                    if(containerCollection.rows[opt.fieldName].fieldMissing) {
                        title = 'This field was not found in the form and may have been deleted. ';
                    }
                    if(title.length === 0) {
                        title = "Forms = " + rule.forms + ", Conditions = " + conditions;
                    }
                    table += "<tr id='visibilityRule" + opt.index + " title='" + title + "'" +
                        "' class='" + klass + "' data-dialogtype='visibility'" +
                        " data-fieldname='" + opt.fieldName + "'>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog'>"+opt.displayName+"</td>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog speasyforms-hidden' style='display:none'>"+opt.fieldName+"</td>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog'>"+rule.state+"</td>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog'>"+
                        (rule.appliesTo.length > 0 ? rule.appliesTo : "Everyone")+"</td>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog'>"+rule.forms+"</td>";
                    table += "<td title='" + title + "' class='" + klass + " speasyforms-dblclickdialog'>"+conditions+"</td>";
                    table += "</tr>";
                });
            });
            table += "</table>";
            $("#tabs-min-visibility").append(table);
            if($("tr.speasyforms-staticrules").length === 0) {
                $("#staticVisibilityRules").append("<td class='"+
                    klass +
                    "' colspan='4'>There are no conditional visibility rules for this form.</td>");
            }
        },

        /*********************************************************************
         * Wire up the buttons for a rules table (only applicable to the conditional
         * visibility dialog since the rules tables on the main editor are static)
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        wireVisibilityRulesTable: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("[id^='delVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function() {
                opt.index = this.id.replace("delVisililityRuleButton", "");
                opt.fieldName = $("#conditionalVisibilityField").val();
                opt.currentConfig = configManager.get(opt);
                opt.currentConfig.visibility.def[opt.fieldName].splice(opt.index, 1);
                configManager.set(opt);
                visibilityRuleCollection.drawRuleTable(opt);
                containerCollection.toEditor(opt);
            });

            $("[id^='addVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-gear"
                },
                text: false
            }).click(function() {
                visibilityRuleCollection.clearRuleDialog(opt);
                opt.index = this.id.replace("addVisililityRuleButton", "");
                $("#visibilityRuleIndex").val(opt.index);
                opt.fieldName = $("#conditionalVisibilityField").val();
                $("#addVisibilityRuleField").val(opt.fieldName);
                opt.currentConfig = configManager.get(opt);
                var rule = opt.currentConfig.visibility.def[opt.fieldName][opt.index];
                $("#addVisibilityRuleState").val(rule.state);
                $.each(rule.appliesTo.split(';'), function(idx, entity) {
                    if (entity === "AUTHOR") {
                        $("#addVisibilityRuleApplyToAuthor")[0].checked = true;
                    } else if (entity.length > 0) {
                        var span = $("<span>").addClass("speasyforms-entity").
                        attr('title', entity).text(entity);
                        var a = $("<a>").addClass("speasyforms-remove").attr({
                            "href": "#",
                            "title": "Remove " + entity
                        }).
                        text("x").appendTo(span);
                        $("#spEasyFormsEntityPicker").prepend(span);
                        $("#addVisibilityRuleApplyTo").val("").css("top", 2);
                        visibilityRuleCollection.siteGroups.splice(
                            visibilityRuleCollection.siteGroups.indexOf(entity), 1);
                    }
                });
                if (rule.forms.indexOf('New') >= 0) {
                    $("#addVisibilityRuleNewForm")[0].checked = true;
                } else if (rule.forms.indexOf('Edit') >= 0) {
                    $("#addVisibilityRuleEditForm")[0].checked = true;
                } else if (rule.forms.indexOf('Display') >= 0) {
                    $("#addVisibilityRuleDisplayForm")[0].checked = true;
                }
                if (rule.conditions) {
                    $.each(rule.conditions, function(index, condition) {
                        $("#conditionalField" + (index + 1)).val(condition.name);
                        $("#conditionalType" + (index + 1)).val(condition.type);
                        $("#conditionalValue" + (index + 1)).val(condition.value);
                        $("#condition" + (index + 1)).show();
                        if ($(".speasyforms-condition:hidden").length === 0) {
                            $("#spEasyFormsAddConditionalBtn").hide();
                        }
                    });
                }
                $('#addVisibilityRuleDialog').dialog("open");
                return false;
            });

            // make the visibility rules sortable sortable
            $("tbody.speasyforms-sortablerules").sortable({
                connectWith: ".speasyforms-rulestable",
                items: "> tr:not(:first)",
                helper: "clone",
                zIndex: 990,
                update: function(event, ui) {
                    if (!event.handled) {
                        opt.currentConfig = visibilityRuleCollection.toConfig(opt);
                        configManager.set(opt);
                        visibilityRuleCollection.drawRuleTable(opt);
                        containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                }
            });
        },

        /*********************************************************************
         * Wire up the conditional visibility dialog boxes.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        wireDialogEvents: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            // wire the conditional visilibity dialog
            var conditionalVisibilityOpts = {
                modal: true,
                buttons: {
                    "Ok": function() {
                        $('#conditonalVisibilityRulesDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 750
            };
            $('#conditonalVisibilityRulesDialog').dialog(conditionalVisibilityOpts);

            // wire the add/edit visibility rule dialog
            var addVisibilityRuleOpts = {
                modal: true,
                buttons: {
                    "Ok": function() {
                        opt.state = $('#addVisibilityRuleState').val();
                        if (opt.state === '') {
                            $('#addVisibilityRuleStateError').text(
                                "You must select a value for state!");
                        } else {
                            opt.currentConfig = configManager.get(opt);
                            opt.fieldName = $("#addVisibilityRuleField").val();
                            opt.currentConfig.visibility = visibilityRuleCollection.getVisibility(opt);
                            opt.index = $("#visibilityRuleIndex").val();
                            if (opt.index.length === 0) {
                                var newRule = visibilityRuleCollection.getRule(opt);
                                opt.currentConfig.visibility.def[opt.fieldName].push(newRule);
                            } else {
                                var rule = visibilityRuleCollection.getRule(opt);
                                opt.currentConfig.visibility.def[opt.fieldName][opt.index] = rule;
                            }
                            configManager.set(opt);
                            $('#addVisibilityRuleDialog').dialog("close");
                            $("#conditonalVisibilityRulesDialog").dialog("open");
                            visibilityRuleCollection.drawRuleTable(opt);
                            containerCollection.toEditor(opt);
                        }
                        return false;
                    },
                    "Cancel": function() {
                        $('#addVisibilityRuleDialog').dialog("close");
                        $("#conditonalVisibilityRulesDialog").dialog("open");
                        return false;
                    }
                },
                autoOpen: false,
                width: 750
            };
            $('#addVisibilityRuleDialog').dialog(addVisibilityRuleOpts);

            // wire the button to launch the add/edit rule dialog
            $("#addVisibilityRule").button({
                icons: {
                    primary: "ui-icon-plusthick"
                },
                text: false
            }).click(function() {
                $("#conditonalVisibilityRulesDialog").dialog("close");
                visibilityRuleCollection.clearRuleDialog(opt);
                $('#addVisibilityRuleDialog').dialog("open");
                return false;
            });

            // wire the button to launch the add/edit rule dialog
            $("#spEasyFormsAddConditionalBtn").button({
                icons: {
                    primary: "ui-icon-plusthick"
                },
                text: false
            }).click(function() {
                $(".speasyforms-condition:hidden").first().show();
                if ($(".speasyforms-condition:hidden").length === 0) {
                    $("#spEasyFormsAddConditionalBtn").hide();
                }
                return false;
            });

            // wire the entity picker on the add/edit rule dialog
            $("input.speasyforms-entitypicker").autocomplete({
                source: this.siteGroups.sort(),

                select: function(e, ui) {
                    var group = ui.item.value;
                    var span = $("<span>").addClass("speasyforms-entity").
                    attr('title', group).text(group);
                    var a = $("<a>").addClass("speasyforms-remove").attr({
                        "href": "#",
                        "title": "Remove " + group
                    }).
                    text("x").appendTo(span);
                    span.insertBefore(this);
                    $(this).val("").css("top", 2);
                    visibilityRuleCollection.siteGroups.splice(
                        visibilityRuleCollection.siteGroups.indexOf(group), 1);
                    $(this).autocomplete(
                        "option", "source", visibilityRuleCollection.siteGroups.sort());
                    return false;
                }
            });
            $(".speasyforms-entitypicker").click(function() {
                $(this).find("input").focus();
            });
            $("#spEasyFormsEntityPicker").on("click", ".speasyforms-remove", function() {
                visibilityRuleCollection.siteGroups.push($(this).parent().attr("title"));
                $(this).closest("div").find("input").
                autocomplete("option", "source", visibilityRuleCollection.siteGroups.sort()).
                focus();
                $(this).parent().remove();
            });
        },

        /*********************************************************************
         * Wire the add rule button and make the rules sortable.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        wireButtonEvents: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("tr.speasyforms-sortablefields").each(function(idx, tr) {
                var tds = $(this).find("td");
                if (tds.length > 0) {
                    var internalName = $(this).find("td")[1].innerHTML;
                    $(this).append(
                        "<td class='speasyforms-conditionalvisibility'><button id='" +
                        internalName +
                        "ConditionalVisibility' class='speasyforms-containerbtn " +
                        "speasyforms-conditionalvisibility'>" +
                        "Edit Conditional Visibility</button></td>");
                }
            });

            $("button.speasyforms-conditionalvisibility").button({
                icons: {
                    primary: "ui-icon-key"
                },
                text: false
            }).click(function() {
                opt.currentConfig = configManager.get(opt);
                opt.fieldName = this.id.replace("ConditionalVisibility", "");
                visibilityRuleCollection.launchDialog(opt);
                $(".tabs-min").hide();
                $("#tabs-min-visibility").show();
                return false;
            });
        },

        /*********************************************************************
         * Get the current visibility rules.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *
         * @return {object} - the current visibility rules.
         *********************************************************************/
        getVisibility: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!opt.currentConfig.visibility) {
                opt.currentConfig.visibility = {
                    def: {}
                };
            }
            if (!opt.currentConfig.visibility.def[opt.fieldName]) {
                opt.currentConfig.visibility.def[opt.fieldName] = [];
            }
            return opt.currentConfig.visibility;
        },

        /*********************************************************************
         * Construct a rule from the add/edit rule dialog box.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *
         * @return {object} - the new rule.
         *********************************************************************/
        getRule: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = {};
            result.state = opt.state;
            result.forms = "";
            $(".speasyforms-formcb").each(function(idx, cb) {
                if (cb.checked) {
                    if (result.forms.length > 0) {
                        result.forms += ";";
                    }
                    result.forms += this.id.replace("addVisibilityRule", "").replace("Form", "");
                }
            });
            result.appliesTo = "";
            $('#spEasyFormsEntityPicker .speasyforms-entity').each(function(idx, span) {
                if (result.appliesTo.length > 0) {
                    result.appliesTo += ";";
                }
                result.appliesTo += $(span).attr("title");
            });
            var author = $("#addVisibilityRuleApplyToAuthor")[0].checked;
            if (author) {
                if (result.appliesTo.length > 0) {
                    result.appliesTo = ";" + result.appliesTo;
                }
                result.appliesTo = "AUTHOR" + result.appliesTo;
            }
            var conditions = $(".speasyforms-conditionalvalue");
            result.conditions = [];
            conditions.each(function() {
                if ($(this).val().length > 0 && $(this).prev().prev().val().length > 0) {
                    var newCondition = {};
                    newCondition.name = $(this).prev().prev().val();
                    newCondition.type = $(this).prev().val();
                    newCondition.value = $(this).val();
                    result.conditions.push(newCondition);
                }
            });
            return result;
        },

        /*********************************************************************
         * Reset the add/edit rule dialog box.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        clearRuleDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            $("#addVisibilityRuleField").val($("#conditionalVisibilityField").val());
            $("#visibilityRuleIndex").val("");
            $('#addVisibilityRuleState').val('');
            $('#addVisibilityRuleStateError').text('');
            $('#addVisibilityRuleApplyToAuthor').attr('checked', false);
            $('#addVisibilityRuleApplyTo').val('');
            $('#spEasyFormsEntityPicker .speasyforms-entity').remove();
            $('#addVisibilityRuleNewForm').attr('checked', true);
            $('#addVisibilityRuleEditForm').attr('checked', true);
            $('#addVisibilityRuleDisplayForm').attr('checked', true);
            $(".speasyforms-conditionalvalue").val("").not(":first").parent().hide();
            $(".speasyforms-conditionalfield").val("");
            $("#spEasyFormsAddConditionalBtn").show();
            var siteGroups = spContext.getSiteGroups(opt);
            $.each(siteGroups, function(idx, group) {
                if ($.inArray(group.name, visibilityRuleCollection.siteGroups) < 0) {
                    visibilityRuleCollection.siteGroups.push(group.name);
                }
            });
        },

        /*********************************************************************
         * Get the current form type. This function looks for the word new, edit,
         * or display in the current page name (case insensative.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *
         * @return {string} - new, edit, display, or "".
         *********************************************************************/
        getFormType: function(options) {
            var result = "";
            var page = window.location.pathname;
            page = page.substring(page.lastIndexOf("/") + 1).toLowerCase();
            if (page == "start.aspx") {
                page = window.location.href.substring(
                    window.location.href.indexOf("#") + 1);
                page = page.substring(page.lastIndexOf("/") + 1,
                    page.indexOf("?")).toLowerCase();
            }
            if (page.indexOf("new") >= 0) {
                result = "new";
            } else if (page.indexOf("edit") >= 0 && page.toLocaleLowerCase().indexOf("listedit.aspx") && page.toLocaleLowerCase().indexOf("fldedit.aspx")) {
                result = "edit";
            } else if (page.indexOf("disp") >= 0 || page.indexOf("display") >= 0) {
                result = "display";
            }
            return result;
        },

        checkForm: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var formType = visibilityRuleCollection.getFormType(opt);
            // modified for 2010, not sure why it worked in 2013 as it was
            var ruleForms = $(opt.rule.forms.split(';')).map(function(elem) {
                return this.toLowerCase();
            });
            return $.inArray(formType, ruleForms) >= 0;
        },

        checkAppliesTo: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var appliesMatch = false;
            if (opt.rule.appliesTo.length === 0) {
                appliesMatch = true;
            } else {
                var formType = visibilityRuleCollection.getFormType(opt);
                if (formType === "new") {
                    appliesMatch = true;
                } else {
                    var appliesToGroups = opt.rule.appliesTo.split(';');
                    if (appliesToGroups[0] === "AUTHOR") {
                        var authorHref = $("span:contains('Created  at')").
                        find("a.ms-subtleLink").attr("href");
                        if (authorHref) {
                            var authorId = parseInt(
                                authorHref.substring(authorHref.indexOf("ID=") + 3), 10);
                            if (authorId === opt.currentContext.userId) {
                                appliesMatch = true;
                            }
                        }
                    }
                    if (!appliesMatch) {
                        var userGroups = spContext.getUserGroups(opt);
                        $.each(userGroups, function(i, group) {
                            if ($.inArray(group.name, appliesToGroups) >= 0) {
                                appliesMatch = true;
                                return false;
                            }
                        });
                    }
                }
            }
            return appliesMatch;
        },

        checkConditionals: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = false;
            if (!opt.rule.conditions || opt.rule.conditions.length === 0) {
                result = true;
            } else {
                result = true;
                $.each(opt.rule.conditions, function(idx, condition) {
                    opt.row = containerCollection.rows[condition.name];
                    if (opt.row) {
                        var currentValue = spRows.value(opt);
                        var type = utils.jsCase(condition.type);
                        var comparisonOperator = visibilityRuleCollection.comparisonOperators[type];
                        result = comparisonOperator(currentValue, condition.value);
                    }
                    else {
                        result = false;
                        return false;
                    }
                });
            }
            return result;
        }
    };
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Collection of field control adapters.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.adapterCollection = {
        adapterImplementations: {},

        supportedTypes: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = [];
            if (opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                $.each(Object.keys(adapterCollection.adapterImplementations), function(idx, impl) {
                    if (impl in adapterCollection.adapterImplementations) {
                        result = result.concat(adapterCollection.adapterImplementations[impl].supportedTypes(opt));
                    }
                });
                result = result.filter(function(item, pos) {
                    return result.indexOf(item) == pos;
                });
            }
            return result;
        },

        transform: function(options) {
            if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") < 0) {
                var opt = $.extend({}, spEasyForms.defaults, options);
                if (opt.currentConfig && opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                    opt.adapters = opt.currentConfig.adapters.def;
                    $.each(opt.adapters, function(idx, adapter) {
                        opt.adapter = adapter;
                        if (opt.adapter.type in adapterCollection.adapterImplementations) {
                            adapterCollection.adapterImplementations[opt.adapter.type].transform(opt);
                        }
                    });
                }
            }
        },

        toEditor: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.adapters = opt.currentConfig.adapters.def;

            $.each(Object.keys(adapterCollection.adapterImplementations), function(idx, impl) {
                if (impl in adapterCollection.adapterImplementations) {
                    adapterCollection.adapterImplementations[impl].toEditor(opt);
                }
            });

            $("tr.speasyforms-adapter-static").remove();
            if(Object.keys(opt.adapters).length === 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='speasyforms-adapter-static'>"+
                    "<td class='speasyforms-adapter-static' colspan='3'>"+
                    "There are no adpaters configured for the current form.</td></tr>");
            }
            $.each(Object.keys(opt.adapters).sort(this.compareAdapters), function(idx, adapterField) {
                opt.adapter = opt.adapters[adapterField];
                opt.fieldName = adapterField;
                if (opt.adapter.type in adapterCollection.adapterImplementations) {
                    adapterCollection.drawAdapter(opt);
                }
            });
            $("#tabs-min-adapters").append("<br /><br />");

            $("tr.speasyforms-sortablefields").each(function(idx, tr) {
                var tds = $(this).find("td");
                if (tds.length > 2) {
                    var internalName = $(this).find("td")[1].innerHTML;
                    var type = $(this).find("td")[2].innerHTML;
                    opt.supportedTypes = adapterCollection.supportedTypes(opt);
                    if ($.inArray(type, opt.supportedTypes) >= 0) {
                        $(this).append(
                            "<td class='speasyforms-adapter'><button id='" +
                            internalName +
                            "Adapter' class='speasyforms-containerbtn " +
                            "speasyforms-adapter' data-spfieldtype='" +
                            type + "'>" +
                            "Configure Field Control Adapter</button></td>");
                    } else {
                        $(this).append("<td class='speasyforms-blank'>&nbsp;</td>");
                    }
                }
            });

            $("#adapterTypeDialog").dialog({
                modal: true,
                autoOpen: false,
                width: 400,
                buttons: {
                    "Ok": function() {
                        $("#adapterTypeDialog").dialog("close");
                        opt.adapterType = $("#adapterType option:selected").text();
                        $.each(adapterCollection.adapterImplementations, function(idx, impl) {
                            if (impl.type === opt.adapterType) {
                                opt.adapterImpl = impl;
                            }
                        });
                        if (opt.adapterImpl) {
                            opt.adapterImpl.launchDialog(opt);
                        }
                    },
                    "Cancel": function() {
                        $("#adapterTypeDialog").dialog("close");
                    }
                }
            });

            $("button.speasyforms-adapter").button({
                icons: {
                    primary: "ui-icon-wrench"
                },
                text: false
            }).click(function() {
                opt.button = this;
                opt.fieldName = opt.button.id.replace("Adapter", "");
                opt.spFieldType = containerCollection.rows[opt.fieldName].spFieldType;
                adapterCollection.launchDialog(opt);
                return false;
            });
            
            if($("#spEasyFormsAdapterTable tr.speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#adapterTab").addClass("speasyforms-fieldmissing");
            }
            else {
                $("#adapterTab").removeClass("speasyforms-fieldmissing");
            }
        },

        launchDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.dialogLaunched = false;
            opt.adapters = opt.currentConfig.adapters.def;
            opt.adapter = undefined;
            if (opt.fieldName in opt.adapters) {
                opt.adapter = opt.adapters[opt.fieldName];
            }
            if (opt.adapter) {
                var a = opt.adapters[opt.fieldName];
                if (a.type in adapterCollection.adapterImplementations) {
                    adapterCollection.adapterImplementations[a.type].launchDialog(opt);
                    opt.dialogLaunced = true;
                }
            }
            if (!opt.dialogLaunced) {
                opt.typeAdapters = [];
                $.each(adapterCollection.adapterImplementations, function(idx, impl) {
                    if ($.inArray(opt.spFieldType, impl.supportedTypes(opt)) >= 0) {
                        opt.typeAdapters.push({
                            impl: impl,
                            type: opt.spFieldType
                        });
                    }
                });
                if (opt.typeAdapters.length === 1) {
                    opt.typeAdapters[0].impl.launchDialog(opt);
                } else {
                    // ask what type of adapter they want
                    $("#adapterFieldType").text(opt.spFieldType);
                    $("#adapterType").find("option:not(:first)").remove();
                    $.each(opt.typeAdapters, function(idx, current) {
                        $("#adapterType").append("<option value='" + idx + "'>" + current.impl.type + "</option>");
                    });
                    $("#adapterTypeDialog").dialog("open");
                }
            }
            $(".tabs-min").hide();
            $("#tabs-min-adapters").show();
        },
        
        preSaveItem: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            result = true;
            $.each(adapterCollection.adapterImplementations, function(idx, impl) {
                if(typeof(impl.preSaveItem) === "function") {
                    result = result && impl.preSaveItem(opt);
                }
            });
            return result;
        },

        drawAdapter: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var displayName = opt.fieldName;
            var klass = "speasyforms-adapter-static speasyforms-dblclickdialog";
            var title = JSON.stringify(opt.adapter);
            var config = "";
            
            $.each(Object.keys(opt.adapter).sort(), function(idx, key) {
                if(key != "type" && key != "columnNameInternal") {
                    if(config.length > 0)
                    {
                        config += "<br />";
                    }
                    config += "<b>" + key + "</b> = " + opt.adapter[key];
                }
            });
            
            if (containerCollection.rows[opt.adapter.columnNameInternal]  &&
                !containerCollection.rows[opt.adapter.columnNameInternal].fieldMissing) {
                displayName = containerCollection.rows[opt.adapter.columnNameInternal].displayName;
            }
            else {
                klass += " speasyforms-fieldmissing";
                title = "This field was not found in the form and may have been deleted.";
            }
            
            if(opt.verbose && klass.indexOf("speasyforms-fieldmissing") >= 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='"+klass+"' "+
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='"+title+"'>" +
                    "<td class='"+klass+"'>"+displayName+"</td>" +
                    "<td class='"+klass+" speasyforms-hidden' style='display:none'>"+opt.adapter.columnNameInternal+"</td>"+
                    "<td class='"+klass+"'>"+opt.adapter.type+"</td>"+
                    "<td class='"+klass+"'>"+config+"</td>"+
                    "</tr>");
            }
            else if (klass.indexOf("speasyforms-fieldmissing") < 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='"+klass+"' "+
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='"+title+"'>" +
                    "<td class='"+klass+"'>"+displayName+"</td>" +
                    "<td class='"+klass+" speasyforms-hidden' style='display:none'>"+opt.adapter.columnNameInternal+"</td>"+
                    "<td class='"+klass+"'>"+opt.adapter.type+"</td>"+
                    "<td class='"+klass+"'>"+config+"</td>"+
                    "</tr>");
            }
            else {
                $("#spEasyFormsAdapterTable").append("<tr class='"+klass+"' "+
                    "data-fieldname='" + opt.adapter.columnNameInternal + "' " +
                    "data-dialogtype='adapter' title='"+title+"' style='display:none'>" +
                    "<td class='"+klass+"'>"+displayName+"</td>" +
                    "<td class='"+klass+" speasyforms-hidden' style='display:none'>"+opt.adapter.columnNameInternal+"</td>"+
                    "<td class='"+klass+"'>"+opt.adapter.type+"</td>"+
                    "<td class='"+klass+"'>"+config+"</td>"+
                    "</tr>");
            }
        },
        
        compareAdapters: function(a, b) {
            var listctx = spContext.getListContext();
            var display1 = a;
            var display2 = b;
            if (a in listctx.fields) {
                a = listctx.fields[a].displayName;
            }
            if (b in listctx.fields) {
                b = listctx.fields[b].displayName;
            }
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        },

        validateRequired: function(options) {
            var control = $("#" + options.id);
            control.parent().find(".speasyforms-error").remove();
            if (!control.val()) {
                control.parent().append(
                    "<div class='speasyforms-error'>'" + options.displayName +
                    "' is a required field!</div>");
            }
        }
    };
    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for configuring cascading lookup fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.cascadingLookupAdapter = {
        type: "Cascading Lookup",

        supportedTypes: function(options) {
            return ["SPFieldLookup"];
        },

        transform: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.adapter.parentColumnInternal in containerCollection.rows && opt.adapter.columnNameInternal in containerCollection.rows) {
                opt.adapter.parentColumn =
                    containerCollection.rows[opt.adapter.parentColumnInternal].displayName;
                opt.adapter.childColumn =
                    containerCollection.rows[opt.adapter.columnNameInternal].displayName;
                opt.adapter.listName = spContext.getCurrentListId(opt);
                opt.adapter.debug = spEasyForms.defaults.verbose;
                $().SPServices.SPCascadeDropdowns(opt.adapter);
            }
        },

        toEditor: function(options) {
            if (!this.initialized) {
                var opt = $.extend({}, spEasyForms.defaults, options);
                var adapterOpts = {
                    modal: true,
                    buttons: {
                        "Ok": function() {
                            if (!opt.currentConfig.adapters) {
                                opt.currentConfig.adapters = {};
                            }
                            if (!opt.currentConfig.adapters.def) {
                                opt.currentConfig.adapters.def = {};
                            }
                            opt.adapters = opt.currentConfig.adapters.def;
                            opt.adapterField = $("#cascadingLookupHiddenFieldName").val();
                            if ($("#cascadingRelationshipListSelect").val().length === 0) {
                                if (opt.adapterField in opt.adapters) {
                                    delete opt.adapters[opt.adapterField];
                                }
                                configManager.set(opt);
                                $('#cascadingLookupAdapterDialog').dialog("close");
                                containerCollection.toEditor(opt);
                            } else {
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupRelationshipParentSelect",
                                    displayName: "Parent Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupRelationshipChildSelect",
                                    displayName: "Child Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupParentSelect",
                                    displayName: "Form Parent Column"
                                });
                                adapterCollection.validateRequired({
                                    id: "cascadingLookupChildSelect",
                                    displayName: "Form Child Column"
                                });
                                if ($("#cascadingLookupAdapterDialog").find(".speasyforms-error").length === 0) {
                                    var adapter = {};
                                    if (opt.adapterField && opt.adapterField in opt.adapters) {
                                        adapter = opt.adapters[opt.adapterField];
                                    } else {
                                        opt.adapters[opt.adapterField] = adapter;
                                    }
                                    adapter.type = cascadingLookupAdapter.type;
                                    adapter.relationshipList =
                                        $("#cascadingRelationshipListSelect").val();
                                    adapter.relationshipListParentColumn =
                                        $("#cascadingLookupRelationshipParentSelect").val();
                                    adapter.relationshipListChildColumn =
                                        $("#cascadingLookupRelationshipChildSelect").val();
                                    adapter.parentColumnInternal =
                                        $("#cascadingLookupParentSelect").val();
                                    adapter.columnNameInternal =
                                        $("#cascadingLookupChildSelect").val();
                                    configManager.set(opt);
                                    $('#cascadingLookupAdapterDialog').dialog("close");
                                    containerCollection.toEditor(opt);
                                }
                            }
                            return false;
                        },
                        "Cancel": function() {
                            $('#cascadingLookupAdapterDialog').dialog("close");
                            return false;
                        }
                    },
                    autoOpen: false,
                    width: 500
                };
                $('#cascadingLookupAdapterDialog').dialog(adapterOpts);
            }
        },

        launchDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // clear dialog
            cascadingLookupAdapter.clearDialog(opt);
            // init dialog
            var listCollection = spContext.getListCollection(opt);
            $.each(listCollection, function(idx, list) {
                $("#cascadingRelationshipListSelect").append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });
            $("#cascadingLookupList").val(opt.currentListContext.title);
            if ($("#cascadingRelationshipListSelect").attr("data-change") !== "true") {
                $("#cascadingRelationshipListSelect").attr("data-change", "true");
                $("#cascadingRelationshipListSelect").change(function(e) {
                    opt.listId = $("#cascadingRelationshipListSelect").val().toLowerCase();
                    cascadingLookupAdapter.initRelationshipFields({
                        listId: $("#cascadingRelationshipListSelect").val().toLowerCase()
                    });
                });
                $("#cascadingLookupRelationshipParentSelect").change(function(e) {
                    if ($("#cascadingLookupParentSelect").find("option[value='" +
                        $("#cascadingLookupRelationshipParentSelect").val() + "']").length > 0) {
                        $("#cascadingLookupParentSelect").find("option[text='" +
                            $("#cascadingLookupRelationshipParentSelect").text() + "']");
                    }
                });
            }
            $("#cascadingLookupChildSelect").val(opt.fieldName);
            $("#cascadingLookupHiddenFieldName").val(opt.fieldName);
            opt.adapters = opt.currentConfig.adapters.def;
            if (opt.fieldName in opt.adapters) {
                var a = opt.adapters[opt.fieldName];
                $("#cascadingRelationshipListSelect").val(
                    a.relationshipList);
                cascadingLookupAdapter.initRelationshipFields({
                    listId: a.relationshipList
                });
                $("#cascadingLookupRelationshipParentSelect").val(
                    a.relationshipListParentColumn);
                $("#cascadingLookupRelationshipChildSelect").val(
                    a.relationshipListChildColumn);
                $("#cascadingLookupParentSelect").val(
                    a.parentColumnInternal);
            }
            // launch dialog
            $('#cascadingLookupAdapterDialog').dialog("open");
        },

        initRelationshipFields: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            $("#cascadingLookupRelationshipParentSelect").find("option").remove();
            $("#cascadingLookupRelationshipParentSelect").append("<option></option>");
            $("#cascadingLookupRelationshipParentSelect").val("");
            $("#cascadingLookupRelationshipParentSelect").attr("disabled", "disabled");

            $("#cascadingLookupRelationshipChildSelect").find("option").remove();
            $("#cascadingLookupRelationshipChildSelect").append("<option></option>");
            $("#cascadingLookupRelationshipChildSelect").val("");
            $("#cascadingLookupRelationshipChildSelect").attr("disabled", "disabled");

            if (opt.listId) {
                var listctx = spContext.getListContext(opt);
                $.each(Object.keys(listctx.fields), function(idx, field) {
                    if (listctx.fields[field].spFieldType == "SPFieldLookup") {
                        $("#cascadingLookupRelationshipParentSelect").append(
                            "<option value='" +
                            listctx.fields[field].internalName + "'>" +
                            listctx.fields[field].displayName + "</option>");
                    }
                    $("#cascadingLookupRelationshipChildSelect").append(
                        "<option value='" +
                        listctx.fields[field].internalName + "'>" +
                        listctx.fields[field].displayName + "</option>");
                });
                $("#cascadingLookupRelationshipParentSelect").removeAttr("disabled");
                $("#cascadingLookupRelationshipChildSelect").removeAttr("disabled");
                var choices = $("#cascadingLookupRelationshipParentSelect").find("option");
                if (choices.length === 2) {
                    $("#cascadingLookupRelationshipParentSelect").val(
                        $(choices[1]).attr("value"));
                    var relationshipParentText =
                        $("#cascadingLookupRelationshipParentSelect option:selected").text();
                    var thisParentOption =
                        $("#cascadingLookupParentSelect").find(
                            "option:contains('" + relationshipParentText + "')");
                    $("#cascadingLookupParentSelect").val(thisParentOption.val());
                }
                var thisChildText =
                    $("#cascadingLookupChildSelect option:selected").text();
                var relationshipChildOption =
                    $("#cascadingLookupRelationshipChildSelect").find(
                        "option:contains('" + thisChildText + "')");
                $("#cascadingLookupRelationshipChildSelect").val(
                    relationshipChildOption.val());
            }
        },

        clearDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            $("#cascadingLookupAdapterDialog").find(".speasyforms-error").remove();

            $("#cascadingRelationshipListSelect").find("option").remove();
            $("#cascadingRelationshipListSelect").append("<option></option>");
            $("#cascadingRelationshipListSelect").val("");

            $("#cascadingLookupRelationshipParentSelect").find("option").remove();
            $("#cascadingLookupRelationshipParentSelect").append("<option></option>");
            $("#cascadingLookupRelationshipParentSelect").val("");
            $("#cascadingLookupRelationshipParentSelect").attr("disabled", "disabled");

            $("#cascadingLookupRelationshipChildSelect").find("option").remove();
            $("#cascadingLookupRelationshipChildSelect").append("<option></option>");
            $("#cascadingLookupRelationshipChildSelect").val("");
            $("#cascadingLookupRelationshipChildSelect").attr("disabled", "disabled");

            $("#cascadingLookupParentSelect").find("option").remove();
            $("#cascadingLookupParentSelect").append("<option></option>");
            $("#cascadingLookupParentSelect").val("");

            $("#cascadingLookupChildSelect").find("option").remove();
            $("#cascadingLookupChildSelect").append("<option></option>");
            $("#cascadingLookupChildSelect").val("");

            var fields = containerCollection.rows;
            $.each(Object.keys(containerCollection.rows).sort(spRows.compareField), function(idx, field) {
                if (fields[field].spFieldType == "SPFieldLookup") {
                    $("#cascadingLookupParentSelect").append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                    $("#cascadingLookupChildSelect").append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                }
            });
        }
    };
    var cascadingLookupAdapter = $.spEasyForms.cascadingLookupAdapter;
    adapterCollection.adapterImplementations[cascadingLookupAdapter.type] = cascadingLookupAdapter;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for autocomplete on text fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.autocompleteAdapter = {
        type: "Autocomplete",

        supportedTypes: function(options) {
            return ["SPFieldText"];
        },

        transform: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.adapter.columnNameInternal in containerCollection.rows) {
                var autocompleteData = [];
                $().SPServices({
                    operation: "GetListItems",
                    async: true,
                    listName: opt.adapter.sourceList,
                    CAMLViewFields: "<ViewFields>" +
                        "<FieldRef Name='" + opt.adapter.sourceField + "' />" +
                        "</ViewFields>",
                    CAMLQuery: "<Query><OrderBy>" +
                        "<FieldRef Name='" + opt.adapter.sourceField + "' Ascending='True' />" +
                        "</OrderBy></Query>",
                    completefunc: function (xData) {
                        $(xData.responseXML).SPFilterNode("z:row").each(function () {
                            autocompleteData.push($(this).attr("ows_" + opt.adapter.sourceField));
                        });

                        if (autocompleteData.length > 0) {
                            containerCollection.rows[opt.adapter.columnNameInternal].row.find("input").autocomplete({
                                source: autocompleteData,
                                minLength: 2
                            });
                        }
                    }
                });
            }
        },

        toEditor: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var autocompleteOpts = {
                modal: true,
                buttons: {
                    "Ok": function() {
                        adapterCollection.validateRequired({
                            id: "autocompleteFieldSelect",
                            displayName: "Lookup Field"
                        });
                        if ($("#autocompleteListSelect").val().length > 0) {
                            if ($("#AutocompleteDialog").find(".speasyforms-error").length === 0) {
                                var result = {
                                    type: "Autocomplete",
                                    sourceList: $("#autocompleteListSelect").val(),
                                    sourceField: $("#autocompleteFieldSelect").val(),
                                    columnNameInternal: $("#autocompleteChildSelect").val(),
                                    ignoreCase: true,
                                    uniqueVals: true,
                                    filterType: "Contains",
                                    debug: opt.verbose
                                };
                                opt.adapters[result.columnNameInternal] = result;
                                configManager.set(opt);
                                $('#autocompleteAdapterDialog').dialog("close");
                                containerCollection.toEditor(opt);
                            }
                        } else {
                            if ($("#autoCompleteHiddenFieldName").val() in opt.adapters) {
                                delete opt.adapters[$("#autoCompleteHiddenFieldName").val()];
                                configManager.set(opt);
                                containerCollection.toEditor(opt);
                            }
                            $('#autocompleteAdapterDialog').dialog("close");
                        }
                    },
                    "Cancel": function() {
                        $('#autocompleteAdapterDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#autocompleteAdapterDialog').dialog(autocompleteOpts);
        },

        launchDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            $("#autocompleteAdapterDialog").find(".speasyforms-error").remove();

            opt.adapter = undefined;
            if (opt.fieldName in opt.adapters) {
                opt.adapter = opt.adapters[opt.fieldName];
            }

            // initialize the lookup list
            $("#autocompleteListSelect").val("");
            $("#autocompleteListSelect option").remove();
            $("#autocompleteListSelect").append("<option></option>");
            var listCollection = spContext.getListCollection(opt);
            $.each(listCollection, function(idx, list) {
                $("#autocompleteListSelect").append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });

            if (opt.adapter) {
                $("#autocompleteListSelect").val(opt.adapter.sourceList);
            }

            // initialize the lookup field
            opt.listId = $("#autocompleteListSelect").val();
            if (opt.listId) {
                opt.autocompleteContext = spContext.getListContext(opt);
                $("#autocompleteFieldSelect option").remove();
                $("#autocompleteFieldSelect").append("<option></option>");
                $.each(Object.keys(opt.autocompleteContext.fields), function(idx, field) {
                    $("#autocompleteFieldSelect").append("<option value='" +
                        opt.autocompleteContext.fields[field].internalName + "'>" +
                        opt.autocompleteContext.fields[field].displayName + "</option>");
                });
            } else {
                $("#autocompleteFieldSelect option").remove();
            }

            if (opt.adapter) {
                $("#autocompleteFieldSelect").val(opt.adapter.sourceField);
            }

            $("#autocompleteChildSelect option").remove();
            $("#autocompleteChildSelect").append("<option></option>");
            $.each(Object.keys(opt.currentListContext.fields), function(idx, field) {
                $("#autocompleteChildSelect").append("<option value='" +
                    opt.currentListContext.fields[field].internalName + "'>" +
                    opt.currentListContext.fields[field].displayName + "</option>");
            });
            $("#autocompleteChildSelect").val(opt.fieldName).attr("disabled", "disabled");
            $("#autoCompleteHiddenFieldName").val(opt.fieldName);

            // add a change listener to reinitialize on change of the lookup list
            if ($("#autocompleteListSelect").attr("data-changelistener") !== "true") {
                $("#autocompleteListSelect").attr("data-changelistener", "true");
                $("#autocompleteListSelect").change(function(e) {
                    opt.listId = $("#autocompleteListSelect").val();
                    if (opt.listId) {
                        opt.autocompleteContext = spContext.getListContext(opt);
                        $("#autocompleteFieldSelect option").remove();
                        $("#autocompleteFieldSelect").append("<option></option>");
                        $.each(Object.keys(opt.autocompleteContext.fields), function(idx, field) {
                            $("#autocompleteFieldSelect").append("<option value='" +
                                opt.autocompleteContext.fields[field].internalName + "'>" +
                                opt.autocompleteContext.fields[field].displayName + "</option>");
                        });
                    }
                });
            }

            $('#autocompleteAdapterDialog').dialog("open");
        }
    };
    var autocompleteAdapter = $.spEasyForms.autocompleteAdapter;
    adapterCollection.adapterImplementations[autocompleteAdapter.type] = autocompleteAdapter;

    ////////////////////////////////////////////////////////////////////////////
    // Sample field control adapter for red text on text fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.redAdapter = {
        type: "Red Text Adapter",

        supportedTypes: function(options) {
            return ["SPFieldText"];
        },

        transform: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.adapter.columnNameInternal in containerCollection.rows) {
                var currentRow = containerCollection.rows[opt.adapter.columnNameInternal].row;
                currentRow.find("input").css({
                    color: "red"
                });
                currentRow.find("td.ms-formbody").css({
                    color: "red"
                });
                if (currentRow.attr("data-visibilityhidden") === "true") {
                    if (currentRow.next().attr("data-visibilityadded") === "true") {
                        currentRow.next().find("td").css({
                            color: "red"
                        });
                    }
                }
            }
        },

        toEditor: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if ($("#redAdapterDialog").length === 0) {
                $("#spEasyFormsContainerDialogs").append("<div id='redAdapterDialog' class='speasyforms-dialogdiv' title='Red Text Adapter'>" +
                    "Do you want to add a Red adapter to <span id='redColumn'></span>.</div>");
            }
            var autocompleteOpts = {
                modal: true,
                buttons: {
                    "Ok": function() {
                        if ($("#redAdapterDialog").html().indexOf("delete") <= 0) {
                            var result = {
                                type: redAdapter.type,
                                columnNameInternal: $("#redColumn").text()
                            };
                            opt.currentConfig = configManager.get(opt);
                            opt.adapters = opt.currentConfig.adapters.def;
                            opt.adapters[result.columnNameInternal] = result;
                            configManager.set(opt);
                            $('#redAdapterDialog').dialog("close");
                            containerCollection.toEditor(opt);
                        } else {
                            opt.currentConfig = configManager.get(opt);
                            opt.adapters = opt.currentConfig.adapters.def;
                            delete opt.adapters[$("#redColumn").text()];
                            configManager.set(opt);
                            containerCollection.toEditor(opt);
                        }
                        $('#redAdapterDialog').dialog("close");
                    },
                    "Cancel": function() {
                        $('#redAdapterDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#redAdapterDialog').dialog(autocompleteOpts);
        },

        launchDialog: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.adapters[opt.fieldName]) {
                $("#redAdapterDialog").html("Do you want to delete the Red Text Adapter on <span id='redColumn'></span>.");
            } else {
                $("#redAdapterDialog").html("Do you want to add a Red Text Adapter to <span id='redColumn'></span>.");
            }
            $("#redColumn").text(opt.fieldName);
            $('#redAdapterDialog').dialog("open");
        }
    };
    var redAdapter = $.spEasyForms.redAdapter;
    //adapterCollection.adapterImplementations[redAdapter.type] = redAdapter;

    ////////////////////////////////////////////////////////////////////////////
    // Class that encapsulates getting, setting, and saving the SPEasyForms
    // configuration file for the current list.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.configManager = {
        undoBuffer: [],
        
        redoBuffer: [],
        
        /*********************************************************************
         * Get the configuration file for the current list.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *
         * @return {object} - the configuration object, in the form:
         *
         * {
         *     "layout": { // configuration of containers
         *         "def": [ // the default layout, later there will be other
         *             // layouts for other content types the default form
         *          // container has any fields not placed on another container,
         *             // this is not necessarily the first container
         *             {
         *                 "containerType": "DefaultForm",
         *                 "index": "d"
         *             },
         *             // each additional property is another container
         *             {
         *                 // the type is used to find the implementation
         *                 "containerType": "Tabs",
         *                 // this is an immutable index that is set at the time the container
         *                 // was added to the configuration, and is used to find it as things
         *                 // are moved around through drag and drop, the actual value is
         *                 // not important, just that it is unique
         *                 "index": "1",
         *                 // technically, the rest of the container configuration is implementation
         *                 // specific, but all of the built-in container implemenations have an
         *                 // array of field collections; for tabs, one field collection equals one tab, for
         *                 // accordion one content area, etc.
         *                 "fieldCollections": [
         *                     {
         *                         // the name of the field collection, how theis is used is container
         *                         // specific; for tabs this is the tab header, for columns this
         *                         // isn't used at all when transforming the form, only in the
         *                         // editor
         *                         "name": "one",
         *                         // an array of field internal names
         *                         "fields": [
         *                             {
         *                                 "fieldInternalName": "FirstName"
         *                             },
         *                             {
         *                                 "fieldInternalName": "FullName"
         *                             }
         *                         ]
         *                     },
         *                     {
         *                         "name": "two",
         *                         "fields": [
         *                             {
         *                                 "fieldInternalName": "Email"
         *                             },
         *                             {
         *                                 "fieldInternalName": "Company"
         *                             }
         *                         ]
         *                     }
         *                 ]
         *             },
         *             {
         *                 "containerType": "Columns",
         *                 "index": "2",
         *                 "fieldCollections": [
         *                     {
         *                         "name": "1",
         *                         "fields": [
         *                             {
         *                                 "fieldInternalName": "JobTitle"
         *                             },
         *                             {
         *                                 "fieldInternalName": "WorkPhone"
         *                             }
         *                         ]
         *                     },
         *                     {
         *                         "name": "2",
         *                         "fields": [
         *                             {
         *                                 "fieldInternalName": "HomePhone"
         *                             },
         *                             {
         *                                 "fieldInternalName": "CellPhone"
         *                             }
         *                         ]
         *                     }
         *                 ]
         *             }
         *         ]
         *     },
         *     "visibility": { the conditional visibility rules
         *         "def": { // the default rule set, again, there could be
         *             // multiples in the future for multiple content types
         *             // the field internal name is the key to an array of
         *             // rules, the first rule that matches
         *             // the current user is the only one executed
         *             "FirstName": [
         *                 {
         *                     // Hidden, ReadOnly, or Editable; Editable really
         *                     // does nothing to the form, but stops processing
         *                     "state": "Editable",
         *                     // rules can be written for specific forms,
         *                     // the default is all forms
         *                     "forms": "New;Edit;Display",
         *                     // rules can be applied to specific SharePoint
         *                     // groups and/or the original author of the
         *                     // current item, the default is applies to everyone
         *                     "appliesTo": "Joe McShea - Dev Site Members"
         *                 },
         *                 {
         *                     "state": "ReadOnly",
         *                     "forms": "New;Edit;Display",
         *                     "appliesTo": "Joe McShea - Dev Site Visitors"
         *                 },
         *                 {
         *                     "state": "Hidden",
         *                     "forms": "New;Edit;Display",
         *                     "appliesTo": ""
         *                 }
         *             ],
         *             "Email": [
         *                 {
         *                     "state": "Editable",
         *                     "forms": "New;Edit;Display",
         *                     "appliesTo": "Joe McShea - Dev Site Members"
         *                 },
         *                 {
         *                     "state": "ReadOnly",
         *                     "forms": "New;Edit;Display",
         *                     "appliesTo": "Joe McShea - Dev Site Visitors"
         *                 },
         *                 {
         *                     "state": "Hidden",
         *                     "forms": "New;Edit;Display",
         *                     "appliesTo": ""
         *                 }
         *             ]
         *         }
         *     }
         * }
         *********************************************************************/
        get: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var currentConfig;
            if ($("#spEasyFormsJson pre").text().length > 0) {
                currentConfig = utils.parseJSON($("#spEasyFormsJson pre").text());
            } else {
                currentConfig = spContext.getConfig(opt);
                $("#spEasyFormsJson pre").text(JSON.stringify(currentConfig, null, 4));
            }
            if (currentConfig === undefined) {
                $("#spEasyFormsExportButton img").addClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsExportButton div").addClass("speasyforms-buttontextdisabled");
                currentConfig = {
                    layout: {
                        def: [{
                            "containerType": defaultFormContainer.containerType
                        }]
                    },
                    visibility: {
                        def: {}
                    },
                    adapters: {
                        def: {}
                    }
                };
                $("#spEasyFormsJson pre").text(JSON.stringify(currentConfig, null, 4));
            }
            options.layout = currentConfig.layout.def;
            $.each(options.layout, function(idx, container) {
                if(container.fieldGroups) {
                    container.fieldCollections = container.fieldGroups;
                    delete container.fieldGroups;
                }
            });
            return currentConfig;
        },

        /*********************************************************************
         * Set the current configuration.  This stores it in a control on the
         * page, it does not write it back to the server.  Use save to write it
         * back to the server. The save button is also enabled by this function.
         *
         * @param {object} options - {
         *     config: {object}  // the configuration object to be set
         * }
         *********************************************************************/
        set: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.currentConfig.version = "2014.00.08.e";
            var newConfig = JSON.stringify(opt.currentConfig, null, 4);
            var oldConfig = $("#spEasyFormsJson pre").text();
            if (newConfig != oldConfig) {
                $("#spEasyFormsJson pre").text(newConfig);
                $("#spEasyFormsSaveButton img").removeClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsSaveButton div").removeClass("speasyforms-buttontextdisabled");
                $("#spEasyFormsExportButton img").addClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsExportButton div").addClass("speasyforms-buttontextdisabled");
                $("#spEasyFormsImportButton img").addClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsImportButton div").addClass("speasyforms-buttontextdisabled");
                this.undoBuffer.push(oldConfig);
                $("#spEasyFormsUndoButton img").removeClass("speasyforms-buttonimgdisabled");
                $("#spEasyFormsUndoButton").removeClass("speasyforms-buttontextdisabled");
            }
        },

        /*********************************************************************
         * Write the configuration back to a file in the SiteAssets library. The
         * save button is also disabled by this function, since there are no
         * changes to be saved.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         *********************************************************************/
        save: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var listId = spContext.getCurrentListId(opt);
            $.ajax({
                url: opt.currentContext.webAppUrl + opt.currentContext.webRelativeUrl +
                    "/SiteAssets/spef-layout-" +
                    listId.replace("{", "").replace("}", "") + ".txt",
                type: "PUT",
                headers: {
                    "Content-Type": "text/plain",
                    "Overwrite": "T"
                },
                data: $("#spEasyFormsJson pre").text(),
                success: function(data) {
                    opt.listId = listId;
                    opt.currentConfig = utils.parseJSON($("#spEasyFormsJson pre").text());
                    spContext.setConfig(opt);
                    $("#spEasyFormsSaveButton img").addClass("speasyforms-buttonimgdisabled");
                    $("#spEasyFormsSaveButton div").addClass("speasyforms-buttontextdisabled");
                    $("#spEasyFormsExportButton img").removeClass("speasyforms-buttonimgdisabled");
                    $("#spEasyFormsExportButton div").removeClass("speasyforms-buttontextdisabled");
                    $("#spEasyFormsImportButton img").removeClass("speasyforms-buttonimgdisabled");
                    $("#spEasyFormsImportButton div").removeClass("speasyforms-buttontextdisabled");
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (xhr.status === 409) {
                        alert("The web service returned 409 - CONFLICT. " +
                            "This most likely means you do not have a 'Site Assets' " +
                            "library in the current site with a URL of SiteAssets. " +
                            "This is required before you can load and save " +
                            "SPEasyForms configuration files.");
                    } else {
                        alert("Error uploading configuration.\nStatus: " + xhr.status +
                            "\nStatus Text: " + thrownError);
                    }
                }
            });
        }
    };
    var configManager = $.spEasyForms.configManager;

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
         *         url: <your edit form url>,
         *         complete: function (xData) {
         *             var rows = $.spEasyForms.sharePointFieldRows.init(
         *                 { input: $(xData.responseText) });
         *             // have fun with rows
         *         }
         *     });
         ********************************************************************/
        init: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var input;
            if (opt.input !== undefined) {
                input = opt.input.find(opt.formBodySelector).closest("tr");
            } else {
                input = $(opt.formBodySelector).closest("tr");
                this.rows = {};
            }
            var results = {};
            input.each(function() {
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
        processTr: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var current = opt.tr;
            var result = {};
            // attachments is a special case, there is no comment in SP 2010
            if (current.html().indexOf("idAttachmentsRow") >= 0) {
                result.row = current;
                result.internalName = "Attachments";
                result.displayName = "Attachments";
                result.type = "SPFieldAttachments";
            } else {
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
                result = {
                    row: current,
                    internalName: internal,
                    displayName: display,
                    spFieldType: fieldType
                };
                if (!result.internalName || !result.displayName || !result.spFieldType) {
                    if (opt.currentListContext) {
                        var schema = opt.currentListContext.schema;
                        if (schema && result.internalName !== undefined) {
                            if (result.displayName === undefined) {
                                result.displayName = result.internalName;
                                if (result.internalName in schema) {
                                    result.displayName =
                                        schema[result.internalName].displayName;
                                }
                            }
                            if (result.spFieldType === undefined) {
                                result.spFieldType = "SPFieldText";
                                if (result.internalName in schema) {
                                    result.spFieldType = "SPField" +
                                        schema[result.internalName].type;
                                }
                            }
                        } else if (schema &&
                            current.find(opt.fieldDisplayNameAltSelector).length > 0) {
                            result.displayName =
                                current.find(opt.fieldDisplayNameAltSelector)
                                .text().replace('*', '').trim();
                            if (result.displayName in schema) {
                                result.internalName =
                                    schema[result.displayName].name;
                                result.spFieldType = "SPField" +
                                    schema[result.displayName].type;
                            }
                        }
                    }
                }
                opt.row = result;
                result.value = this.value(opt);
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
        capture: function(options) {
            var matches = options.row.html().match(options.regex);
            if (matches && matches.length >= 2) return matches[1];
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
        value: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var tr = opt.row;
            tr.value = "";
            try {
                if(visibilityRuleCollection.getFormType(opt) === "display") {
                    return tr.row.find("td.ms-formbody").text().trim();
                }
                switch (tr.spFieldType) {
                    case "SPFieldChoice":
                        var select = tr.row.find("td.ms-formbody select");
                        if (select.length > 0) {
                            tr.value = tr.row.find("td.ms-formbody select").val();
                            var tmp = tr.row.find("input:checked").first();
                            var re = new RegExp(/FillInButton$/i);
                            if(tmp.length > 0 && re.test(tmp[0].id)) {
                                tr.value = tr.row.find("input[type='text']").val();
                            }
                        } else {
                            tr.value = "";
                            tr.row.find("input:checked").each(function() {
                                if (tr.value) { tr.value += ";"; }
                                var re = new RegExp(/FillInRadio$/i);
                                if($(this).length > 0 && !re.test($(this)[0].id)) {
                                    tr.value += $(this).val();
                                }
                                else {
                                    tr.value += tr.row.find("input[type='text']").val();
                                }
                            });
                        }
                        break;
                    case "SPFieldNote":
                    case "SPFieldMultiLine":
                        tr.value = "";
                        var input = tr.row.find("td.ms-formbody input");
                        if (input.length > 0 && !(input.val().search(/^<p>.*<\/p>$/) >= 0 &&
                            input.val().length == 8)) {
                            tr.value = input.val().trim();
                            if(tr.value.indexOf("<div") === 0) {
                                tr.value = "<div class='ms-rtestate-field'>" + tr.value + "</div>";
                            }
                        }
                        var textarea = tr.row.find("td.ms-formbody textarea");
                        if (textarea.length > 0) {
                            tr.value = textarea.val().replace("\n", "<br />\n");
                        }
                        var appendedText =
                            tr.row.find(".ms-imnSpan").parent().parent();
                        if (appendedText.length > 0) {
                            $.each(appendedText, function(i, t) {
                                tr.value += t.outerHTML;
                            });
                        }
                        break;
                    case "SPFieldMultiChoice":
                        tr.value = "";
                        tr.row.find("input:checked").each(function() {
                            if (tr.value.length > 0) tr.value += "; ";
                            var re = new RegExp(/FillInRadio$/i);
                            if($(this).length > 0 && !re.test($(this)[0].id)) {
                                tr.value += $(this).next().text();
                            }
                            else {
                                tr.value += tr.row.find("input[type='text']").val();
                            }
                        });
                        break;
                    case "SPFieldDateTime":
                        tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        var selects = tr.row.find("select");
                        if (selects.length == 2) {
                            var tmp2 = $(selects[0]).find(
                                "option:selected").text().split(' ');
                            if (tmp2.length == 2) {
                                var hour = tmp2[0];
                                var ampm = tmp2[1];
                                var minutes = $(selects[1]).val();
                                tr.value += " " + hour + ":" + minutes + " " +
                                    ampm;
                            }
                        }
                        break;
                    case "SPFieldLookup":
                        tr.value = tr.row.find("option:selected").text();
                        break;
                    case "SPFieldLookupMulti":
                        tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        if (tr.value.indexOf("|t") >= 0) {
                            var parts = tr.value.split("|t");
                            tr.value = "";
                            for (i = 1; i < parts.length; i += 2) {
                                if (tr.value.length === 0) {
                                    tr.value += parts[i];
                                } else {
                                    tr.value += "; " + parts[i];
                                }
                            }
                        }
                        break;
                    case "SPFieldBoolean":
                        tr.value =
                            tr.row.find("td.ms-formbody input").is(":checked");
                        if (tr.value) {
                            tr.value = "Yes";
                        } else {
                            tr.value = "No";
                        }
                        break;
                    case "SPFieldURL":
                        var inputs = tr.row.find("td.ms-formbody input");
                        if ($(inputs[0]).val().length > 0 &&
                            $(inputs[1]).val().length > 0) {
                            tr.value = "<a href='" + $(inputs[0]).val() +
                                "' target='_blank'>" + $(inputs[1]).val() +
                                "</a>";
                        } else if ($(inputs[0]).val().length > 0) {
                            tr.value = "<a href='" + $(inputs[0]).val() +
                                "' target='_blank'>" + $(inputs[0]).val() +
                                "</a>";
                        } else {
                            tr.value = "";
                        }
                        break;
                    case "SPFieldUser":
                    case "SPFieldUserMulti":
                        var tmp3 = tr.row.find("input[type='hidden']").val();
                        if(typeof(tmp3) != 'undefined') {
                            var hiddenInput = utils.parseJSON(tmp3);
                            $.each(hiddenInput, function(idx, entity) {
                                if (tr.value.length > 0) {
                                    tr.value += "; ";
                                }
                                tr.value += "<a href='" +
                                    opt.currentContext.webRelativeUrl +
                                    "/_layouts/userdisp.aspx?ID=" +
                                    entity.EntityData.SPUserID +
                                    "' target='_blank'>" +
                                    entity.DisplayText + "</a>";
                            });
                        }
                        break;
                    default:
                        tr.value =
                            tr.row.find("td.ms-formbody input").val().trim();
                        break;
                }
            } catch (e) {}
            if (!tr.value) {
                tr.value = "";
            }
            return tr.value;
        },

        compareField: function(a, b) {
            var fields = spContext.getListContext().fields;
            if (a in fields && b in fields) {
                if (fields[a].displayName < fields[b].displayName) {
                    return -1;
                }
                if (fields[a].displayName > fields[b].displayName) {
                    return 1;
                }
            }
            return 0;
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
        get: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            var result = this.ctx;
            if (result === undefined) {
                if (opt.useCache) {
                    opt.siteUrl = this.getCurrentSiteUrl(opt);
                    result = spEasyForms.readCachedContext(opt);
                }
                if (typeof(result) == 'undefined') {
                    result = {};
                    result.siteRelativeUrl = _spPageContextInfo.siteServerRelativeUrl;
                    result.webAppUrl = window.location.href.substring(0,
                        window.location.href.indexOf(window.location.pathname));
                    result.webRelativeUrl = opt.siteUrl;
                    result.webUIVersion = _spPageContextInfo.webUIVersion;
                    result.listId = this.getCurrentListId(opt);
                    result.userId = _spPageContextInfo.userId;
                    result.userProfile = {};
                    result.userInformation = {};
                    result.listContexts = {};
                }
            }
            result.listId = this.getCurrentListId(opt);
            if (opt.useCache) {
                opt.currentContext = result;
                spEasyForms.writeCachedContext(opt);
            }
            this.ctx = result;
            return result;
        },

        /*********************************************************************
         * Initialize as much of spContext through asynchronous SPServices and
         * ajax calls as we can.
         *
         * @param {object} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     callback {function} - a function taking an options argument to
         *         be called when all asynchronous calls are complete.
         * }
         *********************************************************************/
        initAsync: function(options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var promises = [];

            if (!opt.useCache || !currentContext.user || $.isEmptyObject(currentContext.user)) {
                promises.push($.ajax({
                    async: true,
                    url: spContext.getCurrentSiteUrl(opt) +
                        "/_layouts/userdisp.aspx?Force=True&" + new Date().getTime()
                }));
            }

            if (!opt.useCache || !currentContext.siteGroups || $.isEmptyObject(currentContext.siteGroups)) {
                promises.push($().SPServices({
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: "GetGroupCollectionFromWeb",
                    async: true,
                    debug: opt.verbose
                }));
            }

            if (currentContext.userInformation && currentContext.userInformation.name) {
                if (!opt.useCache || !currentContext.groups || $.isEmptyObject(currentContext.groups)) {
                    promises.push($().SPServices({
                        webURL: spContext.getCurrentSiteUrl(opt),
                        operation: "GetGroupCollectionFromUser",
                        userLoginName: currentContext.userInformation.name,
                        async: true,
                        debug: opt.verbose
                    }));
                }
            }

            if (promises.length > 0) {
                $.when.apply($, promises).done(function(data) {
                    $(promises).each(function() {
                        var result = {};
                        if (this.status == 200) {
                            // userdisp.aspx
                            if (this.responseText.indexOf("Personal Settings") > 0) {
                                currentContext.userInformation = {};
                                opt.input = $(this.responseText);
                                var rows = spRows.init(opt);
                                $.each(rows, function(idx, row) {
                                    var prop = row.internalName[0].toLowerCase() + row.internalName.substring(1);
                                    currentContext.userInformation[prop] = row.row.find("td[id^='SPField']").text().trim();
                                });
                            }
                            // GetGroupCollectionFromSite
                            else if ($(this.responseText).find("GetGroupCollectionFromWebResponse").length > 0) {
                                spContext.siteGroups = {};
                                $(this.responseText).find("Group").each(function() {
                                    var group = {};
                                    group.name = $(this).attr("Name");
                                    group.id = $(this).attr("ID");
                                    spContext.siteGroups[group.id] = group;
                                    spContext.siteGroups[group.name] = group;
                                });
                            }
                            // GetGroupCollectionFromUser
                            else if ($(this.responseText).find("GetGroupCollectionFromUserResponse").length > 0) {
                                spContext.groups = {};
                                $(this.responseText).find("Group").each(function() {
                                    var group = {};
                                    group.name = $(this).attr("Name");
                                    group.id = $(this).attr("ID");
                                    spContext.groups[group.id] = group;
                                    spContext.groups[group.name] = group;
                                });
                            }
                        }
                    });
                    if (opt.useCache) {
                        opt.currentContext = currentContext;
                        spEasyForms.writeCachedContext(opt);
                    }
                    opt.callback(options);
                }).fail(function(data) {
                    opt.callback(options);
                });
            } else {
                opt.callback(options);
            }
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
        getUserInformation: function(options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var user = ("userInformation" in currentContext ?
                currentContext.userInformation : {});
            if (!opt.useCache || 'userId' in opt || $.isEmptyObject(user)) {
                var id = (typeof(opt.userId) != 'undefined' ?
                    "ID=" + opt.userId + "&" : "");
                $.ajax({
                    async: false,
                    url: spContext.getCurrentSiteUrl(opt) +
                        "/_layouts/userdisp.aspx?Force=True&" + id + "&" +
                        new Date().getTime(),
                    complete: function(xData) {
                        opt.input = $(xData.responseText);
                        var rows = spRows.init(opt);
                        $.each(rows, function(idx, row) {
                            var prop = row.internalName[0].toLowerCase() +
                                row.internalName.substring(1);
                            currentContext.userInformation[prop] =
                                row.row.find("td[id^='SPField']").text().trim();
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
        getUserProfile: function(options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            var user = ("userProfile" in currentContext ?
                currentContext.userProfile : {});
            if (!opt.useCache || "accountName" in opt || $.isEmptyObject(user)) {
                var params = {
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: 'GetUserProfileByName',
                    async: false,
                    debug: opt.verbose,
                    completefunc: function(xData, Status) {
                        $(xData.responseXML).SPFilterNode("PropertyData").each(
                            function() {
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
         * @returns {object} - {}
         *********************************************************************/
        getListContext: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!opt.currentContext) {
                opt.currentContext = spContext.get();
            }
            if (!opt.listId) {
                opt.listId = this.getCurrentListId(opt);
            }
            if (!opt.listId) {
                return undefined;
            }
            var result = {};
            if (opt.useCache && opt.listId in opt.currentContext.listContexts) {
                result = opt.currentContext.listContexts[opt.listId];
            } else {
                result.title = "Unknow List Title";
                result.fields = {};
                if(opt.listId in opt.currentContext.listContexts) {
                    result = opt.currentContext.listContexts[opt.listId];
                }
                var rows = {};
                if(opt.listId === spContext.getCurrentListId(spEasyForms.defaults)) {
                    rows = spRows.init(opt);
                }
                if(Object.keys(rows).length === 0) {
                    $.ajax({
                        async: false,
                        url: spContext.getCurrentSiteUrl(opt) +
                            "/_layouts/listform.aspx?PageType=8&ListId=" +
                            opt.listId +
                            ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") +
                            "&RootFolder=",
                        complete: function (xData) {
                            if (opt.listId === spContext.getCurrentListId(opt)) {
                                spContext.formCache = xData.responseText;
                            }
                            opt.input = $(xData.responseText);
                            rows = spRows.init(opt);
                            $.each(rows, function (idx, row) {
                                result.fields[row.internalName] = row;
                            });
                        }
                    });
                }
                else
                {
                    $.each(rows, function (idx, row) {
                        result.fields[row.internalName] = row;
                    });
                }
                $().SPServices({
                    async: false,
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: "GetList",
                    listName: opt.listId,
                    debug: opt.verbose,
                    completefunc: function(xData) {
                        result.title =
                            $(xData.responseText).find("List").attr("Title");
                        result.template =
                            $(xData.responseText).find("List").attr("ServerTemplate");
                        result.feature =
                            $(xData.responseText).find("List").attr("FeatureId");
                        result.baseType =
                            $(xData.responseText).find("List").attr("BaseType");
                        result.defaultUrl =
                            $(xData.responseText).find("List").attr("DefaultViewUrl");
                        result.schema = {};
                        $.each($(xData.responseText).find("Field"), function(idx, field) {
                            if ($(field).attr("Hidden") !== "hidden" &&
                                $(field).attr("ReadOnly") !== "readonly") {
                                var newField = {};
                                newField.name = $(field).attr("Name");
                                newField.staticName = $(field).attr("StaticName");
                                newField.id = $(field).attr("ID");
                                newField.displayName = $(field).attr("DisplayName");
                                newField.type = $(field).attr("Type");
                                newField.required = $(field).attr("Required");
                                result.schema[newField.displayName] = newField;
                                result.schema[newField.name] = newField;
                            }
                        });
                    }
                });
                $().SPServices({
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: "GetListContentTypes",
                    listName: opt.listId,
                    async: false,
                    debug: opt.verbose,
                    completefunc: function(xData) {
                        var contentTypes = {};
                        contentTypes.order = $(xData.responseText).find(
                            "ContentTypes").attr("ContentTypeOrder").split(",");
                        $.each($(xData.responseText).find("ContentType"), function(idx, ct) {
                            var newCt = {};
                            newCt.name = $(ct).attr("Name");
                            newCt.id = $(ct).attr("ID");
                            newCt.description = $(ct).attr("Description");
                            contentTypes[newCt.id] = newCt;
                        });
                        result.contentTypes = contentTypes;
                    }
                });
                var listCount = Object.keys(opt.currentContext.listContexts).length;
                if (!(opt.listId in opt.currentContext.listContexts) &&
                    listCount >= opt.maxListCache) {
                    delete opt.currentContext.listContexts[Object.keys(opt.currentContext.listContexts)[0]];
                }
                opt.currentContext.listContexts[opt.listId] = result;
                spEasyForms.writeCachedContext(opt);
            }
            return result;
        },

        getListCollection: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (spContext.listCollection) {
                return spContext.listCollection;
            }
            if (!opt.siteRelativeUrl) {
                opt.siteRelativeUrl = this.getCurrentSiteUrl(opt);
            }
            spContext.listCollection = [];
            $().SPServices({
                webURL: opt.siteRelativeUrl,
                async: false,
                operation: "GetListCollection",
                debug: opt.verbose,
                completefunc: function(xData) {
                    $.each($(xData.responseText).find("List"), function(idx, list) {
                        var listId = $(list).attr("ID");
                        var listTitle = $(list).attr("Title");
                        var newList = {};
                        newList.id = listId;
                        newList.title = listTitle;
                        spContext.listCollection.push(newList);
                    });
                }
            });
            return spContext.listCollection;
        },

        /*********************************************************************
         * Get a map of SharePoint groups by account login. Returns an object
         * with two keys per group, one by name and one by id.
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
         *     ... // additional groups
         * }
         *********************************************************************/
        getUserGroups: function(options) {
            var currentContext = this.get(options);
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (!this.groups) {
                this.groups =
                    ("groups" in currentContext ?
                    currentContext.groups : {});
            }
            if (!opt.useCache || "accountName" in opt ||
                this.groups === undefined ||
                $.isEmptyObject(this.groups)) {
                $().SPServices({
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: "GetGroupCollectionFromUser",
                    userLoginName: (("accountName" in opt && opt.accountName.length > 0) ?
                        opt.accountName :
                        this.getUserInformation(opt).name),
                    async: false,
                    debug: opt.verbose,
                    completefunc: function(xData, Status) {
                        $(xData.responseXML).find("Group").each(function() {
                            group = {};
                            group.name = $(this).attr("Name");
                            group.id = $(this).attr("ID");
                            spContext.groups[group.id] = group;
                            spContext.groups[group.name] = group;
                        });
                    }
                });
            }
            return this.groups;
        },

        /*********************************************************************
         * Get map of site collection groups. Returns an object with two
         * keys per group, one by name and one by id.
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
         *     ... // additional groups
         * }
         *********************************************************************/
        getSiteGroups: function(options) {
            if (this.siteGroups) {
                return this.siteGroups;
            }
            var opt = $.extend({}, spEasyForms.defaults, options);
            var currentContext = this.get(options);
            if (opt.useCache && currentContext.siteGroups !== undefined && !$.isEmptyObject(currentContext.siteGroups)) {
                this.siteGroups = currentContext.siteGroups;
            }
            if (!this.siteGroups) {
                this.siteGroups = {};
            }

            $().SPServices({
                webURL: spContext.getCurrentSiteUrl(opt),
                operation: "GetGroupCollectionFromSite",
                async: false,
                debug: opt.verbose,
                completefunc: function(xData, Status) {
                    $(xData.responseXML).find("Group").each(function() {
                        group = {};
                        group.name = $(this).attr("Name");
                        group.id = $(this).attr("ID");
                        spContext.siteGroups[group.id] = group;
                        spContext.siteGroups[group.name] = group;
                    });
                }
            });
            return this.siteGroups;
        },

        /*********************************************************************
         * Get the stored config for a given list.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         *     listId: <guid>, // the guid of the list you want a context for,
         *         // default undefined meaning current list
         * }
         *
         * @returns {object} - the config.
         *********************************************************************/
        getConfig: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);

            if (this.config) {
                return this.config;
            }

            opt.currentContext = this.get(opt);
            opt.listId = this.getCurrentListId(opt);
            opt.lstContext = this.getListContext(opt);
            if (window.location.href.toLowerCase().indexOf("fiddle") >= 0 &&
                opt.lstContext.config !== undefined) {
                opt.currentConfig = opt.lstContext.config;
                opt.currentConfig = this.layout2Config(opt);
                this.config = opt.currentConfig;
                return opt.currentConfig;
            }

            if (!opt.configFileName) {
                opt.configFileName = spContext.getCurrentSiteUrl(opt) +
                    "/SiteAssets/spef-layout-" + opt.listId.replace(
                        "{", "").replace("}", "") + ".txt";
            }

            $.ajax({
                type: "GET",
                url: opt.configFileName,
                headers: {
                    "Content-Type": "text/plain"
                },
                async: false,
                cache: false,
                success: function(data) {
                    var resultText = data;
                    var txt = resultText.replace(/fieldGroup/g, "fieldCollection").
                        replace(/childColumnInternal/g, "columnNameInternal");
                    opt.currentConfig = utils.parseJSON(txt);
                    opt.currentConfig = spContext.layout2Config(opt);
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (xhr.status === 409) {
                        alert("The web service returned 409 - CONFLICT. This " +
                            "most likely means you do not have a 'Site Assets' " +
                            "library in the current site with a URL of " +
                            "SiteAssets. This is required before you can " +
                            "load and save SPEasyForms configuration files.");
                    } else if (xhr.status !== 404 &&
                        opt.configFileName.indexOf("{") < 0) {
                        alert("Error getting configuration.\nStatus: " +
                            xhr.status + "\nStatus Text: " + thrownError);
                    }
                }
            });

            this.config = opt.currentConfig;
            return opt.currentConfig;
        },

        /*********************************************************************
         * Stores a config for the current list.
         *
         * @param {string} options - {
         *     // see the definition for $.spEasyForms.defaults for
         *     // additional globally applicable options
         * }
         *********************************************************************/
        setConfig: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.useCache && opt.listId in opt.currentContext.listContexts) {
                opt.currentListContext = opt.currentContext[opt.listId];
            }
            if (opt.currentListContext === undefined) {
                opt.currentListContext = this.getListContext(opt);
            }
            opt.currentListContext.config = opt.currentConfig;
            if (opt.useCache) {
                spEasyForms.writeCachedContext(opt);
            }
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
        getCurrentListId: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.listId === undefined) {
                opt.listId = utils.getRequestParameters().ListId;
                if (!opt.listId) {
                    opt.listId = _spPageContextInfo.pageListId;
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
        getCurrentSiteUrl: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if (opt.siteUrl === undefined) {
                opt.siteUrl = utils.getRequestParameters().SiteUrl;
                if (opt.siteUrl === undefined) {
                    opt.siteUrl = _spPageContextInfo.webServerRelativeUrl;
                } else {
                    var a = document.createElement("a");
                    a.href = opt.siteUrl;
                    opt.siteUrl = a.pathname;
                    if (opt.siteUrl[0] !== '/') {
                        opt.siteUrl = '/' + opt.siteUrl;
                    }
                }
            }
            return opt.siteUrl;
        },

        /*********************************************************************
         * Temporary to make old configurations work without modification.
         *********************************************************************/
        layout2Config: function(options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            if ($.isArray(opt.currentConfig)) {
                opt.currentConfig = {
                    layout: {
                        def: opt.currentConfig
                    },
                    visibility: {
                        def: {}
                    }
                };
            }
            return opt.currentConfig;
        }
    };
    var spContext = $.spEasyForms.sharePointContext;

    ////////////////////////////////////////////////////////////////////////////
    // Helper functions.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.utilities = {
        jsCase: function(str) {
            return str[0].toLowerCase() + str.substring(1);
        },
        
        titleCase: function(str) {
            return str[0].toUpperCase() + str.substring(1);
        },
        
        /*********************************************************************
         * Wrapper for jQuery.parseJSON; I really don't want to check for null
         * or undefined everywhere to avoid exceptions. I'd rather just get
         * null or undefined out for null or undefined in with no exception,
         * and jQuery used to work this way but doesn't any more
         * thus the wrapper.
         * @param {string} json - a string representation of a json object
         * @returns {object} - the deserialized object
         *********************************************************************/
        parseJSON: function(json) {
            if (typeof(json) == 'undefined' ||
                json === null ||
                json.length === 0) {
                return undefined;
            }
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
        getRequestParameters: function() {
            var result = {};
            if (window.location.search.length > 0 &&
                window.location.search.indexOf('?') >= 0) {
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

    /*
    visibilityRuleCollection.comparisonOperators.greaterThen = function (value, test) {
        return (value > test);
    }

    visibilityRuleCollection.comparisonOperators.lessThen = function (value, test) {
        return (value < test);
    }

    visibilityRuleCollection.stateHandlers.yellow = function (options) {
        var opt = $.extend({}, spEasyForms.defaults, options);
        var row = opt.row.row;
        if ($("table.ms-formtable").attr("data-visibilityyellow") !== "true") {
            $("head").append("<style>.speasyforms-yellow { background-color: yellow; }</style>");
            $("table.ms-formtable").attr("data-visibilityyellow", "true");
        }
        row.find("td").addClass("speasyforms-yellow").attr("data-visibilityclassadded", "speasyforms-yellow");
    }
    */
})(spefjQuery);