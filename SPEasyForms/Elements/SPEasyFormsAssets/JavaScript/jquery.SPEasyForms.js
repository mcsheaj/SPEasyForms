/*
 * SPEasyForms - modify SharePoint forms using jQuery (i.e. put fields on
 * tabs, show/hide fields, validate field values, modify the controls used
 * to enter field values etc.)
 *
 * @version 2015.01
 * @requires jQuery.SPEasyForms.2015.01 
 * @requires jQuery-ui v1.9.2 
 * @requires jQuery.SPServices v2015.01 or greater
 * @optional ssw Session Storage Wrapper - Cross Document Transport of
 *    JavaScript Data; used to cache the context across pages if available
 *    and options.useCache === true
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery:true, ssw, PreSaveItem:true, _spPageContextInfo, ssw_init, ExecuteOrDelayUntilScriptLoaded, SP, SPClientTemplates */

// save a reference to our instance of jQuery just in case
spefjQuery = jQuery.noConflict(true);

/* jshint -W098 */
function shouldSPEasyFormsRibbonButtonBeEnabled() {
    if (spefjQuery.spEasyForms.isConfigurableList()) {
        return true;
    } else {
        return false;
    }
}
/* jshint +W098 */

(function ($, undefined) {

    if (typeof (SPClientTemplates) !== 'undefined' && SPClientTemplates.TemplateManager && SPClientTemplates.TemplateManager.RegisterTemplateOverrides) {
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides({
            OnPreRender: function (ctx) {
                if ($("body").attr("data-speasyforms-formhidden") !== "true") {
                    $("body").attr("data-speasyforms-formhidden", "true").append("<style type='text/css'>.ms-formtable { display: none; }</style>");
                }
            }
        });
    }

    if (!Object.keys) {
        Object.keys = function (obj) {
            return $.map(obj, function (v, k) {
                return k;
            });
        };
    }

    if (!Object.create) {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }

    // cross-page caching object
    var cache = (typeof (ssw) !== 'undefined' ? ssw.get() : undefined);

    ////////////////////////////////////////////////////////////////////////////
    // Main entry point is init.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms = {
        defaults: {
            // use cross-page caching
            useCache: (typeof (ssw) !== 'undefined' || typeof (ssw_init) !== 'undefined'),
            // the maximum number of webs to cache
            maxWebCache: 6,
            // the maximum number of lists to cache per web
            maxListCache: 10,
            // the maximum number of containers that can be nested
            maxNestingLevels: 5,
            // path to the jquery-ui style sheet
            jQueryUITheme: "~sitecollection/Style Library/SPEasyFormsAssets/~version/Css/jquery-ui-redmond/jquery-ui.css",
            // path to the spEasyForms style sheet
            css: "~sitecollection/Style Library/SPEasyFormsAssets/~version/Css/speasyforms.css",
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
            initAsync: window.location.href.indexOf('spEasyFormsAsync=false') < 0,
            version: "2015.01",
            jQueryUIGallery: ["lilac", "olive", "redmond", "salmon", "smoothness", "sunny"]
        },

        /********************************************************************
         * Are we in a list context for a list type that SPEasyForms 
         * supports (currently we do not support Surveys or Discussion Boards,
         * but the list may grow as testing continues).
         ********************************************************************/
        isConfigurableList: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we wern't passed a list context, try to get one
            if (!opt.currentListContext) {
                opt.currentListContext = $.spEasyForms.sharePointContext.getListContext(this.defaults);
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
        init: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            this.initCacheLibrary(opt);
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
                $.spEasyForms.sharePointContext.initAsync(opt);
            } else {
                this.contextReady(options);
            }
            ExecuteOrDelayUntilScriptLoaded(function () {
                var dlg = SP.UI.ModalDialog.get_childDialog();
                if (dlg !== null) {
                    setTimeout(function () {
                        if ($(".ms-formtable").css("display") === "none" || $("#spEasyFormsContainersPre").length > 0) {
                            $.spEasyForms.utilities.resizeModalDialog();
                        }
                    }, 3000);
                }
            }, "sp.ui.dialog.js");
            // get a 'hashmap' of request parameters
            var parameters = $.spEasyForms.utilities.getRequestParameters();
            // get the parsed rows of the form table
            var rows = $.spEasyForms.sharePointFieldRows.init(options);
            // foreach request parameter
            $.each(Object.keys(parameters), function (idx, key) {
                // if the parameter name begins with the spef_ prefix
                if (key.indexOf("spef_") === 0) {
                    // the internal field name should be the parameter name with the prefix removed
                    var internalName = key.substring(5);
                    // if the parsed form rows contains a row matching the internal field name
                    if (internalName in rows) {
                        // initialize the row and value to set in the options map
                        opt.row = rows[internalName];
                        opt.value = parameters[key];
                        // set the value of the field
                        $.spEasyForms.sharePointFieldRows.setValue(opt);
                    }
                }
            });
            if ($.spEasyForms.defaults.verbose) {
                $("#spEasyFormsDiagButton").show().click(function () {
                    var win = window.open();
                    win.document.write("<pre>\n" + JSON.stringify($.spEasyForms.sharePointContext.getListContext(options), null, 4) + "\n</pre>");
                    win.document.close();
                });
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
        contextReady: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            try {
                opt.currentContext = $.spEasyForms.sharePointContext.get(opt);
                opt.source = $.spEasyForms.utilities.getRequestParameters(opt).Source;
                opt.currentListContext = $.spEasyForms.sharePointContext.getListContext(opt);

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
                     * If it looks like a transformable list settings page, insert an SPEasyForms list settings link.
                     ***/
                else if (spEasyForms.isConfigurableListSettings(opt)) {
                    spEasyForms.insertListSettingsLink(opt);
                }
                    /***
                     * If it looks like a site settings page, insert an SPEasyForms site settings link.
                     ***/
                else if (window.location.href.toLowerCase().indexOf("/settings.aspx") > 0) {
                    spEasyForms.insertSiteSettingsLink(opt);
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
        isConfigurableListSettings: function (options) {
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
        isSettingsPage: function (options) {
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
        isTransformable: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            // if we're not in the context of a configurable list
            if (!spEasyForms.isConfigurableList(opt)) {
                return false;
            }
            // if the page name doesn't contain new, edit, or view
            if ($.spEasyForms.visibilityRuleCollection.getFormType(opt).length === 0) {
                return false;
            }
            // if we're on a new form for a folder
            if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "new" && window.location.href.toLowerCase().indexOf("&type=1&") >= 0) {
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
        transform: function (opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            this.loadDynamicStyles(opt);
            // convert all lookups to simple selects, only for 2010 and
            // earlier, from Marc Anderson's SPServices documentation and 
            // attributed to Dan Kline
            $('.ms-lookuptypeintextbox').each(function () {
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
            $.spEasyForms.containerCollection.transform(opt);
            // Override the core.js PreSaveItem function, to allow containers 
            // and/or adapters to react to validation errors.
            if (typeof (PreSaveItem) !== 'undefined') {
                var originalPreSaveItem = PreSaveItem;
                PreSaveItem = function () {
                    var result = originalPreSaveItem();
                    if (result) {
                        result = spefjQuery.spEasyForms.containerCollection.preSaveItem();
                    }
                    return result;
                };
            }
            // override the save button in 2013/O365 so validation 
            // occurs before PreSaveAction, like it did in previous
            // version of SharePoint
            $("input[value='Save']").each(function () {
                if (null !== this.getAttributeNode("onclick")) {
                    var onSave = this.getAttributeNode("onclick").nodeValue;
                    onSave = onSave.replace(
                        "if (SPClientForms.ClientFormManager.SubmitClientForm('WPQ2')) return false;", "");
                    var newOnSave = document.createAttribute('onclick');
                    newOnSave.value = onSave;
                    this.setAttributeNode(newOnSave);
                }
            });
            $.spEasyForms.appendContext(opt);
            if (_spPageContextInfo.webUIVersion === 4) {
                $(".ui-widget input").css("font-size", "8pt");
            }
        },

        /********************************************************************
         * See if we have a configuration for the current list context and setup
         * the editor for the current configuration (or the default configuration).
         ********************************************************************/
        toEditor: function (opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            this.loadDynamicStyles(opt);
            $("#msCuiTopbar").prepend("<h2 class='speasyforms-breadcrumbs'><a href='" + opt.source + "'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h2>");

            $.each(opt.currentListContext.contentTypes.order, function (i, ctid) {
                if (ctid.indexOf("0x0120") !== 0) {
                    $("#spEasyFormsContentTypeSelect").append("<option value='" +
                        opt.currentListContext.contentTypes[ctid].id + "'>" +
                        opt.currentListContext.contentTypes[ctid].name + "</option>");
                }
            });

            $("#spEasyFormsContentTypeSelect").change(function () {
                delete $.spEasyForms.containerCollection.rows;
                delete $.spEasyForms.sharePointContext.formCache;
                opt.contentTypeChanged = true;
                opt.refresh = $.spEasyForms.refresh.all;
                $.spEasyForms.containerCollection.toEditor(opt);
            });

            $.spEasyForms.containerCollection.toEditor(opt);

            $(window).on("beforeunload", function () {
                if (!$("#spEasyFormsSaveButton").hasClass("speasyforms-disabled")) {
                    return "You have unsaved changes, are you sure you want to leave the page?";
                }
            });

            //$.spEasyForms.appendContext(opt);

            var bannerHeight = $("#suiteBarTop").height() + $("#suitBar").height() + $("#s4-ribbonrow").height() + $("#spEasyFormsRibbon").height() + 37;
            $("div.speasyforms-panel").height($(window).height() - bannerHeight);
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 420);
            $(window).resize(function () {
                $("div.speasyforms-panel").height($(window).height() - bannerHeight);
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 420);
            });
            $('#spEasyFormsRibbon').show();
        },

        /********************************************************************
         * Add a link to the SPEasyForms settings page to an OOB list settings
         * page (listedit.aspx).
         ********************************************************************/
        insertListSettingsLink: function (opt) {
            var generalSettings = $("td.ms-descriptiontext:contains('description and navigation')").closest("table");
            var permissionsLink = $("a:contains('Permissions for this list')");
            if (permissionsLink.length > 0) {
                if (generalSettings.length > 0) {
                    var source = window.location.href;
                    if (source.indexOf("start.aspx#") >= 0) {
                        source = $.spEasyForms.utilities.webRelativePathAsAbsolutePath(source.substring(source.indexOf('#') + 1));
                    }
                    var settings = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01/Pages/SPEasyFormsSettings.aspx") +
                        "?ListId=" + $.spEasyForms.sharePointContext.getCurrentListId(opt) +
                        "&SiteUrl=" + $.spEasyForms.sharePointContext.getCurrentSiteUrl(opt) +
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
            }
        },

        /********************************************************************
         * Add a link to the SPEasyForms site settings page to an OOB site settings
         * page (settings.aspx).
         ********************************************************************/
        insertSiteSettingsLink: function (opt) {
            var usersAndPermissions = $("h3:contains('Users and Permissions')");
            var scaLink = usersAndPermissions.next().find("a:contains('Site collection administrators')");
            if (scaLink.length > 0) {
                var siteCollectionAdministrationList = $("h3:contains('Site Collection Administration')").next();
                if (siteCollectionAdministrationList.length > 0) {
                    var source = window.location.href;
                    if (source.indexOf("start.aspx#") >= 0) {
                        source = $.spEasyForms.utilities.webRelativePathAsAbsolutePath(source.substring(source.indexOf('#') + 1));
                    }
                    var settings = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01/Pages/SPEasyFormsSiteSettings.aspx") +
                        "?Source=" + encodeURIComponent(source);
                    var newItem = "<li class='ms-linksection-listItem'>" + 
	                    "<a title='Restore or permanently remove items that users have deleted on this site.' href='" + settings + "'>SPEasyForms</a>" +
		                "</li>";
                    siteCollectionAdministrationList.append(newItem);
                }
            }
        },

        /********************************************************************
         * Initialize the ssw caching library.
         *
         * @param {object} options - {
         *     // see the definition of defaults for options
         * }
         ********************************************************************/
        initCacheLibrary: function (options) {
            if (typeof (cache) === 'undefined' && options.cache !== undefined) {
                cache = options.cache;
            }

            if (typeof (ssw) === 'undefined' && typeof (ssw_init) !== 'undefined') {
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
        loadDynamicStyles: function (options) {
            var opt = $.extend({}, spEasyForms.defaults, options);
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            opt.source = "~sitecollection/Style Library/SPEasyFormsAssets/2015.01/Css/jquery-ui-smoothness/jquery-ui.css";
            var theme = this.replaceVariables(opt);

            if (opt.currentConfig.jQueryUITheme) {
                opt.source = opt.currentConfig.jQueryUITheme;
                theme = this.replaceVariables(opt);
                $("head").append(
                    '<link rel="stylesheet" type="text/css" href="' + theme + '">');
            }
            else {
                if (opt.jQueryUITheme) {
                    opt.source = opt.jQueryUITheme;
                    theme = this.replaceVariables(opt);
                }
                $("head").append(
                    '<link rel="stylesheet" type="text/css" href="' + theme + '">');
            }

            opt.source = opt.css;
            theme = this.replaceVariables(opt);
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + theme + '">');
        },

        replaceVariables: function (options) {
            options.source = options.source.replace(/~sitecollection/g, options.currentContext.siteRelativeUrl);
            options.source = options.source.replace(/~site/g, options.currentContext.webRelativeUrl);
            options.source = options.source.replace(/~version/g, options.version);
            return options.source;
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
            if (typeof (ssw) !== 'undefined') {
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
            /*
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
                    "    pageListId: '" + $.spEasyForms.sharePointContext.getCurrentListId(opt) + "',\r\n" +
                    "    userId: " + opt.currentContext.userId + "\r\n" +
                    "};\r\n";
                output += "var cache = " + JSON.stringify(cache, null, 4) + ";\r\n";
                output += "cache['spEasyForms_spContext_" +
                    opt.currentContext.webRelativeUrl + "'].groups = " +
                    JSON.stringify($.spEasyForms.sharePointContext.getUserGroups(opt), null, 4) + ";\r\n";
                output += "cache['spEasyForms_spContext_" +
                    opt.currentContext.webRelativeUrl + "'].siteGroups = " +
                    JSON.stringify($.spEasyForms.sharePointContext.getSiteGroups(opt), null, 4) + ";\r\n";
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
            */
        }
    };
    var spEasyForms = $.spEasyForms;

})(spefjQuery);