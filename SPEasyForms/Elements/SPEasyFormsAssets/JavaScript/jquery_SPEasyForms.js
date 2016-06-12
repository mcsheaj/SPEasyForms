///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/jquery.SPEasyForms.js
/*
 * SPEasyForms - modify SharePoint forms using jQuery (i.e. put fields on
 * tabs, show/hide fields, validate field values, modify the controls used
 * to enter field values etc.)
 *
 * @version 2015.01.03
 * @requires jQuery-ui v1.9.2 
 * @requires jQuery.SPServices v2015.02 or greater
 * @optional ssw Session Storage Wrapper - Cross Document Transport of
 *    JavaScript Data; used to cache the context across pages if available
 *    and options.useCache === true
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery:true, ssw, PreSaveItem:true, _spPageContextInfo, ssw_init, ExecuteOrDelayUntilScriptLoaded, SP, SPClientTemplates, RegisterModuleInit */

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

    function getScriptPath() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            if (/jquery.speasyforms.*\.js/.test(scripts[i].src)) {
                return scripts[i];
            }
            return _spPageContextInfo.siteServerRelativeUrl + "/Style Library/SPEasyFormsAssets/2015.01.03/JavaSccript/jquery.SPEasyForms.js";
        }
    }

    if (typeof (SPClientTemplates) !== 'undefined' && SPClientTemplates.TemplateManager && SPClientTemplates.TemplateManager.RegisterTemplateOverrides) {
        if (window.location.href.indexOf("start.aspx#") >= 0) {
            var scriptUrl = getScriptPath();
            RegisterModuleInit(scriptUrl, function () {
                SPClientTemplates.TemplateManager.RegisterTemplateOverrides({
                    OnPreRender: function (ctx) {
                        if ($("body").attr("data-speasyforms-formhidden") !== "true") {
                            $("body").attr("data-speasyforms-formhidden", "true").append("<style type='text/css'>.ms-formtable { display: none; }</style>");
                        }
                    }
                });
            });
        }
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
            version: "2015.01.03",
            jQueryUIGallery: ["lilac", "olive", "redmond", "salmon", "smoothness", "sunny"],
            loadDynamicStylesAlways: false
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

            // exit if we don't see any form field rows
            var fieldRows = $("td.ms-formlabel h3.ms-standardheader, td.ms-formlabel span.ms-standardheader");
            if (fieldRows.length === 0) {
                $("table.ms-formtable ").show();
                return;
            }

            // exit if the form table contains an old RTE field (ERTE is fine)
            var formTable = fieldRows.first().closest("table");
            if (formTable.find("iframe[id$='TextField_iframe']").length > 0) {
                $("table.ms-formtable ").show();
                return;
            }

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
                if (opt.loadDynamicStylesAlways) {
                    spEasyForms.loadDynamicStyles(opt);
                }

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
                    if (_spPageContextInfo.webUIVersion === 4) {
                        var url = function (input) { return input.substr(0, input.indexOf("?")); };
                        if (url(document.referrer) !== url(window.location.href)) {
                            $("span.ms-error, span.ms-formvalidation").hide();
                        }
                        else {
                            $("span.ms-error, span.ms-formvalidation").show();
                        }
                        var span = $("span.ms-formvalidation[role='alert']");
                        $.each(span, function (i, current) {
                            if ($(current).prev().hasClass("ms-formvalidation")) {
                                $(current).hide();
                            }
                        });
                    }
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
                if (/\/SPEasyFormsSettings[a-zA-Z]*.aspx/.test(window.location.href)) {
                    $("#spEasyFormsInitializationError").show();
                }
                return false;
            }
            return /\/SPEasyFormsSettings[a-zA-Z]*.aspx/.test(window.location.href);
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
                $("td.ms-formlabel h3.ms-standardheader, td.ms-formlabel span.ms-standardheader").first().closest("table").addClass("ms-formtable");
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

            if (_spPageContextInfo.webUIVersion === 4) {
                $(".ui-widget input").css("font-size", "8pt");
            }
            else {
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
            }
        },

        /********************************************************************
         * See if we have a configuration for the current list context and setup
         * the editor for the current configuration (or the default configuration).
         ********************************************************************/
        toEditor: function (opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
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

            var bannerHeight = $("#suiteBarTop").height() + $("#suitBar").height() + $("#s4-ribbonrow").height() + $("#spEasyFormsRibbon").height() + 37;
            $("div.speasyforms-panel").height($(window).height() - bannerHeight);
            $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 460);
            $(window).resize(function () {
                $("div.speasyforms-panel").height($(window).height() - bannerHeight);
                $("#spEasyFormsContent").height($(window).height() - bannerHeight).width($(window).width() - 460);
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
                    var settings = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01.03/Pages/SPEasyFormsSettings.aspx") +
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
                    var settings = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01.03/Pages/SPEasyFormsSiteSettings.aspx") +
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
            opt.source = "~sitecollection/Style Library/SPEasyFormsAssets/2015.01.03/Css/jquery-ui-smoothness/jquery-ui.css";
            var theme = this.replaceVariables(opt);

            // determine if the theme is set at the list or site level
            if (opt.currentConfig && opt.currentConfig.jQueryUITheme) {
                opt.source = opt.currentConfig.jQueryUITheme;
                theme = this.replaceVariables(opt);
            }
            else {
                if (opt.jQueryUITheme) {
                    opt.source = opt.jQueryUITheme;
                    theme = this.replaceVariables(opt);
                }
            }

            // load the jQuery UI theme
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + theme + '">');

            // load the spEasyForms CSS
            opt.source = opt.css;
            theme = this.replaceVariables(opt);
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + theme + '">');

            if ($.spEasyForms.userDefaults.additionalFiles) {
                $.each($($.spEasyForms.userDefaults.additionalFiles), function (idx, file) {
                    if (/\.css$/.test(file)) {
                        opt.source = file;
                        var path = $.spEasyForms.replaceVariables(opt);
                        $("head").append(
                            '<link rel="stylesheet" type="text/css" href="' + path + '">');
                    }
                });
            }
        },

        replaceVariables: function (options) {
            if (options.currentContext.siteRelativeUrl.length === 1) {
                options.source = options.source.replace(/~sitecollection/g, "");
            }
            else
            {
                options.source = options.source.replace(/~sitecollection/g, options.currentContext.siteRelativeUrl);
            }
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
    };
    var spEasyForms = $.spEasyForms;

})(spefjQuery);
///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/utilities.js
/*
 * SPEasyForms.utilites - general helper functions for SPEasyForms
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, _spPageContextInfo, SP */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Helper functions.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.utilities = {
        jsCase: function (str) {
            return str[0].toLowerCase() + str.substring(1);
        },

        titleCase: function (str) {
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
        parseJSON: function (json) {
            if (typeof (json) === 'undefined' ||
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
        getRequestParameters: function () {
            var result = {};
            var query, index;
            if (window.location.search.length > 0 &&
                window.location.search.indexOf('?') >= 0) {
                index = window.location.search.indexOf('?') + 1;
                query = window.location.search.substr(index);
            }
            else if (window.location.href.indexOf("start.aspx#") >= 0 &&
                window.location.href.indexOf('?') >= 0) {
                index = window.location.href.indexOf('?') + 1;
                query = window.location.href.substr(index);
            }
            if (query) {
                var nvPairs = query.split('&');
                for (var i = 0; i < nvPairs.length; i++) {
                    var nvPair = nvPairs[i].split('=', 2);
                    if (nvPair.length === 2) {
                        result[nvPair[0]] = decodeURIComponent(nvPair[1]);
                    }
                }

            }
            return result;
        },

        siteRelativePathAsAbsolutePath: function (path) {
            var site = _spPageContextInfo.siteServerRelativeUrl;
            if (path[0] !== '/') {
                path = '/' + path;
            }
            if (site !== '/') {
                path = site + path;
            }
            return path;
        },

        webRelativePathAsAbsolutePath: function (path) {
            var site = $.spEasyForms.sharePointContext.getCurrentSiteUrl();
            if (path[0] !== '/') {
                path = '/' + path;
            }
            if (site !== '/') {
                path = site + path;
            }
            return path;
        },

        extend: function (destination, source) {
            for (var property in source) {
                if (!(property in destination)) {
                    destination[property] = source[property];
                }
            }
            return destination;
        },

        isDate: function (value) {
            var date = new Date(value);
            return (date instanceof Date && !isNaN(date.valueOf()));
        },

        highlight: function (rowNode, backgroundColor) {
            // if our class hasn't already been added to the head
            if ($("table.ms-formtable").attr("data-visibility" + backgroundColor) !== "true") {
                // add a class to the head that defines our highlight color
                $("head").append("<style>.speasyforms-" + backgroundColor +
                    " { background-color: " + backgroundColor + "; }</style>");

                // add an attribute to the form table to indicate we've already added our class
                $("table.ms-formtable").attr("data-visibility" + backgroundColor, "true");
            }

            // add our class to all table cells in the row, also indicate which class was added with
            // data-visiblityclassadded so the visibility manager can undo our changes when state
            // is changing
            rowNode.find("td").addClass("speasyforms-" + backgroundColor).attr(
                "data-visibilityclassadded", "speasyforms-" + backgroundColor);
        },

        resizeModalDialog: function () {
            if (typeof (SP.UI.ModalDialog.get_childDialog) === "function") {
                var dlg = SP.UI.ModalDialog.get_childDialog();
                if (dlg !== null) {
                    SP.UI.ModalDialog.get_childDialog().autoSize();
                    var dlgContent = $(".ms-dlgContent", window.parent.document);
                    var top = ($(window.top).height() - dlgContent.outerHeight()) / 2;
                    var left = ($(window.top).width() - dlgContent.outerWidth()) / 2;
                    dlgContent.css({ top: (top > 0 ? top : 0), left: (left > 0 ? left : 0) });
                    dlgContent.prev().css({ top: (top > 0 ? top : 0), left: (left > 0 ? left : 0) });

                    var dlgFrame = $(".ms-dlgFrame", window.parent.document);
                    if (dlgFrame.height() > $(window.parent).height()) {
                        dlgFrame.height($(window.parent).height());
                    }
                    if (dlgFrame.width() > $(window.parent).width()) {
                        dlgFrame.width($(window.parent).width());
                    }
                }
            }
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // Constructor for a helper class for dialogs to define a relationship list 
    // (i.e. as used by the cascadingLookupAdapter and lookupDetailAdapter.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.relationshipListAdapterHelper = function (options) {
        var opt = $.extend({}, $.spEasyForms.defaults, options);
        var instance = this;

        this.initDialog = function () {
            // initialize the jQuery UI dialog
            var lookupDetailOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        if (opt.relationship.relationshipParentColumn) {
                            $.spEasyForms.adapterCollection.validateRequired({
                                id: opt.relationship.relationshipParentColumn.id,
                                displayName: opt.relationship.relationshipParentColumn.displayName
                            });
                        }
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.relationshipChildColumn.id,
                            displayName: opt.relationship.relationshipChildColumn.displayName
                        });
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.formParentColumn.id,
                            displayName: opt.relationship.formParentColumn.displayName
                        });
                        $.spEasyForms.adapterCollection.validateRequired({
                            id: opt.relationship.formChildColumn.id,
                            displayName: opt.relationship.formChildColumn.displayName
                        });
                        if ($("#" + opt.relationship.dialogDiv).find(".speasyforms-error").length === 0) {
                            if (!opt.currentConfig.adapters) {
                                opt.currentConfig.adapters = {};
                            }
                            if (!opt.currentConfig.adapters.def) {
                                opt.currentConfig.adapters.def = {};
                            }
                            opt.adapters = opt.currentConfig.adapters.def;
                            if ($("#" + opt.relationship.relationshipListColumn.id).val().length === 0) {
                                if (opt.adapterField in opt.adapters) {
                                    delete opt.adapters[opt.adapterField];
                                }
                                $.spEasyForms.configManager.set(opt);
                                $("#" + opt.relationship.dialogDiv).dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            } else {
                                var adapter = {};
                                if (opt.fieldName && opt.fieldName in opt.adapters) {
                                    adapter = opt.adapters[opt.fieldName];
                                } else {
                                    opt.adapters[opt.fieldName] = adapter;
                                }
                                adapter.type = opt.relationship.type;
                                adapter.relationshipList =
                                    $("#" + opt.relationship.relationshipListColumn.id).val();
                                adapter.relationshipListTitle =
                                    $("#" + opt.relationship.relationshipListColumn.id + " option:selected").text();
                                if (opt.relationship.relationshipParentColumn) {
                                    adapter.relationshipListParentColumn =
                                        $("#" + opt.relationship.relationshipParentColumn.id).val();
                                }
                                adapter.relationshipListChildColumn =
                                    $("#" + opt.relationship.relationshipChildColumn.id).val();
                                adapter.parentColumnInternal =
                                    $("#" + opt.relationship.formParentColumn.id).val();
                                adapter.columnNameInternal =
                                    $("#" + opt.relationship.formChildColumn.id).val();
                                if (opt.relationship.updateCallback) {
                                    opt.relationship.updateCallback(adapter);
                                }
                                $.spEasyForms.configManager.set(opt);
                                $("#" + opt.relationship.dialogDiv).dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                            return false;
                        }
                    },
                    "Cancel": function () {
                        $("#" + opt.relationship.dialogDiv).dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 650
            };
            $("#" + opt.relationship.dialogDiv).dialog(lookupDetailOpts);
        };

        this.initControls = function () {
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
                $("#" + opt.relationship.relationshipListColumn.id).append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });
            $("#" + opt.relationship.formListColumn.id).val(opt.currentListContext.title);
            if ($("#" + opt.relationship.relationshipListColumn.id).attr("data-change") !== "true") {
                $("#" + opt.relationship.relationshipListColumn.id).attr("data-change", "true");
                $("#" + opt.relationship.relationshipListColumn.id).change(function () {
                    instance.initRelationshipFields(opt);
                });
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).change(function () {
                        if ($("#" + opt.relationship.relationshipChildColumn.id).find("option[value='" +
                            $("#" + opt.relationship.relationshipParentColumn.id).val() + "']").length > 0) {
                            $("#" + opt.relationship.relationshipChildColumn.id).find("option[text='" +
                                $("#" + opt.relationship.relationshipParentColumn.id).text() + "']");
                        }
                    });
                }
            }
            $("#" + opt.relationship.formChildColumn.id).val(opt.fieldName);
            opt.adapters = opt.currentConfig.adapters.def;
            if (opt.fieldName in opt.adapters) {
                var a = opt.adapters[opt.fieldName];
                $("#" + opt.relationship.relationshipListColumn.id).val(
                    a.relationshipList);
                instance.initRelationshipFields(opt);
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).val(
                        a.relationshipListParentColumn);
                }
                $("#" + opt.relationship.relationshipChildColumn.id).val(
                    a.relationshipListChildColumn);
                $("#" + opt.relationship.formParentColumn.id).val(
                    a.parentColumnInternal);
            }
        };

        this.initRelationshipFields = function () {
            if (opt.relationship.relationshipParentColumn) {
                $("#" + opt.relationship.relationshipParentColumn.id).find("option").remove();
                $("#" + opt.relationship.relationshipParentColumn.id).append("<option></option>");
                $("#" + opt.relationship.relationshipParentColumn.id).val("");
                $("#" + opt.relationship.relationshipParentColumn.id).attr("disabled", "disabled");
            }

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");
            $("#" + opt.relationship.relationshipChildColumn.id).attr("disabled", "disabled");

            if ($("#" + opt.relationship.relationshipListColumn.id).val().length > 0) {
                opt.listId = $("#" + opt.relationship.relationshipListColumn.id).val().toLowerCase();
                var listctx = $.spEasyForms.sharePointContext.getListContext(opt);
                $.each(Object.keys(listctx.fields), function (idx, field) {
                    if (opt.relationship.relationshipParentColumn) {
                        if (listctx.fields[field].spFieldType === "SPFieldLookup") {
                            $("#" + opt.relationship.relationshipParentColumn.id).append(
                                "<option value='" +
                                listctx.fields[field].internalName + "'>" +
                                listctx.fields[field].displayName + "</option>");
                        }
                    }
                    $("#" + opt.relationship.relationshipChildColumn.id).append(
                        "<option value='" +
                        listctx.fields[field].internalName + "'>" +
                        listctx.fields[field].displayName + "</option>");
                });
                if (opt.relationship.relationshipParentColumn) {
                    $("#" + opt.relationship.relationshipParentColumn.id).removeAttr("disabled");
                    var choices = $("#" + opt.relationship.relationshipParentColumn.id).find("option");
                    if (choices.length === 2) {
                        $("#" + opt.relationship.relationshipParentColumn.id).val(
                            $(choices[1]).attr("value"));
                        var relationshipParentText =
                            $("#" + opt.relationship.relationshipParentColumn.id + " option:selected").text();
                        var thisParentOption =
                            $("#" + opt.relationship.relationshipChildColumn.id).find(
                                "option:contains('" + relationshipParentText + "')");
                        $("#" + opt.relationship.relationshipChildColumn.id).val(thisParentOption.val());
                    }
                }
                $("#" + opt.relationship.relationshipChildColumn.id).removeAttr("disabled");
                var thisChildText =
                    $("#" + opt.relationship.formChildColumn.id + " option:selected").text();
                var relationshipChildOption =
                    $("#" + opt.relationship.relationshipChildColumn.id).find(
                        "option:contains('" + thisChildText + "')");
                $("#" + opt.relationship.relationshipChildColumn.id).val(
                    relationshipChildOption.val());
            }
        };

        this.constructDialog = function () {
            if ($("#" + opt.relationship.dialogDiv).length === 0) {
                var html = "<div id='" + opt.relationship.dialogDiv + "' title='Lookup Detail' class='speasyforms-dialogdiv'>" +
                    "<table id='" + opt.relationship.dialogDiv + "Table' width='100%' cellpadding='0' cellspacing='0'>" +
                    "<tr>" +
                    "<td>" + opt.relationship.relationshipListColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipListColumn.id + "'><option></option></select></td><td></td>" +
                    "</tr><tr>" +
                    (opt.relationship.relationshipParentColumn ? "<td></td><td>" + opt.relationship.relationshipParentColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipParentColumn.id + "'><option></option></select></td>" : "") +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.relationshipChildColumn.displayName + "</td><td><select id='" + opt.relationship.relationshipChildColumn.id + "'><option></option></select></td>" +
                    "</tr><tr><td>&nbsp;</td></tr><tr>" +
                    "<td>" + opt.relationship.formListColumn.displayName + "</td><td><input type='text' disabled='disabled' id='" + opt.relationship.formListColumn.id + "' value=''/></td><td></td>" +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.formParentColumn.displayName + "</td><td><select id='" + opt.relationship.formParentColumn.id + "'><option></option></select></td>" +
                    "</tr><tr>" +
                    "<td></td><td>" + opt.relationship.formChildColumn.displayName + "</td><td><input type='text' id='" + opt.relationship.formChildColumn.id + "' disabled='disabled'/></td>" +
                    "</tr>" +
                    "</table>" +
                    "</div>";
                $("#spEasyFormsContainerDialogs").append(html);
            }
        };

        this.clearDialog = function () {
            $("#" + opt.relationship.dialogDiv).find(".speasyforms-error").remove();
            $("#" + opt.relationship.dialogDiv).find(".implementation-specific").remove();

            $("#" + opt.relationship.relationshipListColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipListColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipListColumn.id).val("");

            if (opt.relationship.relationshipParentColumn) {
                $("#" + opt.relationship.relationshipParentColumn.id).find("option").remove();
                $("#" + opt.relationship.relationshipParentColumn.id).append("<option></option>");
                $("#" + opt.relationship.relationshipParentColumn.id).val("");
                $("#" + opt.relationship.relationshipParentColumn.id).attr("disabled", "disabled");
            }

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");
            $("#" + opt.relationship.relationshipChildColumn.id).attr("disabled", "disabled");

            $("#" + opt.relationship.relationshipChildColumn.id).find("option").remove();
            $("#" + opt.relationship.relationshipChildColumn.id).append("<option></option>");
            $("#" + opt.relationship.relationshipChildColumn.id).val("");

            var fields = $.spEasyForms.containerCollection.rows;
            $.each(Object.keys($.spEasyForms.containerCollection.rows).sort($.spEasyForms.sharePointFieldRows.compareField), function (idx, field) {
                if (fields[field].spFieldType === "SPFieldLookup") {
                    $("#" + opt.relationship.formParentColumn.id).append("<option value='" +
                        fields[field].internalName + "'>" +
                        fields[field].displayName + "</option>");
                }
            });
        };
    };

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/sharePointContext.js
/*
 * SPEasyForms.sharePointContext - object for capturing SharePoint context information
 * using web services.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, _spPageContextInfo */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Unitlity object to capture the current SharePoint context.
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
            var result = this.ctx;
            if (result === undefined) {
                if (opt.useCache) {
                    opt.siteUrl = this.getCurrentSiteUrl(opt);
                    result =  $.spEasyForms.readCachedContext(opt);
                }
                if (typeof(result) === 'undefined') {
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
                $.spEasyForms.writeCachedContext(opt);
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
                    url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/userdisp.aspx") +
                        "?Force=True&" + new Date().getTime()
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
                $.when.apply($, promises).done(function() {
                    $(promises).each(function() {
                        if (this.status === 200) {
                            // userdisp.aspx
                            if (this.responseText.indexOf("Personal Settings") > 0) {
                                currentContext.userInformation = {};
                                opt.input = $(this.responseText);
                                var rows = $.spEasyForms.sharePointFieldRows.init(opt);
                                $.each(rows, function(idx, row) {
                                    var prop = $.spEasyForms.utilities.jsCase(row.internalName); 
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
                        $.spEasyForms.writeCachedContext(opt);
                    }
                    opt.callback(options);
                }).fail(function() {
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
                var id = (typeof(opt.userId) !== 'undefined' ?
                    "ID=" + opt.userId + "&" : "");
                $.ajax({
                    async: false,
                    url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/userdisp.aspx") +
                        "?Force=True&" + id + "&" +
                        new Date().getTime(),
                    complete: function(xData) {
                        opt.input = $(xData.responseText);
                        var rows = $.spEasyForms.sharePointFieldRows.init(opt);
                        $.each(rows, function(idx, row) {
                            var prop = $.spEasyForms.utilities.jsCase(row.internalName); 
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
            var user = ("userProfile" in currentContext ?
                currentContext.userProfile : {});
            if (!opt.useCache || "accountName" in opt || $.isEmptyObject(user)) {
                var params = {
                    webURL: spContext.getCurrentSiteUrl(opt),
                    operation: 'GetUserProfileByName',
                    async: false,
                    debug: opt.verbose,
                    completefunc: function(xData) {
                        $(xData.responseXML).SPFilterNode("PropertyData").each(
                            function() {
                                var name = $(this).find("Name").text().replace(
                                    "SPS-", "");
                                name = $.spEasyForms.utilities.jsCase(name); 
                                user[name] = $(this).find("Value").text();
                            });
                    }
                };
                $().SPServices(params);
                if (opt.useCache && !("accountName" in opt)) {
                    currentContext.userProfile = user;
                    opt.currentContext = currentContext;
                    $.spEasyForms.writeCachedContext(opt);
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
        getListContext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $.spEasyForms.initCacheLibrary(opt);
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
                if (opt.listId in opt.currentContext.listContexts) {
                    result = opt.currentContext.listContexts[opt.listId];
                }
                var rows = {};
                if (opt.listId === spContext.getCurrentListId($.spEasyForms.defaults)) {
                    opt.dontIncludeNodes = true;
                    rows = $.spEasyForms.sharePointFieldRows.init(opt);
                }
                if (Object.keys(rows).length === 0) {
                    $.ajax({
                        async: false,
                        url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/_layouts/listform.aspx") +
                            "?PageType=6&ListId=" +
                            opt.listId +
                            ($("#spEasyFormsContentTypeSelect").val() ? "&ContentTypeId=" + $("#spEasyFormsContentTypeSelect").val() : "") +
                            "&RootFolder=",
                        complete: function (xData) {
                            if (opt.listId === spContext.getCurrentListId(opt)) {
                                spContext.formCache = xData.responseText;
                            }
                            opt.input = $(xData.responseText);
                            opt.skipCalculatedFields = true;
                            rows = $.spEasyForms.sharePointFieldRows.init(opt);
                            $.each(rows, function (idx, row) {
                                result.fields[row.internalName] = row;
                            });
                        }
                    });
                }
                else {
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
                    completefunc: function (xData) {
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
                        $.each($(xData.responseText).find("Field"), function (idx, field) {
                            if ($(field).attr("Hidden") !== "hidden") {
                                var newField = {};
                                newField.name = $(field).attr("Name");
                                newField.staticName = $(field).attr("StaticName");
                                newField.id = $(field).attr("ID");
                                newField.displayName = $(field).attr("DisplayName");
                                newField.type = $(field).attr("Type");
                                if (newField.type === "Calculated") {
                                    newField.hasFormula = $(field).find("formula").length > 0;
                                    if (newField.hasFormula) {
                                        newField.formula = $(field).find("formula").text();
                                    }
                                }
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
                    completefunc: function (xData) {
                        var contentTypes = {};
                        if ($(xData.responseText).find("ContentTypes").attr("ContentTypeOrder")) {
                            contentTypes.order = $(xData.responseText).find("ContentTypes").attr("ContentTypeOrder").split(",");
                        }
                        var order = [];
                        $.each($(xData.responseText).find("ContentType"), function (idx, ct) {
                            var newCt = {};
                            newCt.name = $(ct).attr("Name");
                            newCt.id = $(ct).attr("ID");
                            newCt.description = $(ct).attr("Description");
                            contentTypes[newCt.id] = newCt;
                            order.push(newCt.id);
                        });
                        if (!contentTypes.order) {
                            contentTypes.order = order;
                        }
                        result.contentTypes = contentTypes;
                    }
                });
                var listCount = Object.keys(opt.currentContext.listContexts).length;
                if (!(opt.listId in opt.currentContext.listContexts) &&
                    listCount >= opt.maxListCache) {
                    delete opt.currentContext.listContexts[Object.keys(opt.currentContext.listContexts)[0]];
                }
                result.listId = opt.listId;
                opt.currentContext.listContexts[opt.listId] = result;
                $.spEasyForms.writeCachedContext(opt);
            }
            return result;
        },

        getListCollection: function(options) {
            var opt = $.extend({},  $.spEasyForms.defaults, options);
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
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
                    completefunc: function(xData) {
                        $(xData.responseXML).find("Group").each(function() {
                            var group = {};
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
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
                completefunc: function(xData) {
                    $(xData.responseXML).find("Group").each(function() {
                        var group = {};
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);

            opt.currentContext = this.get(opt);
            opt.listId = this.getCurrentListId(opt);
            
            if (!opt.listId) {
                return undefined;
            }

            if (this.config && opt.listId === this.configListId) {
                return this.config;
            }

            opt.lstContext = this.getListContext(opt);
            if (window.location.href.toLowerCase().indexOf("fiddle") >= 0 &&
                opt.lstContext.config !== undefined) {
                opt.currentConfig = opt.lstContext.config;
                opt.currentConfig = this.layout2Config(opt);
                this.config = opt.currentConfig;
                this.configListId = opt.lstContext.listId;
                return opt.currentConfig;
            }

            if (!opt.configFileName) {
                opt.configFileName = $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/SiteAssets") +
                    "/spef-layout-" + opt.listId.replace(
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
                        replace(/childColumnInternal/g, "columnNameInternal").
                        replace(/LookupDetailAdapter/g, "Lookup Detail").
                        replace(/DefaultToCurrentUser/g, "Default To Current User");
                    opt.currentConfig = $.spEasyForms.utilities.parseJSON(txt);
                    opt.currentConfig = spContext.layout2Config(opt);
                },
                error: function (xhr, ajaxOptions, thrownError) {
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

            this.fixAdapterListReferences(opt);

            this.config = opt.currentConfig;
            this.configListId = opt.listId;
            
            return opt.currentConfig;
        },

        fixAdapterListReferences: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentConfig && opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                var adapterNames = Object.keys(opt.currentConfig.adapters.def);
                $.each($(adapterNames), function (idx, current) {
                    var matcher = new RegExp("List$");
                    var adapter = opt.currentConfig.adapters.def[current];
                    $.each($(Object.keys(adapter)), function (i, k) {
                        if (matcher.test(k)) {
                            if (!(k + "Title" in adapter)) {
                                $.each($(spContext.getListCollection(opt)), function (idx, listObj) {
                                    if (listObj.id === adapter[k]) {
                                        adapter[k + "Title"] = listObj.title;
                                    }
                                });
                            }
                            else {
                                $.each($(spContext.getListCollection(opt)), function (idx, listObj) {
                                    if (listObj.title === adapter[k + "Title"]) {
                                        adapter[k] = listObj.id;
                                    }
                                });
                            }
                        }
                    });
                });
            }
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
            if (opt.useCache && opt.listId in opt.currentContext.listContexts) {
                opt.currentListContext = opt.currentContext[opt.listId];
            }
            if (opt.currentListContext === undefined) {
                opt.currentListContext = this.getListContext(opt);
            }
            opt.currentListContext.config = opt.currentConfig;
            if (opt.useCache) {
                 $.spEasyForms.writeCachedContext(opt);
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
            if (opt.listId === undefined) {
                opt.listId = $.spEasyForms.utilities.getRequestParameters().ListId;
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
            if (opt.siteUrl === undefined) {
                opt.siteUrl = $.spEasyForms.utilities.getRequestParameters().SiteUrl;
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
            var opt = $.extend({},  $.spEasyForms.defaults, options);
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

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/sharePoinFieldRows.js
/*
 * SPEasyForms.sharePointFieldRows - object to parse field rows into a map.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, ExecuteOrDelayUntilScriptLoaded, SPClientPeoplePicker */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Utility object to parse field rows into a map.
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
        init: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
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
                var current = $.spEasyForms.sharePointFieldRows.processTr(opt);
                if (current.internalName !== undefined) {
                    results[current.internalName] = current;
                }
            });
            if (opt.input === undefined) {
                this.rows = results;
            }
            var currentContext = $.spEasyForms.sharePointContext.get(opt);
            var listId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
            if (listId in currentContext.listContexts && !opt.skipCalculatedFields && $.spEasyForms.isSettingsPage(opt)) {
                var hasCalculatedFields = false;
                $.each(Object.keys(results), function (idx, key) {
                    if (results[key].spFieldType === "SPFieldCalculated") {
                        hasCalculatedFields = true;
                        return false;
                    }
                });
                if (!hasCalculatedFields) {
                    var listCtx = $.spEasyForms.sharePointContext.getListContext(options);
                    $.each(Object.keys(listCtx.schema), function (idx, key) {
                        var field = listCtx.schema[key];
                        if (field.type === "Calculated" && field.hasFormula) {
                            var tr = $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'><nobr>" +
                                field.displayName + "</nobr></h3></td><td class='ms-formbody'>value</td></tr>");
                            tr.appendTo("table.ms-formtable");
                            opt.row = tr;
                            var newRow = {
                                internalName: field.name,
                                displayName: field.displayName,
                                spFieldType: "SPFieldCalculated",
                                value: "",
                                row: tr
                            };
                            results[field.name] = newRow;
                        }
                    });
                }
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
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var current = opt.tr;
            var result = {};
            if (current.html().indexOf("idAttachmentsRow") >= 0) {
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
                result.internalName = "Attachments";
                result.displayName = "Attachments";
                result.spFieldType = "SPFieldAttachments";
            } else if (current.find("h3").text() === "Content Type" || current.children()[0].innerText === "Content Type") {
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
                result.internalName = "ContentType";
                result.displayName = "Content Type";
                result.spFieldType = "SPFieldContentType";
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
                    internalName: internal,
                    displayName: display,
                    spFieldType: fieldType
                };
                if (!opt.dontIncludeNodes) {
                    result.row = current;
                }
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
            if (result.displayName && result.internalName && result.spFieldType) {
                $.each(Object.keys(result), function (idx, key) {
                    if (result[key].row) {
                        result[key].row.attr("data-displayname", result.displayName);
                        result[key].row.attr("data-internalname", result.internalName);
                        result[key].row.attr("data-spfieldtype", result.spFieldType);
                    }
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
        value: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tr = opt.row;
            tr.value = "";
            try {
                if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                    tr.value = tr.row.find("td.ms-formbody").clone().children().remove().end().text().trim();
                    return tr.value;
                }
                switch (tr.spFieldType) {
                    case "SPFieldContentType":
                        tr.value = tr.row.find("td.ms-formbody select option:selected").text();
                        break;
                    case "SPFieldChoice":
                        var select = tr.row.find("td.ms-formbody select");
                        if (select.length > 0) {
                            tr.value = tr.row.find("td.ms-formbody select").val();
                            var tmp = tr.row.find("input:checked").first();
                            var re = new RegExp(/FillInButton$/i);
                            if (tmp.length > 0 && re.test(tmp[0].id)) {
                                tr.value = tr.row.find("input[type='text']").val();
                            }
                        } else {
                            tr.value = "";
                            tr.row.find("input:checked").each(function () {
                                if (tr.value) { tr.value += ";"; }
                                var re = new RegExp(/FillInRadio$/i);
                                if ($(this).length > 0 && !re.test($(this)[0].id)) {
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
                            input.val().length === 8)) {
                            tr.value = input.val().trim();
                            if (tr.value.indexOf("<div") === 0) {
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
                            $.each(appendedText, function (i, t) {
                                tr.value += t.outerHTML;
                            });
                        }
                        break;
                    case "SPFieldMultiChoice":
                        tr.value = "";
                        tr.row.find("input:checked").each(function () {
                            if (tr.value.length > 0) tr.value += "; ";
                            var re = new RegExp(/FillInRadio$/i);
                            if ($(this).length > 0 && !re.test($(this)[0].id)) {
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
                        if (selects.length === 2) {
                            var tmp2 = $(selects[0]).find(
                                "option:selected").text().split(' ');
                            if (tmp2.length === 2) {
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
                            for (var i = 1; i < parts.length; i += 2) {
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
                        var pplpkrDiv = $("[id^='" + tr.internalName + "'][id$='ClientPeoplePicker']");
                        if (pplpkrDiv.length > 0) {
                            var tmp3 = tr.row.find("input[type='hidden']").val();
                            if (typeof (tmp3) !== 'undefined') {
                                var hiddenInput = $.spEasyForms.utilities.parseJSON(tmp3);
                                $.each(hiddenInput, function (idx, entity) {
                                    if (tr.value.length > 0) {
                                        tr.value += "; ";
                                    }
                                    if (entity.isResolved || entity.IsResolved) {
                                        tr.value += "<a href='" +
                                        opt.currentContext.webRelativeUrl +
                                        "/_layouts/userdisp.aspx?ID=" +
                                        entity.EntityData.SPUserID +
                                        "' target='_blank'>" +
                                        entity.DisplayText + "</a>";
                                    }
                                    else {
                                        tr.value += entity.DisplayText;
                                    }
                                });
                            }
                        }
                        else {
                            var picker = $().SPServices.SPFindPeoplePicker({
                                peoplePickerDisplayName: tr.displayName
                            });
                            tr.value = picker.currentValue;
                        }
                        break;
                    case "SPFieldBusinessData":
                        tr.value = tr.row.find("div.ms-inputuserfield span span").text().trim();
                        break;
                    case "SPFieldCalculated":
                        tr.value = tr.find("td.ms-formbody").text().trim();
                        break;
                    default:
                        if (tr.row.find("td.ms-formbody input").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody input").val().trim();
                        }
                        else if (tr.row.find("td.ms-formbody textarea").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody textarea").val().replace("\n", "<br />\n").trim();
                        }
                        else if (tr.row.find("td.ms-formbody select").length > 0) {
                            tr.value = tr.row.find("td.ms-formbody select").val().trim();
                        }
                        break;
                }
            } catch (e) { }
            if (!tr.value) {
                tr.value = "";
            }
            return tr.value;
        },

        // a method to the SPEasyForms sharePointFieldRows instance to set the value of a field
        setValue: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tr = opt.row;
            tr.value = opt.value ? opt.value : "";
            try {
                // if we're on a display form, we can't very well set a field can we?
                if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                    return;
                }
                switch (tr.spFieldType) {
                    case "SPFieldContentType":
                        // content type is just a select, set its value
                        tr.row.find("td.ms-formbody select").val(tr.value);
                        break;
                    case "SPFieldChoice":
                    case "SPFieldMultiChoice":
                        var select = tr.row.find("td.ms-formbody select");
                        // if there is a select (as opposed to radios or checkboxes)
                        if (select.length > 0) {
                            // if the select has an option equal to the value
                            if (select.find("option[value='" + tr.value + "']").length > 0) {
                                select.val(tr.value); // set the select value
                            }
                            else {
                                // otherwise, look for a fill in choice input
                                var inpt = tr.row.find("input[type='text'][id$='FillInChoice']");
                                if (inpt.length === 0) {
                                    // sp2010
                                    inpt = tr.row.find("input[type='text'][title^='" + tr.displayName + "']");
                                }
                                if (inpt.length > 0) {
                                    // if we find one, set its value
                                    inpt.val(tr.value);
                                    // also set the checkbox for the indicating a fill in value is supplied
                                    inpt.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                }
                            }
                        } else {
                            // split values on semi-colon
                            var values = tr.value.split(";");
                            // clear any checked boxes or fill in inputs
                            tr.row.find("input[type='checkbox']").prop("checked", false);
                            tr.row.find("input[type='text'][id$='FillInText']").val("");
                            $.each($(values), function (idx, value) { // foreach value
                                if (value.length === 0) return;
                                // find the label for the value
                                var label = tr.row.find("label:contains('" + value + "')");
                                if (label.length > 0) {
                                    // check the checkbox associated with the label
                                    label.prev().prop("checked", true);
                                }
                                else {
                                    // otherwise look for a fill in input
                                    var input = tr.row.find("input[type='text'][id$='FillInText']");
                                    if (input.length === 0) {
                                        // sp2010
                                        input = tr.row.find("input[type='text'][title^='" + tr.displayName + "']");
                                    }
                                    if (input.length > 0) {
                                        if (input.val().length > 0) {
                                            // if there is already a value, append this one with a semi-colon separator
                                            input.val(input.val() + ";" + value);
                                            // also check the checkbox or radio indicating a fill in
                                            input.parent().parent().prev().find("input[type='checkbox']").prop("checked", true);
                                            input.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                        }
                                        else {
                                            // set the fill-in
                                            input.val(value);
                                            // also check the checkbox or radio indicating a fill in
                                            input.parent().parent().prev().find("input[type='checkbox']").prop("checked", true);
                                            input.parent().parent().prev().find("input[type='radio']").prop("checked", true);
                                        }
                                    }
                                }
                            });
                        }
                        break;
                    case "SPFieldNote":
                    case "SPFieldMultiLine":
                        // if there is a text area, set its text to the value
                        if (tr.row.find("iframe[Title='Rich Text Editor']").length > 0) {
                            tr.row.find("iframe[Title='Rich Text Editor']").contents().find("body").html(tr.value);
                        }
                        else if (tr.row.find("div[contenteditable='true']").length > 0) {
                            tr.row.find("div[contenteditable='true']").html(tr.value);
                            tr.row.find("td.ms-formbody input").val(tr.value);
                        }
                        else if (tr.row.find("textarea").length > 0) {
                            tr.row.find("textarea").text(tr.value);
                        }
                        break;
                    case "SPFieldDateTime":
                        var date = new Date(tr.value);
                        if (date.toString() !== "Invalid Date") {
                            // set the input to the date portion of the date/time
                            tr.row.find("input").val($.datepicker.formatDate("mm/dd/yy", date));
                            // if there is an hours drop down, select the hour based on date.getHours
                            if (tr.row.find("option[value='" + date.getHours() + "']").length > 0) {
                                tr.row.find("select[id$='Hours']").val(date.getHours());
                            }
                            else {
                                // sp2010
                                var i = date.getHours();
                                var fmt = "";
                                if (i < 12) {
                                    fmt = i + " AM";
                                }
                                else {
                                    fmt = (i - 12) + " PM";
                                }
                                tr.row.find("select[id$='Hours']").val(fmt);
                            }
                            // if there is a minutes drop down, select the minutes based on date.getMinutes, Note: that SharePoint only 
                            // allows 5 minute increments so if you pass in 04 as the minutes notthing is selected
                            tr.row.find("select[id$='Minutes']").val(date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
                        }
                        else {
                            tr.row.find("input").val("");
                            if (tr.row.find("option[value='0']").length > 0) {
                                tr.row.find("select[id$='Hours']").val("0");
                            }
                            else {
                                tr.row.find("select[id$='Hours']").val("12 AM");
                            }
                            tr.row.find("select[id$='Minutes']").val("00");
                        }
                        break;
                    case "SPFieldBoolean":
                        // if 0, false, or no was passed (case insensitive), uncheck the box
                        if (tr.value.length === 0 || tr.value === "0" || tr.value.toLowerCase() === "false" || tr.value.toLowerCase() === "no") {
                            tr.row.find("input").prop("checked", false);
                        }
                        else {
                            // otherwise check the box
                            tr.row.find("input").prop("checked", true);
                        }
                        break;
                    case "SPFieldURL":
                        // if no pipe, set the url and description to the full value
                        if (tr.value.indexOf("|") < 0) {
                            tr.row.find("input").val(tr.value);
                        }
                        else {
                            // otherwise set the url to the first part and the description to the second
                            var parts = tr.value.split("|", 2);
                            tr.row.find("input[id$='UrlFieldUrl']").val(parts[0]);
                            tr.row.find("input[id$='UrlFieldDescription']").val(parts[1]);
                        }
                        break;
                    case "SPFieldUser":
                    case "SPFieldUserMulti":
                        var pplpkrDiv = tr.row.find("[id^='" + tr.internalName + "'][id$='ClientPeoplePicker']");
                        // if there is a client people picker, add each value using it
                        if (pplpkrDiv.length > 0) {
                            ExecuteOrDelayUntilScriptLoaded(function () {
                                var clientPplPicker = SPClientPeoplePicker.SPClientPeoplePickerDict[pplpkrDiv[0].id];
                                if (clientPplPicker) {
                                    var resolvedUsersList = $(document.getElementById(clientPplPicker.ResolvedListElementId)).find("span[class='sp-peoplepicker-userSpan']");
                                    $(resolvedUsersList).each(function () {
                                        clientPplPicker.DeleteProcessedUser(this);
                                    });
                                    var entities = tr.value.split(";");
                                    $.each($(entities), function (idx, entity) {
                                        clientPplPicker.AddUserKeys(entity);
                                    });
                                }
                            }, "clientpeoplepicker.js");
                        } else {
                            // otherwise use SPServices to set the people picker value
                            tr.row.find("div[title='People Picker']").html("");
                            tr.row.find("textarea[title='People Picker']").val("");
                            var displayName = tr.displayName;
                            ExecuteOrDelayUntilScriptLoaded(function () {
                                setTimeout(function () {
                                    $().SPServices.SPFindPeoplePicker({
                                        peoplePickerDisplayName: displayName,
                                        valueToSet: tr.value,
                                        checkNames: true
                                    });
                                    tr.row.find("img[title='Check Names']").trigger("click");
                                }, 1000);
                            }, "sp.js");
                        }
                        break;
                    case "SPFieldLookup":
                        // if there is an option with value equal to what's passed in, select it
                        if (tr.row.find("option[value='" + tr.value + "']").length > 0) {
                            tr.row.find("option[value='" + tr.value + "']").prop("selected", true);
                        }
                        else {
                            // otherwise select the first option that contains the value in its text
                            tr.row.find("option:contains('" + tr.value + "'):first").prop("selected", true);
                        }
                        break;
                    case "SPFieldLookupMulti":
                        // same as above but set multiple values separated by a semi-colon
                        var valueArray = tr.value.split(";");
                        $.each($(valueArray), function (idx, value) {
                            if (tr.row.find("option[value='" + value + "']").length > 0) {
                                tr.row.find("option[value='" + value + "']").remove().appendTo("select[id$='_SelectResult']");
                            }
                            else {
                                tr.row.find("option:contains('" + value + "'):first").remove().appendTo("select[id$='_SelectResult']");
                            }
                        });
                        break;
                    default:
                        // by default, look for an input and set it
                        tr.row.find("input").val(tr.value);
                        break;
                }
            } catch (e) { }
        },

        compareField: function (a, b) {
            var fields = $.spEasyForms.sharePointContext.getListContext().fields;
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

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/configManager.js
/*
 * SPEasyForms.configManager - Object that encapsulates getting, setting, and saving the SPEasyForms
 * configuration file for the current list.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Object that encapsulates getting, setting, and saving the SPEasyForms
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
        get: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var currentConfig;
            if ($("#spEasyFormsJson pre").text().length > 0) {
                currentConfig = $.spEasyForms.utilities.parseJSON($("#spEasyFormsJson pre").text());
            } else {
                currentConfig = $.spEasyForms.sharePointContext.getConfig(opt);

                var nextIndex = 1;
                var updateLayouts201501 = function (layoutArray) {
                    for (var i = 0; i < layoutArray.length; i++) {
                        var current = layoutArray[i];
                        current.index = nextIndex++;
                        if (!current.containerType) {
                            current.containerType = "FieldCollection";
                        }
                        if (!current.name) {
                            current.name = current.containerType;
                        }
                        if (current.fieldCollections) {
                            updateLayouts201501(current.fieldCollections);
                        }
                    }
                };

                if (typeof(currentConfig) !== 'undefined') {
                    updateLayouts201501(currentConfig.layout.def);
                    $("#spEasyFormsJson pre").text(JSON.stringify(currentConfig, null, 4));
                }

                $("#spEasyFormsSaveButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                $("#spEasyFormsUndoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                $("#spEasyFormsRedoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
            }
            if (typeof (currentConfig) === 'undefined') {
                $("#spEasyFormsExportButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                currentConfig = {
                    layout: {
                        def: [{
                            "containerType": $.spEasyForms.defaultFormContainer.containerType
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
                $("#spEasyFormsSaveButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                $("#spEasyFormsUndoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                $("#spEasyFormsRedoButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
            }
            options.layout = currentConfig.layout.def;
            $.each(options.layout, function (idx, container) {
                if (container.fieldGroups) {
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
        set: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!opt.currentConfig) {
                opt.currentConfig = {
                    layout: {
                        def: [{
                            "containerType": $.spEasyForms.defaultFormContainer.containerType
                        }]
                    },
                    visibility: {
                        def: {}
                    },
                    adapters: {
                        def: {}
                    }
                };
            }
            opt.currentConfig.version = "2015.01.03";
            var newConfig = JSON.stringify(opt.currentConfig, null, 4);
            var oldConfig = $("#spEasyFormsJson pre").text();
            if (newConfig !== oldConfig) {
                $("#spEasyFormsJson pre").text(newConfig);
                $("#spEasyFormsSaveButton").removeClass("speasyforms-disabled").css({ opacity: 1.0 });
                $("#spEasyFormsExportButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                $("#spEasyFormsImportButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                this.undoBuffer.push(oldConfig);
                $("#spEasyFormsUndoButton").removeClass("speasyforms-disabled").css({ opacity: 1.0 });
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
        save: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var listId = $.spEasyForms.sharePointContext.getCurrentListId(opt);
            $.ajax({
                url: $.spEasyForms.utilities.webRelativePathAsAbsolutePath("/SiteAssets") +
                    "/spef-layout-" +
                    listId.replace("{", "").replace("}", "") + ".txt",
                type: "PUT",
                headers: {
                    "Content-Type": "text/plain",
                    "Overwrite": "T"
                },
                data: $("#spEasyFormsJson pre").text(),
                success: function () {
                    opt.listId = listId;
                    opt.currentConfig = $.spEasyForms.utilities.parseJSON($("#spEasyFormsJson pre").text());
                    $.spEasyForms.sharePointContext.setConfig(opt);
                    $("#spEasyFormsSaveButton").addClass("speasyforms-disabled").css({ opacity: 0.3 });
                    $("#spEasyFormsExportButton").removeClass("speasyforms-disabled").css({ opacity: 1.0 });
                    $("#spEasyFormsImportButton").removeClass("speasyforms-disabled").css({ opacity: 1.0 });
                },
                error: function (xhr, ajaxOptions, thrownError) {
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

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/containerCollection.js
/*
 * SPEasyForms.containerCollection - object to hold and manage all containers.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
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

    ////////////////////////////////////////////////////////////////////////////F
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

                if (!opt.loadDynamicStylesAlways && (opt.currentConfig.layout.def.length || opt.currentConfig.visibility.def.length || opt.currentConfig.adapters.def.length)) {
                    $.spEasyForms.loadDynamicStyles(opt);
                }

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

                if (!$.spEasyForms.isSettingsPage(opt)) {
                    $.spEasyForms.visibilityRuleCollection.transform(opt);
                    $.spEasyForms.adapterCollection.transform(opt);
                }

                if (opt.currentConfig.formWidth && opt.currentConfig.formWidth !== "800") {
                    pre.width(opt.currentConfig.formWidth);
                    post.width(opt.currentConfig.formWidth);
                }
                this.postTransform(opt);
            }

            this.highlightValidationErrors(opt);

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
                this.postTransform(opt);
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
            else {
                return this.highlightValidationErrors(opt);
            }

            $.spEasyForms.utilities.resizeModalDialog();

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
            if (!$.spEasyForms.isSettingsPage(opt)) {
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
                current.row.find(".speasyforms-columnheader").removeClass("speasyforms-columnheader").addClass("ms-h3").addClass("ms-standardheader").addClass("ms-formlabel");
                current.row.find("h3").addClass("ms-standardheader");
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
                    if (containerCollection.rows[opt.fieldName]) {
                        opt.spFieldType = containerCollection.rows[opt.fieldName].spFieldType;
                        $.spEasyForms.adapterCollection.launchDialog(opt);
                    }
                    else {
                        alert("The field '" + opt.fieldName + "' does not appear to exist?");
                    }
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
                    theme = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/~version/Css/jquery-ui-' + theme + '/jquery-ui.css');
                    opt.currentConfig.jQueryUITheme = theme;
                }
                else if (themeType === "custom") {
                    theme = $("#inpCustomTheme").val();
                    opt.currentConfig.jQueryUITheme = theme;
                }
                else {
                    delete opt.currentConfig.jQueryUITheme;
                }

                if (/^[0-9]*$/.test($("#spFormWidth").val())) {
                    $("#formWidthValidationError").hide();
                    if ($("#spFormWidth").val() !== "800") {
                        opt.currentConfig.formWidth = $("#spFormWidth").val();
                    }
                    else {
                        delete opt.currentConfig.formWidth;
                    }
                    $.spEasyForms.configManager.set(opt);

                    if (theme) {
                        opt.source = theme;
                    }
                    else {
                        opt.source = opt.jQueryUITheme;
                    }
                    $("head").append('<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');
                }
                else {
                    $("#formWidthValidationError").show();
                }

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
                $("#selGalleryTheme").val(currentGalleryTheme);
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

            if (opt.currentConfig.formWidth) {
                $("#spFormWidth").val(opt.currentConfig.formWidth);
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
                    window.location.href = window.location.href.replace("&spEasyFormsVerbose=true", "").replace("SPEasyFormsSettingsVerbose.aspx", "SPEasyFormsSettings.aspx");
                } else {
                    window.location.href = window.location.href.replace("SPEasyFormsSettings.aspx", "SPEasyFormsSettingsVerbose.aspx") + "&spEasyFormsVerbose=true";
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
                var helpFile = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2015.01.03/Help/speasyforms_help.aspx");
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
                width: 735,
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
                tr.removeClass("ui-widget-content").addClass("speasyforms-fieldmissing").addClass("ui-state-error");
                tr.find("td").removeClass("ui-widget-content").addClass("speasyforms-fieldmissing").addClass("ui-state-error");
            }

            tr.find(".speasyforms-fieldname").html(r.displayName);
            tr.find(".speasyforms-fieldinternal").html(r.internalName);
            tr.find(".speasyforms-fieldtype").html(r.spFieldType);

            opt.spFieldType = r.spFieldType;
            if ($.spEasyForms.adapterCollection.getSupportedTypes(opt).length === 0) {
                var adapterIcon = tr.find(".speasyforms-icon-adapter");
                adapterIcon.parent().width(adapterIcon.width);
                adapterIcon.hide();
            }

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

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.defaultContainer.js
/*
 * SPEasyForms.containerCollection.defaultFormContainer - object representing the OOB SharePoint form.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
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
        cannotBeAdded: true,
        noChildren: true,
        noParent: true,

        transform: function () {
            return [];
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var table = containerCollection.createFieldCollection(opt);
            $.each(containerCollection.rows, function (fieldIdx, row) {
                if ($.inArray(fieldIdx, opt.fieldsInUse) < 0) {
                    table.append(containerCollection.createFieldRow({ row: row }));
                    $(".ms-formtable").append(row.row);
                }
            });

            var div = $("<div>", { "class": "speasyforms-nestedsortable-content" });
            div.append(table);
            opt.currentContainer.append(div);
        },

        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            return {
                containerType: this.containerType,
                index: $(opt.container).attr("data-containerindex")
            };
        }
    };
    var defaultFormContainer = $.spEasyForms.defaultFormContainer;
    containerCollection.containerImplementations.defaultForm = defaultFormContainer;

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.baseContainer.js
/*
 * SPEasyForms.containerCollection.baseContainer - This abstract container implements all 
 * of the editor functionality for any container type comprised of one or more 
 * groups of fields (which I imagine is all containers).  It implements everything 
 * but the transform function.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
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


///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.fieldCollection.js
/*
 * SPEasyForms.containerCollection.fieldCollection - This is the leaf collection most of the time, a collection that contains
 * a single table of SharePoint fields.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;

    $.spEasyForms.fieldCollection = {
        containerType: "FieldCollection",
        cannotBeAdded: true,
        noChildren: true,
        needsParent: true,

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            opt.table = $("<table role='presentation' id='" + opt.collectionType + "Table" + opt.collectionIndex + "' class='speasyforms-fieldcollection " + opt.tableClass + "'></table>");
            opt.currentContainerParent.append(opt.table);

            $.each(opt.fieldCollection.fields, function (fieldIdx, field) {
                opt.rowInfo = containerCollection.rows[field.fieldInternalName];
                if ($.spEasyForms.baseContainer.appendRow(opt)) {
                    result.push(field.fieldInternalName);
                }
            });
            return result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            if (container.find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            if (container.find("span[role='alert']").length > 0) {
                container.attr("data-speasyforms-validationerror", "1");
            }
            else {
                container.attr("data-speasyforms-validationerror", "0");
            }
            return true;
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            var table = containerCollection.createFieldCollection(opt);

            $.each(opt.currentContainerLayout.fields, function (fieldIdx, field) {
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
                table.append(containerCollection.createFieldRow(opt));
                result.push(field.fieldInternalName);
            });

            opt.currentContainer.find(".speasyforms-itemtitle").html(opt.currentContainerLayout.name);
            if (opt.currentContainerLayout.name !== opt.currentContainerLayout.containerType) {
                opt.currentContainer.find(".speasyforms-itemtype").html("&nbsp;[" + opt.currentContainerLayout.containerType + "]");
            }
            opt.currentContainer.find(".speasyforms-nestedsortable-content").append(table);

            return result;
        },

        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var trs = $(opt.container).find("tr:not(:first)");

            var result = {
                name: $(opt.container).attr("data-containername"),
                containerType: $(opt.container).attr("data-containertype"),
                index: $(opt.container).attr("data-containerindex"),
                fields: []
            };

            $.each(trs, function (idx, tr) {
                var tds = $(tr).find("td");
                result.fields.push({
                    fieldInternalName: $(tds[1]).text()
                });
            });

            return result;
        }
    };
    var fieldCollection = $.extend({}, $.spEasyForms.baseContainer, $.spEasyForms.fieldCollection);
    containerCollection.containerImplementations.fieldCollection = fieldCollection;

})(spefjQuery);


///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.accordion.js
-/*
 * SPEasyForms.containerCollection.accordion - Object representing an accordion container.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Accordion container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var accordion = {
        containerType: "Accordion",
        fieldCollectionsDlgTitle: "Enter the names of the accordion pages, one per line",
        fieldCollectionsDlgPrompt: "Page Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];
            var divId = "spEasyFormsAccordionDiv" + opt.currentContainerLayout.index;
            var divClass = "speasyforms-accordion";

            var div = $("<div/>", { "id": divId, "class": divClass });
            opt.currentContainerParent.append(div);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<div/>", { "id": opt.parentElement });
                opt.collectionType = "accordion";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-accordion";

                var header = $("<h3>", {
                    "id": "spEasyFormsAccordionHeader" + opt.collectionIndex,
                    "class": opt.tableClass
                }).text(fieldCollection.name);

                div.append(header);
                div.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            div.accordion({
                heightStyle: "content",
                active: false,
                collapsible: true,
                activate: function (e) {
                    e.preventDefault();
                }
            });

            div.on("mouseup", "h3.speasyforms-accordion", function (e) {
                if (e.which === 1) {
                    div.find("h3.speasyforms-accordion").
                        removeClass("ui-accordion-header-active").
                        removeClass("ui-state-active").
                        removeClass("ui-corner-top").
                        addClass("ui-corner-all");
                    div.find(".ui-accordion-content").hide();

                    $(this).
                        addClass("ui-accordion-header-active").
                        addClass("ui-state-active").
                        addClass("ui-corner-top").
                        removeClass("ui-corner-all");
                    $(this).next().show();
                    $.spEasyForms.containerCollection.postTransform(opt);
                    $.spEasyForms.utilities.resizeModalDialog();
                }
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var accordion = container.children("div.speasyforms-accordion");
            var headers = accordion.children("h3.ui-accordion-header");
            var content = accordion.children("div.ui-accordion-content ");
            var allHidden = true;
            for (var idx = 0; idx < content.length; idx++) {
                var subContainer = $(content[idx]).children(".speasyforms-container");
                if (subContainer.attr("data-speasyformsempty") === "1") {
                    var active = accordion.accordion("option", "active");
                    if (active === idx) {
                        accordion.accordion({ active: idx + 1 });
                    }
                    $(headers[idx]).hide();
                }
                else {
                    $(headers[idx]).show();
                    allHidden = false;
                }
            }
            if (allHidden) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var accordion = container.children("div.speasyforms-accordion");
            var headers = accordion.children("h3.ui-accordion-header");
            var content = accordion.children("div.ui-accordion-content ");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < content.length; idx++) {
                var subContainer = $(content[idx]).children(".speasyforms-container");
                if (subContainer.attr("data-speasyforms-validationerror") === "1") {
                    if (container.attr("data-speasyforms-validationerror") === "0") {
                        container.attr("data-speasyforms-validationerror", "1");
                        accordion.accordion({ active: idx });
                    }
                    $(headers[idx]).addClass("speasyforms-accordionvalidationerror");
                }
                else {
                    $(headers[idx]).removeClass("speasyforms-accordionvalidationerror");
                }
            }
            return true;
        }
    };

    containerCollection.containerImplementations.accordion = $.extend({}, baseContainer, accordion);

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.columns.js
/*
 * SPEasyForms.containerCollection.columns - Object representing a multi-column container.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Columns container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var columns = {
        containerType: "Columns",
        fieldCollectionsDlgTitle: "Enter the names of the columns, one per line; these are only displayed on the settings page, not on the form itself.",
        fieldCollectionsDlgPrompt: "Column Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            var outerTableId = "spEasyFormsColumnsOuterTable" + opt.currentContainerLayout.index;
            var outerTableClass = "speasyforms-columns";

            var table = $("<table role='presentation' id='" + outerTableId + "' class='" + outerTableClass + "' width='100%' ></table>");
            var tableRow = $("<tr/>", { "id": outerTableId + "Row" });
            table.append(tableRow);
            opt.currentContainerParent.append(table);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<td/>", { "id": "spEasyFormsColumnsCell" + opt.collectionIndex });
                opt.collectionType = "columns";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-columncell";
                if (opt.currentContainerLayout.fieldCollections.length > 1) {
                    opt.headerOnTop = true;
                }

                tableRow.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            var allHidden = true;
            for (var idx = 0; idx < opt.currentContainerLayout.fieldCollections.length; idx++) {
                var id = "#spEasyFormsColumnsCell" + index + "_" + idx;
                if ($(id).children("div.speasyforms-container").attr("data-speasyformsempty") !== "1") {
                    allHidden = false;
                    break;
                }
            }
            if (allHidden) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
                opt.tables = container.find("> table > tbody > tr > td > div > table.speasyforms-fieldcollection");
                this.evenUpTableRows(opt);
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < opt.currentContainerLayout.fieldCollections.length; idx++) {
                var id = "#spEasyFormsColumnsCell" + index + "_" + idx;
                if ($(id).children("div.speasyforms-container").attr("data-speasyforms-validationerror") === "1") {
                    container.attr("data-speasyforms-validationerror", "1");
                    break;
                }
            }
            return true;
        },

        evenUpTableRows: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var tableRows = [];
            var rowCount = 0;
            $.each($(opt.tables), function (idx, table) {
                var currentRows = $(table).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").closest("tr");
                tableRows.push(currentRows);
                if (currentRows.length > rowCount) {
                    rowCount = currentRows.length;
                }
                $.each($(currentRows), function (idx, row) {
                    $(row).css("height", "auto");
                });
            });
            /* jshint -W083 */
            for (var i = 0; i < rowCount; i++) {
                var height = 0;
                $.each($(tableRows), function (idx, rows) {
                    if (rows.length > i && $(rows[i]).height() > height) {
                        height = $(rows[i]).height();
                    }
                });
                if (height > 0) {
                    $.each($(tableRows), function (idx, rows) {
                        if (rows.length > i && $(rows[i]).height() !== height) {
                            $(rows[i]).height(height);
                        }
                    });
                }
            }
            /* jshint +W083 */
        }
    };

    containerCollection.containerImplementations.columns = $.extend({}, baseContainer, columns);

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.stack.js
/*
 * SPEasyForms.containerCollection.stack - Object representing a container where multiple containers
 * can be stacked one on top of another.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Stack container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var columns = {
        containerType: "Stack",
        fieldCollectionsDlgTitle: "Enter the names of the containers, one per line; these are only displayed on the settings page, not on the form itself.",
        fieldCollectionsDlgPrompt: "Container Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = opt.currentContainerParent;
                opt.collectionType = "stack";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = "speasyforms-stack";

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyformsempty", "1").hide();
            if (container.children("div.speasyforms-container").length > 0) {
                container.children("div.speasyforms-container").each(function (idx, current) {
                    if ($(current).attr("data-speasyformsempty") === "0") {
                        container.attr("data-speasyformsempty", "0").show();
                        return false;
                    }
                });
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var index = opt.currentContainerLayout.index;
            var container = $("div.speasyforms-container[data-containerindex='" + index + "']");
            container.attr("data-speasyforms-validationerror", "0");
            container.children("div.speasyforms-container").each(function (idx, current) {
                if ($(current).attr("data-speasyforms-validationerror") === "1") {
                    container.attr("data-speasyforms-validationerror", "1");
                    return false;
                }
            });
            return true;
        },
    };

    containerCollection.containerImplementations.stack = $.extend({}, baseContainer, columns);

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.tabs.js
/*
 * $.spEasyForms.containerCollection.tabs - Object representing a tabs container.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    ////////////////////////////////////////////////////////////////////////////
    // Tabs container implementation.
    ////////////////////////////////////////////////////////////////////////////
    var tabs = {
        containerType: "Tabs",
        fieldCollectionsDlgTitle: "Enter the names of the tabs, one per line",
        fieldCollectionsDlgPrompt: "Tab Names (one per line):",

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            var divId = "spEasyFormsTabDiv" + opt.currentContainerLayout.index;
            var divClass = "speasyforms-tabs";
            var listId = "spEasyFormsTabList" + opt.currentContainerLayout.index;
            var listClass = "speasyforms-tablist";

            var div = $("<div/>", { "id": divId, "class": divClass });
            var list = $("<ul/>", { "id": listId, "class": listClass });
            div.append(list);
            opt.currentContainerParent.append(div);

            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.parentElement = $("<div/>", { "id": "spEasyFormsTabsDiv" + opt.collectionIndex, "class": divClass });
                opt.collectionType = "tab";
                opt.fieldCollection = fieldCollection;
                opt.tableClass = divClass;

                var li = $("<li/>", { "id": "spEasyFormsTabsLabel" + opt.collectionIndex, "class": divClass });
                li.append($("<a/>", { "href": "#" + "spEasyFormsTabsDiv" + opt.collectionIndex }).text(fieldCollection.name));
                list.append(li);

                div.append(opt.parentElement);

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            div.tabs({
                beforeLoad: function (e, ui) {
                    ui.jqXHR.abort();
                },
                create: function () {
                    $(this).children("div").hide();
                    $(this).children(".speasyforms-tabs:first").show();
                },
                activate: function (e, ui) {
                    var id = ui.newTab.context.hash;
                    $(id).parent().children("div").hide();
                    $(id).show();
                    $.spEasyForms.containerCollection.postTransform(opt);
                }
            });

            div.on("mouseup", "a.ui-tabs-anchor", function (e) {
                if (e.which === 1) {
                    div.tabs({
                        active: $(this).parent().index()
                    });
                    $.spEasyForms.utilities.resizeModalDialog();
                }
            });

            return opt.result;
        },

        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            var tabs = container.children("div.speasyforms-tabs");
            var subContainers = tabs.children("div.speasyforms-tabs").children("div.speasyforms-container");
            var listItems = tabs.children("ul").children("li");
            var allHidden = true;
            for (var idx = 0; idx < subContainers.length; idx++) {
                if ($(subContainers[idx]).attr("data-speasyformsempty") === "1") {
                    var active = tabs.tabs("option", "active");
                    if (active === idx) {
                        tabs.tabs({ active: idx + 1 });
                    }
                    $(listItems[idx]).hide();
                }
                else {
                    $(listItems[idx]).show();
                    allHidden = false;
                }
            }
            if (allHidden) {
                container.attr("data-speasyformsempty", "1").hide();
            }
            else {
                container.attr("data-speasyformsempty", "0").show();
            }
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var container = $("div.speasyforms-container[data-containerindex='" + opt.currentContainerLayout.index + "']");
            var tabs = container.children("div.speasyforms-tabs");
            var subContainers = tabs.children("div.speasyforms-tabs").children("div.speasyforms-container");
            var listItems = tabs.children("ul").children("li");
            container.attr("data-speasyforms-validationerror", "0");
            for (var idx = 0; idx < subContainers.length; idx++) {
                if ($(subContainers[idx]).attr("data-speasyforms-validationerror") === "1") {
                    if (container.attr("data-speasyforms-validationerror") === "0") {
                        container.attr("data-speasyforms-validationerror", "1");
                        tabs.tabs({ active: idx });
                    }
                    $(listItems[idx]).find("a").addClass("speasyforms-tabvalidationerror");
                }
                else {
                    $(listItems[idx]).find("a").removeClass("speasyforms-tabvalidationerror");
                }
            }
            return true;
        }
    };

    containerCollection.containerImplementations.tabs = $.extend({}, baseContainer, tabs);

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.wizard.js
/*
 * SPEasyForms WizardContainer - container that allows users to page through sub-containers one at a time.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;
    var baseContainer = $.spEasyForms.baseContainer;

    var wizard = {
        containerType: "Wizard",

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.result = [];

            if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "display") {
                return opt.result;
            }

            // create a div to hold the container
            opt.divId = "spEasyFormsWizardDiv" + opt.currentContainerLayout.index;
            var outerDiv = $("<div/>", {
                "id": opt.divId,
                "class": "speasyforms-wizard-outer ui-widget-content ui-corner-all",
                "role": "tablist"
            });
            opt.currentContainerParent.append(outerDiv);

            // loop through field collections adding them as headers/tables to the container div
            $.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
                opt.collectionIndex = opt.currentContainerLayout.index + "_" + idx;
                opt.tableClass = "speasyforms-wizard";

                var h3 = $("<h3/>", {
                    "id": "page" + opt.collectionIndex,
                    "class": opt.tableClass + " ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-accordion-icons",
                    "aria-controls": "pageContent" + opt.collectionIndex,
                    "role": "tab"
                }).text(fieldCollection.name);
                outerDiv.append(h3);

                var div = $("<div/>", {
                    "id": "pageContent" + opt.collectionIndex,
                    "class": opt.tableClass,
                    "aria-labelledby": "page" + opt.collectionIndex,
                    "role": "tabPanel"
                });
                outerDiv.append(div);

                opt.parentElement = div;
                opt.collectionType = "wizard";
                opt.fieldCollection = fieldCollection;

                $.spEasyForms.baseContainer.appendFieldCollection(opt);
            });

            // create next/previous buttons and wire their click events
            opt.outerDiv = outerDiv;
            this.wireButtons(opt);

            // return an array of the fields added to this container
            return opt.result;
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var headerSelector = "#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected";
            if ($(headerSelector).length === 0) {

                // calculate the width and height of the pages
                var width = 400;
                var height = 35;
                var outerDiv = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index);
                outerDiv.children("div.speasyforms-wizard").each(function () {
                    if (($(this).width() + 100) > width) {
                        width = $(this).width() + 100;
                    }
                    if ($(this).height() > height) {
                        height = $(this).height();
                    }
                });

                // set the height/width of each page, hide the unselected pages, 
                // and show the selected page
                wizard.deselectall(outerDiv);
                var selected = false;
                outerDiv.children("div.speasyforms-wizard").each(function () {
                    $(this).width(width).height(height); // set height/width
                    if (!selected) {
                        if ($(this).children("div").attr("data-speasyformsempty") === "0") {
                            wizard.select($(this).prev(), outerDiv);
                            selected = true;
                        }
                    }
                });

                if (!selected) {
                    outerDiv.parent().attr("data-speasyformsempty", "1").hide();
                }

            }
            this.setNextPrevVisibility(opt);
        },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // check if there are validation errors on the container
            var outerDiv = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index);
            outerDiv.children("h3.speasyforms-wizard").removeClass("speasyforms-accordionvalidationerror");
            var errorDivs = outerDiv.children("div.speasyforms-wizard").children("div[data-speasyforms-validationerror='1']");
            if (errorDivs.length > 0) {
                // if so, select and show the first page with validation errors
                var div = $(errorDivs[0]).closest("div.speasyforms-wizard");
                var h3 = div.prev();
                this.select(h3, outerDiv);
                // and highlight all pages with validation errors
                errorDivs.each(function () {
                    h3 = $(this).closest("div.speasyforms-wizard").prev();
                    h3.addClass("speasyforms-accordionvalidationerror");
                });
            }
            wizard.setNextPrevVisibility(opt);
        },

        // select the content area for the given header
        select: function (header, outerDiv) {
            this.deselectall(outerDiv);
            var div = header.next();
            header.addClass("speasyforms-wizard-selected").attr("aria-selected", "true").attr("aria-hidden", "false").show();
            div.attr("aria-hidden", "false").attr("aria-expanded", "true").addClass("speasyforms-wizard-selected").show();
        },

        // deselect all content areas
        deselectall: function (outerDiv) {
            outerDiv.find("h3.speasyforms-wizard").each(function (idx, h) {
                var header = $(h);
                header.removeClass("speasyforms-wizard-selected").attr("aria-selected", "false").attr("aria-hidden", "true").hide();
                var div = header.next();
                div.removeClass("speashforms-wizard-selected").attr("aria-expanded", "false").attr("aria-hidden", "true").hide();
            });
        },

        // add next and previous buttons and wire up their events
        wireButtons: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // append next and previous buttons to the container
            opt.outerDiv.append("<div  id='" + opt.divId + "Buttons' align='right' " +
                "style='margin-bottom: 10px; margin-right: 10px; " +
                "font-size: .9em; font-weight: normal;'>" +
                "<button id='" + opt.divId + "Previous' title='Previous' " +
                "class='speasyforms-wizard-prev'>Previous</button>" +
                "<button id='" + opt.divId + "Next' title='Next' " +
                "class='speasyforms-wizard-next'>Next</button>" +
                "</div>");
            $("#" + opt.divId + "Buttons").append(
                "<img class='placeholder' align='right' style='display:none;margin:11px;'" +
                " src='/_layouts/images/blank.gif?rev=38' height='1' width='" +
                $("#" + opt.divId + "Next").outerWidth() +
                "' alt='' data-accessibility-nocheck='true'/>");

            // handle previous click event
            $("#" + opt.divId + "Previous").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected");
                wizard.selectPrevious(opt);
                return false;
            });

            // handle next click event
            $("#" + opt.divId + "Next").button().click(function () {
                opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index + " h3.speasyforms-wizard-selected");
                wizard.selectNext(opt);
                return false;
            });
        },

        // hide the current page and show the nearest previous page with visible fields
        selectPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var h3 = this.getPrevious(opt);
            if (h3) {
                var div = h3.closest("div.speasyforms-wizard-outer ");
                this.select(h3, div);
            }
            wizard.setNextPrevVisibility(opt);
        },

        // hide the current page and show the nearest next page with visible fields
        selectNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var h3 = this.getNext(opt);
            if (h3) {
                var div = h3.closest("div.speasyforms-wizard-outer ");
                this.select(h3, div);
            }
            wizard.setNextPrevVisibility(opt);
        },

        // returns the header node for the previous page, or null if there is no previous visible page
        getPrevious: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var prev = null;
            if (opt.selectedHeader.prev() && opt.selectedHeader.prev().prev()) {
                prev = opt.selectedHeader.prev().prev();
                while (prev && prev.length) {
                    if (prev.next().children("div").attr("data-speasyformsempty") === "0") {
                        break;
                    }
                    else if (prev.prev() && prev.prev().prev()) {
                        prev = prev.prev().prev();
                    }
                    else {
                        prev = null;
                    }
                }
            }
            return prev;
        },

        // returns the header node for the next page, or null if there is no next visible page
        getNext: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var next = null;
            if (opt.selectedHeader.next() && opt.selectedHeader.next().next()) {
                next = opt.selectedHeader.next().next();
                while (next && next.length) {
                    if (next.next().children("div").attr("data-speasyformsempty") === "0") {
                        break;
                    }
                    else if (next.next() && next.next().next()) {
                        next = next.next().next();
                    }
                    else {
                        next = null;
                    }
                }
            }
            return next;
        },

        // determine the visibility of the next any previous buttons, based on whether there
        // is a VISIBLE next or previous page.
        setNextPrevVisibility: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.selectedHeader = $("#spEasyFormsWizardDiv" + opt.currentContainerLayout.index +
                " h3.speasyforms-wizard-selected");
            var tmp = this.getPrevious(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-prev").hide();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-prev").show();

            }
            tmp = this.getNext(opt);
            if (!tmp || tmp.length === 0) {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-next").hide();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".placeholder").show();
            }
            else {
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".speasyforms-wizard-next").show();
                opt.selectedHeader.closest("div.speasyforms-wizard-outer").
                    find(".placeholder").hide();
            }
        }
    };

    // extending baseContainer takes care of all functionality for the settings page
    containerCollection.containerImplementations.wizard = $.extend({}, baseContainer, wizard);

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/cont.htmlSnippet.js
/*
 * SPEasyForms htmlSnippet
 *
 * @version 2015.01.03
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function($, undefined) {

    var containerCollection = $.spEasyForms.containerCollection;

    $.spEasyForms.containerCollection.containerImplementations.htmlSnippet = {
        containerType: "HtmlSnippet",
        noChildren: true,

        // transform the current form based on the configuration of this container
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentContainerLayout.contents) {
                opt.currentContainerParent.append(
                    $("<span/>", { "class": "speasyforms-htmlsnippet" }).html(opt.currentContainerLayout.contents));
            }
            return [];
        },

        // second stage transform, this is called after visibility rules and adapters are applied
        postTransform: function () { },

        // an opportunity to do validation tasks prior to committing an item
        preSaveItem: function () { return true; },

        // TBD need to update from here down for new design
        // draw the container in the properties pane of the settings page from the JSON
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            var div = $("<div/>", { "class": "speasyforms-nestedsortable-content ui-sortable-handle" });
            var span = $("<span/>", { "class": "speasyforms-htmlsnippet" });
            span.html(opt.currentContainerLayout.contents.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
            div.append(span);

            var textarea = $("<textarea/>", { "class": "speasyforms-htmlsnippet", "style": "display:none" });
            textarea.val(opt.currentContainerLayout.contents);
            div.append(textarea);

            // put contents in a text area show the contents stripping out any scripts
            opt.currentContainer.append(div);

            return [];
        },

        // convert whatever is in the properties pane back into a JSOM configuration
        toLayout: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {
                name: $(opt.container).attr("data-containername"),
                containerType: $(opt.container).attr("data-containertype"),
                index: $(opt.container).attr("data-containerindex"),
                contents: $(opt.container).find("textarea.speasyforms-htmlsnippet").val()
            };
            return result;
        },

        // launch a dialog to configue this container on the settings page 
        settings: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            if (!opt.currentContainerLayout) {
                $("#snippetContents").val("");
            }
            else {
                $("#snippetContents").val(opt.currentContainerLayout.contents);
            }

            if ($("#spEasyFormsContainerDialogs").find("#configureSnippetDialog").length === 0) {
                $("#spEasyFormsContainerDialogs").append(
                    "<div id='configureSnippetDialog' class='speasyforms-dialogdiv' title='HTML Snippet Container'>" +
                    "<div style='margin-bottom:10px'>Name: <input name='snippetName' id='snippetName' type='text'></input></div>" +
                    "<textarea  id='snippetContents' rows='15' cols='80'>" +
                    (opt.currentContainerLayout ? opt.currentContainerLayout.contents : '') +
                    "</textarea>" +
                    "<span style='display:none' id='snippetContainerId'></span>" +
                    "</div>");
            }

            var span;
            var configureSnippetOpts = {
                width: 830,
                modal: true,
                open: function () {
                    htmlSnippet.initRTE();
                },
                buttons: {
                    "Ok": function () {
                        var containerIndex = $("#snippetContainerId").text();
                        if (containerIndex.length > 0) {
                            var container = $("li.speasyforms-nestedsortable-container[data-containerindex='" + containerIndex + "']");
                            span = container.find("span.speasyforms-htmlsnippet");
                            var contents = $("#snippetContents").val();
                            span.html(contents.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
                            container.find("textarea.speasyforms-htmlsnippet").val(contents);
                            var name = $("#snippetName").val();
                            if (name.length > 0) {
                                container.attr("data-containername", name);
                                container.find(".speasyforms-itemtitle").text(name);
                                if (name !== container.attr("data-containertype")) {
                                    container.find(".speasyforms-itemtype").text("[HtmlSnippet]");
                                }
                            }
                        }
                        else {
                            opt.currentContainerParent = $(".speasyforms-panel ol.speasyforms-nestedsortable");
                            opt.currentContainerLayout = {
                                name: ($("#snippetName").val().length > 0 ? $("#snippetName").val() : "HtmlSnippet"),
                                containerType: "HtmlSnippet",
                                contents: $("#snippetContents").val()
                            };
                            opt.impl = htmlSnippet;
                            opt.currentContainer = containerCollection.appendContainer(opt);
                            opt.currentContainerLayout = opt.currentContainer.attr("data-containerindex");

                            var div = $("<div/>", { "class": "speasyforms-nestedsortable-content ui-sortable-handle" });
                            span = $("<span/>", { "class": "speasyforms-htmlsnippet" });
                            span.html($("#snippetContents").val().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
                            div.append(span);

                            var textarea = $("<textarea/>", { "class": "speasyforms-htmlsnippet", "style": "display:none" });
                            textarea.val($("#snippetContents").val());
                            div.append(textarea);

                            // put contents in a text area show the contents stripping out any scripts
                            opt.currentContainer.append(div);

                        }
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        opt.refresh = $.spEasyForms.refresh.form;
                        containerCollection.toEditor(opt);
                        $("#configureSnippetDialog").dialog("close");
                        return false;
                    },
                    "Cancel": function () {
                        $("#configureSnippetDialog").dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                resizable: false
            };
            $("#configureSnippetDialog").dialog(configureSnippetOpts);

            if (opt.currentContainerLayout) {
                $("#snippetContainerId").text(opt.currentContainerLayout.index);
                $("#snippetName").val(opt.currentContainerLayout.name);
            }
            else {
                $("#snippetContainerId").text("");
                $("#snippetName").val("");
            }

            $("#configureSnippetDialog").dialog("open");
            $("#snippetContents").hide();
            $("div[buttonname='source']").css({ "background-color": "transparent" });
            var frame = $("#configureSnippetDialog").find("iframe")[0];
            if (opt.currentConfig.jQueryUITheme) {
                opt.source = opt.currentConfig.jQueryUITheme;
                $("head", frame.contentWindow.document).append(
                    '<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');
            }
            else {
                opt.source = opt.jQueryUITheme;
                $("head", frame.contentWindow.document).append(
                    '<link rel="stylesheet" type="text/css" href="' + $.spEasyForms.replaceVariables(opt) + '">');
            }
        },

        // initialize the text area in the dialog with cleditor
        initRTE: function () {
            $("#snippetContents").cleditor({
                width: 800,
                height: 200,
                controls:
                    "font size style | " +
                    "bold italic underline strikethrough subscript superscript | " +
                    "alignleft center alignright | " +
                    "numbering bullets outdent indent | " +
                    "color highlight backgroundcolor | " +
                    "rule image link unlink | " +
                    "cut copy paste pastetext | " +
                    "ltr rtl print source",
                fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
                    "Georgia,Impact,Sans Serif,Serif,Tahoma,Times New Roman,Trebuchet MS,Verdana",
                useCSS: true,
                bodyStyle: "font-face: Times New Roman; margin: 1px; cursor:text"
            });
            $("#configureSnippetDialog").css("overflow", "hidden");
            var ed = $('#configureSnippetDialog').find("textarea").cleditor();
            if (ed.length > 0) {
                ed[0].refresh(ed);
            }
            $(".cleditorToolbar").height(25);
        }
    };
    var htmlSnippet = $.spEasyForms.containerCollection.containerImplementations.htmlSnippet;

})(typeof(spefjQuery) === 'undefined' ? null : spefjQuery);
///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/visibilityRuleCollection.js
/*
 * SPEasyForms.visibilityRuleCollection - object to hold and manage all field visibility rules.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var utils = $.spEasyForms.utilities;

    ////////////////////////////////////////////////////////////////////////////
    // Enforcer of field visibility rules.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.visibilityRuleCollection = {
        initialized: false,
        setTimeoutCalled: false,
        siteGroups: [],

        /*********************************************************************
        * Each method implements a comparison operator for a conditional expression.
        *********************************************************************/
        comparisonOperators: {
            equals: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) === (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) === Number(test);
                }
                return (value.toLowerCase() === test.toLowerCase());
            },
            matches: function (value, test) {
                var regex = new RegExp(test, "i");
                return regex.test(value);
            },
            notMatches: function (value, test) {
                var regex = new RegExp(test, "i");
                return !regex.test(value);
            },
            greaterThan: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) > (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) > Number(test);
                }
                return (value > test);
            },
            greaterThanOrEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) >= (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) >= Number(test);
                }
                return (value >= test);
            },
            lessThan: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) < (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) < Number(test);
                }
                return (value < test);
            },
            lessThanOrEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) <= (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) <= Number(test);
                }
                return (value <= test);
            },
            notEqual: function (value, test) {
                if (utils.isDate(value) && utils.isDate(test)) {
                    return (new Date(value)) > (new Date(test));
                }
                if (/^[0-9]*.?[0-9]*$/.test(value) && /^[0-9]*.?[0-9]*$/.test(test)) {
                    return Number(value) !== Number(test);
                }
                return (value !== test);
            }
        },

        /*********************************************************************
        * Each method implements a state transformation for a field.
        *********************************************************************/
        stateHandlers: {
            hidden: function (options) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var row = opt.row;
                if (row.row.attr("data-visibilityhidden") !== "true") {
                    row.row.attr("data-visibilityhidden", "true").hide();
                }
            },
            readOnly: function (options) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var row = opt.row;
                var formType = visibilityRuleCollection.getFormType(opt);
                if (formType !== "display") {
                    var value = $.spEasyForms.sharePointFieldRows.value(opt);
                    if (!value && !visibilityRuleCollection.setTimeoutCalled) {
                        if (!opt.noRecurse) {
                            visibilityRuleCollection.setTimeoutCalled = true;
                            setTimeout(function () {
                                var o = $.extend({}, $.spEasyForms.defauts, opt);
                                o.row = row;
                                var v = $.spEasyForms.sharePointFieldRows.value(o);
                                $("#readOnly" + row.internalName).html(v);
                                opt.noRecurse = true;
                                visibilityRuleCollection.transform(opt);
                                $.spEasyForms.adapterCollection.transform(opt);
                                $.spEasyForms.containerCollection.postTransform(opt);
                            }, 1000);
                        }
                        value = "&nbsp;";
                    }
                    var html;
                    if (row.row.attr("data-headerontop") === "true") {
                        html = $("<tr/>", { "data-visibilityadded": "true" });
                        html.append($("<td/>", { "valign": "top", "class": "ms-formbody" }));
                        html.children("td").append("<div/>");
                        html.find("div").html("<nobr class='speasyforms-columnheader'>" + row.displayName + "</nobr>");
                        html.children("td").append((value.length > 0 ? value : "&nbsp;"));
                    }
                    else {
                        html = '<tr data-visibilityadded="true">' +
                            '<td valign="top" width="350px" ' +
                            'class="ms-formlabel">' +
                            '<div><nobr class="speasyforms-columnheader">' +
                            row.displayName +
                            '</nobr></td><td class="ms-formbody">' +
                            '<span id="readOnly' + row.internalName + '">' + value + '</span></td></tr>';
                        if (row.row.find("td.ms-formbody h3.ms-standardheader").length > 0) {
                            html = '<tr data-visibilityadded="true">' +
                                '<td valign="top" ' +
                                'width="350px" class="ms-formbody">' +
                                '<h3 class="ms-standardheader"><nobr>' +
                                row.displayName + '</nobr></h3>' +
                                value + '</td></tr>';
                        }
                    }
                    if (row.row.attr("data-visibilityhidden") !== "true") {
                        row.row.attr("data-visibilityhidden", "true").hide();
                    }
                    if (row.row.next().attr("data-visibilityadded") !== "true") {
                        $(html).insertAfter(row.row);
                    }
                }
            },
            editable: function () { /*do nothing*/ },
            highlightRed: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "LightPink");
            },
            highlightYellow: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "Yellow");
            },
            highlightGreen: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "SpringGreen");
            },
            highlightBlue: function (options) {
                $.spEasyForms.utilities.highlight(options.row.row, "Aqua");
            }
        },

        /*********************************************************************
        * Undo anything that was done by a previous invocation of transform. i.e.
        * show anything marked data-visibilityhidden, remove anything marked
        * data-visibilityadded, and remove any classes in data-visibilityclassadded.
        *********************************************************************/
        scrubCollection: function (collection) {
            collection.each(function (idx, current) {
                if ($(current).attr("data-visibilityadded") === "true") {
                    $(current).remove();
                }
                else {
                    if ($(current).next().attr("data-visibilityadded") === "true") {
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
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.currentConfig && opt.currentConfig.visibility && opt.currentConfig.visibility.def &&
                Object.keys(opt.currentConfig.visibility.def).length > 0) {
                $.each($.spEasyForms.containerCollection.rows, function (idx, row) {
                    opt.row = row;
                    if (row.internalName in opt.currentConfig.visibility.def) {
                        var ruleHandled = false;
                        $.each(opt.currentConfig.visibility.def[row.internalName], function (index, rule) {
                            opt.rule = rule;
                            if (!ruleHandled) {
                                var formMatch = visibilityRuleCollection.checkForm(opt);
                                var appliesMatch = visibilityRuleCollection.checkAppliesTo(opt);
                                var conditionalMatch = visibilityRuleCollection.checkConditionals(opt);
                                if (formMatch && appliesMatch && conditionalMatch) {
                                    var stateHandler = $.spEasyForms.utilities.jsCase(rule.state);
                                    if (stateHandler in visibilityRuleCollection.stateHandlers) {
                                        visibilityRuleCollection.scrubCollection(opt.row.row);
                                        visibilityRuleCollection.stateHandlers[stateHandler](opt);
                                        ruleHandled = true;
                                    }
                                }
                            }
                            if (rule.conditions) {
                                $.each(rule.conditions, function (idx, condition) {
                                    var tr = $.spEasyForms.containerCollection.rows[condition.name];
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
                                    tr.row.find("input").addClass("speasyforms-visibilitychangelistener");
                                    tr.row.find("select").addClass("speasyforms-visibilitychangelistener");
                                    tr.row.find("textarea").addClass("speasyforms-visibilitychangelistener");
                                });
                            }
                        });
                        if (!ruleHandled) {
                            visibilityRuleCollection.scrubCollection(opt.row.row);
                        }
                    }
                });
                var body = $("#s4-bodyContainer");
                if (body.attr("data-visibilitychangelistener") !== "true") {
                    body.attr("data-visibilitychangelistener", "true");
                    body.on("change", ".speasyforms-visibilitychangelistener", function () {
                        visibilityRuleCollection.transform(opt);
                        $.spEasyForms.adapterCollection.transform(opt);
                        $.spEasyForms.containerCollection.postTransform(opt);
                    });
                }
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
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!this.initialized) {
                this.wireDialogEvents(opt);
            }
            this.drawRuleTableTab(opt);
            this.initialized = true;

            if (!opt.verbose) {
                $("#staticVisibilityRules .speasyforms-fieldmissing").hide();
            }

            if ($("#staticVisibilityRules .speasyforms-fieldmissing").length > 0 && opt.verbose) {
                $("#staticVisibilityRules .speasyforms-fieldmissing").addClass("ui-state-error");
            }
        },

        /*********************************************************************
        * Convert the editor back into a set of conditional visibility rules.
        *
        * @param {object} options - {
        *     // see the definition of defaults for options
        * }
        *********************************************************************/
        toConfig: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var rules = [];
            var fieldName = $("#conditionalVisibilityField").val();
            $("#conditionalVisibilityRules tr:not(:first)").each(function (idx, tr) {
                var tds = $(tr).find("td");
                var appliesTo = tds[1].innerHTML !== "Everyone" ? tds[1].innerHTML : "";
                var rule = {
                    state: tds[0].innerHTML,
                    appliesTo: appliesTo,
                    forms: tds[2].innerHTML,
                    conditions: []
                };
                $.each($(tds[3]).find("div.speasyforms-conditiondisplay"), function (idx, div) {
                    var conditionArray = $(div).text().split(";");
                    if (conditionArray.length >= 2) {
                        var condition = {
                            name: conditionArray[0],
                            type: conditionArray[1],
                            value: conditionArray.length === 3 ? conditionArray[2] : ""
                        };
                        if (condition.name) {
                            rule.conditions.push(condition);
                        }
                    }
                });
                rules.push(rule);
            });
            var config = $.spEasyForms.configManager.get(opt);
            config.visibility.def[fieldName] = rules;
            return config;
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
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
        * the rules table for the conditional visibility dialog.
        *********************************************************************/
        drawRuleTable: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#conditionalVisibilityRules").html("");
            if (opt.currentConfig.visibility.def[opt.fieldName].length === 0) {
                $("#conditionalVisibilityRules").html(
                    "There are currently no rules for this field. Click " +
                    "the plus sign to add one.");
            } else {
                var table = $("#spEasyFormsTemplates .speasyforms-visibilityrulestabletemplate").
                    clone().
                    attr("id", "conditionalVisibilityRulesTable");
                $("#conditionalVisibilityRules").append(table);

                $.each(opt.currentConfig.visibility.def[opt.fieldName], function (idx, rule) {
                    var tableRow = $("#spEasyFormsTemplates .speasyforms-visibilityrulesrowtemplate").clone();

                    var conditions = "";
                    if (rule.conditions) {
                        $.each(rule.conditions, function (i, condition) {
                            conditions += "<div class='speasyforms-conditiondisplay'>" +
                                condition.name + ";" + condition.type + ";" +
                                condition.value + "</div>";
                        });
                    } else {
                        conditions = "&nbsp;";
                    }

                    tableRow.find(".speasyforms-state").text(rule.state);
                    tableRow.find(".speasyforms-appliesto").text(rule.appliesTo);
                    tableRow.find(".speasyforms-forms").text(rule.forms);
                    tableRow.find(".speasyforms-when").html(conditions);
                    tableRow.find("button[title='Edit Rule']").attr("id", "addVisililityRuleButton" + idx);
                    tableRow.find("button[title='Delete Rule']").attr("id", "delVisililityRuleButton" + idx);

                    table.append(tableRow);
                });
                this.wireVisibilityRulesTable(opt);
            }
        },

        /*********************************************************************
        * Draw a the table with all rule for the conditional visibility tab of 
        * the main editor.
        *********************************************************************/
        drawRuleTableTab: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("#staticVisibilityRules").remove();
            var table = $("#spEasyFormsTemplates .speasyforms-staticrulestabletemplate").
                clone().
                attr("id", "staticVisibilityRules");
            if (Object.keys(opt.currentConfig.visibility.def).length === 0) {
                table.append("<td class='ui-widget-content ui-corner-all nobr' colspan='5'>There are no conditional visibility rules for the current form.</td>");
            }
            else {
                $.each(Object.keys(opt.currentConfig.visibility.def).sort(), function (idx, key) {
                    $.each(opt.currentConfig.visibility.def[key], function (i, rule) {
                        opt.index = idx + "_" + i;

                        opt.rowInfo = $.spEasyForms.containerCollection.rows[key];
                        if (!opt.rowInfo) {
                            $.spEasyForms.containerCollection.rows[key] = {
                                displayName: key,
                                internalName: key,
                                spFieldType: key,
                                value: "",
                                row: $("<tr><td class='ms-formlabel'><h3 class='ms-standardheader'></h3></td><td class='ms-formbody'></td></tr>"),
                                fieldMissing: true
                            };
                            opt.rowInfo = $.spEasyForms.containerCollection.rows[key];
                        }

                        var tr = $("#spEasyFormsTemplates .speasyforms-staticrulesrowtemplate").
                            clone().
                            attr("id", "visibilityRule" + opt.index);

                        if ($.spEasyForms.containerCollection.rows[key].fieldMissing) {
                            tr.addClass("speasyforms-fieldmissing").addClass("ui-state-error");
                        }
                        var conditions = "";
                        if (rule.conditions && rule.conditions.length > 0) {
                            $.each(rule.conditions, function (i, condition) {
                                conditions += "<div class='speasyforms-conditiondisplay'>" +
                                    condition.name + ";" + condition.type + ";" +
                                    condition.value + "</div>";
                                if (!$.spEasyForms.containerCollection.rows[condition.name] ||
                                    $.spEasyForms.containerCollection.rows[condition.name].fieldMissing) {
                                    tr.addClass("speasyforms-fieldmissing").addClass("ui-state-error");
                                }
                            });
                        }

                        tr.find(".speasyforms-displayname").text(opt.rowInfo.displayName);
                        tr.find(".speasyforms-internalname").text(opt.rowInfo.internalName);
                        tr.find(".speasyforms-state").text(rule.state);
                        tr.find(".speasyforms-appliesto").text(rule.appliesTo.length > 0 ? rule.appliesTo : "Everyone");
                        tr.find(".speasyforms-forms").text(rule.forms);
                        tr.find(".speasyforms-when").html(conditions);

                        if (opt.rowInfo.fieldMissing) {
                            tr.find("td").addClass("speasyforms-fieldmissing");
                        }

                        table.append(tr);
                    });
                });
            }
            $("#tabs-min-visibility").append(table);
        },

        /*********************************************************************
        * Wire up the buttons for a rules table (only applicable to the conditional
        * visibility dialog since the rules tables on the main editor are static)
        *********************************************************************/
        wireVisibilityRulesTable: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            $("[id^='delVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function () {
                opt.index = this.id.replace("delVisililityRuleButton", "");
                opt.fieldName = $("#conditionalVisibilityField").val();
                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                opt.currentConfig.visibility.def[opt.fieldName].splice(opt.index, 1);
                $.spEasyForms.configManager.set(opt);
                visibilityRuleCollection.drawRuleTable(opt);
                opt.refresh = $.spEasyForms.refresh.visibility;
                $.spEasyForms.containerCollection.toEditor(opt);
            });

            $("[id^='addVisililityRuleButton']").button({
                icons: {
                    primary: "ui-icon-gear"
                },
                text: false
            }).click(function () {
                visibilityRuleCollection.clearRuleDialog(opt);
                opt.index = this.id.replace("addVisililityRuleButton", "");
                $("#visibilityRuleIndex").val(opt.index);
                opt.fieldName = $("#conditionalVisibilityField").val();
                $("#addVisibilityRuleField").val(opt.fieldName);
                opt.currentConfig = $.spEasyForms.configManager.get(opt);
                var rule = opt.currentConfig.visibility.def[opt.fieldName][opt.index];
                $("#addVisibilityRuleState").val(rule.state);
                $.each(rule.appliesTo.split(';'), function (idx, entity) {
                    if (entity === "AUTHOR") {
                        $("#addVisibilityRuleApplyToAuthor")[0].checked = true;
                    } else if (entity.length > 0) {
                        var span = $("<span>").addClass("speasyforms-entity").
                        attr('title', entity).text(entity);
                        $("<a>").addClass("speasyforms-remove").attr({
                            "href": "#",
                            "title": "Remove " + entity
                        }).
                        text("x").appendTo(span);
                        $("#spEasyFormsEntityPicker").prepend(span);
                        $("#addVisibilityRuleApplyTo").val("").css("top", 2);
                        visibilityRuleCollection.siteGroups.splice($.inArray(entity,
                            visibilityRuleCollection.siteGroups), 1);
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
                    $.each(rule.conditions, function (index, condition) {
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

            // make the visibility rules sortable
            $("tbody.speasyforms-sortablerules").sortable({
                connectWith: ".speasyforms-rulestable",
                items: "> tr:not(:first)",
                helper: "clone",
                placeholder: "speasyforms-placeholder",
                zIndex: 990,
                update: function (event) {
                    if (!event.handled) {
                        opt.currentConfig = visibilityRuleCollection.toConfig(opt);
                        $.spEasyForms.configManager.set(opt);
                        visibilityRuleCollection.drawRuleTable(opt);
                        opt.refresh = $.spEasyForms.refresh.visibility;
                        $.spEasyForms.containerCollection.toEditor(opt);
                        event.handled = true;
                    }
                }
            });
        },

        /*********************************************************************
        * Wire up the conditional visibility dialog boxes.
        *********************************************************************/
        wireDialogEvents: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            // wire the conditional visilibity dialog
            var conditionalVisibilityOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        $('#conditonalVisibilityRulesDialog').dialog("close");
                        return false;
                    }
                },
                autoOpen: false,
                width: 800
            };
            $('#conditonalVisibilityRulesDialog').dialog(conditionalVisibilityOpts);

            // wire the add/edit visibility rule dialog
            var addVisibilityRuleOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        opt.state = $('#addVisibilityRuleState').val();
                        if (opt.state === '') {
                            $('#addVisibilityRuleStateError').text(
                                "You must select a value for state!");
                        } else {
                            opt.currentConfig = $.spEasyForms.configManager.get(opt);
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
                            $.spEasyForms.configManager.set(opt);
                            $('#addVisibilityRuleDialog').dialog("close");
                            $("#conditonalVisibilityRulesDialog").dialog("open");
                            visibilityRuleCollection.drawRuleTable(opt);
                            opt.refresh = $.spEasyForms.refresh.visibility;
                            $.spEasyForms.containerCollection.toEditor(opt);
                        }
                        return false;
                    },
                    "Cancel": function () {
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
            }).click(function () {
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
            }).click(function () {
                $(".speasyforms-condition:hidden").first().show();
                if ($(".speasyforms-condition:hidden").length === 0) {
                    $("#spEasyFormsAddConditionalBtn").hide();
                }
                return false;
            });

            // wire the entity picker on the add/edit rule dialog
            $("input.speasyforms-entitypicker").autocomplete({
                source: this.siteGroups.sort(),

                select: function (e, ui) {
                    var group = ui.item.value;
                    var span = $("<span>").addClass("speasyforms-entity").
                    attr('title', group).text(group);
                    $("<a>").addClass("speasyforms-remove").attr({
                        "href": "#",
                        "title": "Remove " + group
                    }).
                    text("x").appendTo(span);
                    span.insertBefore(this);
                    $(this).val("").css("top", 2);
                    visibilityRuleCollection.siteGroups.splice(
                        $.inArray(group, visibilityRuleCollection.siteGroups), 1);
                    $(this).autocomplete(
                        "option", "source", visibilityRuleCollection.siteGroups.sort());
                    return false;
                }
            });
            $(".speasyforms-entitypicker").click(function () {
                $(this).find("input").focus();
            });
            $("#spEasyFormsEntityPicker").on("click", ".speasyforms-remove", function () {
                visibilityRuleCollection.siteGroups.push($(this).parent().attr("title"));
                $(this).closest("div").find("input").
                autocomplete("option", "source", visibilityRuleCollection.siteGroups.sort()).
                focus();
                $(this).parent().remove();
            });
        },

        /*********************************************************************
        * Get the current visibility rules.
        *
        * @return {object} - the current visibility rules.
        *********************************************************************/
        getVisibility: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
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
        * @return {object} - the new rule.
        *********************************************************************/
        getRule: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = {};
            result.state = opt.state;
            result.forms = "";
            $(".speasyforms-formcb").each(function (idx, cb) {
                if (cb.checked) {
                    if (result.forms.length > 0) {
                        result.forms += ";";
                    }
                    result.forms += this.id.replace("addVisibilityRule", "").replace("Form", "");
                }
            });
            result.appliesTo = "";
            $('#spEasyFormsEntityPicker .speasyforms-entity').each(function (idx, span) {
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
            conditions.each(function () {
                if ($(this).val().length >= 0 && $(this).prev().prev().val().length > 0) {
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
        *********************************************************************/
        clearRuleDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
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
            var siteGroups = $.spEasyForms.sharePointContext.getSiteGroups(opt);
            $.each(siteGroups, function (idx, group) {
                if ($.inArray(group.name, visibilityRuleCollection.siteGroups) < 0) {
                    visibilityRuleCollection.siteGroups.push(group.name);
                }
            });
        },

        /*********************************************************************
        * Get the current form type. This function looks for the word new, edit,
        * or display in the current page name (case insensative.
        *
        * @return {string} - new, edit, display, or "".
        *********************************************************************/
        getFormType: function () {
            var result = "";
            var page = window.location.pathname;
            page = page.substring(page.lastIndexOf("/") + 1).toLowerCase();
            if (page === "start.aspx") {
                page = window.location.href.substring(
                    window.location.href.indexOf("#") + 1);
                page = page.substring(page.lastIndexOf("/") + 1,
                    page.indexOf("?")).toLowerCase();
            }
            if (page.indexOf("new") >= 0) {
                result = "new";
            } else if (page.indexOf("edit") >= 0 &&
                page.toLocaleLowerCase().indexOf("listedit.aspx") &&
                page.toLocaleLowerCase().indexOf("fldnew.aspx") &&
                page.toLocaleLowerCase().indexOf("fldedit.aspx")
                ) {
                result = "edit";
            } else if (page.indexOf("disp") >= 0 || page.indexOf("display") >= 0) {
                result = "display";
            }
            return result;
        },

        /*********************************************************************
        * Check if a rule passes based solely on which form we're on.
        *********************************************************************/
        checkForm: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var formType = visibilityRuleCollection.getFormType(opt);
            var ruleForms = $(opt.rule.forms.split(';')).map(function () {
                return this.toLowerCase();
            });
            return $.inArray(formType, ruleForms) >= 0;
        },

        /*********************************************************************
        * Check if a rule passes based solely on who it applies to.
        *********************************************************************/
        checkAppliesTo: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var appliesMatch = false;
            if (opt.rule.appliesTo.length === 0) {
                appliesMatch = true;
            } else {
                var appliesToGroups = opt.rule.appliesTo.split(';');
                var formType = visibilityRuleCollection.getFormType(opt);
                if (appliesToGroups[0] === "AUTHOR" && formType === "new") {
                    appliesMatch = true;
                } else {
                    if (appliesToGroups[0] === "AUTHOR") {
                        var authorHref = $("span:contains('Created  at')").
                            find("a.ms-subtleLink").attr("href");
                        if (!authorHref) {
                            authorHref = $("td.ms-descriptiontext span a").attr("href");
                        }
                        if (authorHref) {
                            var authorId = parseInt(
                                authorHref.substring(authorHref.indexOf("ID=") + 3), 10);
                            if (authorId === opt.currentContext.userId) {
                                appliesMatch = true;
                            }
                        }
                    }
                    if (!appliesMatch) {
                        var userGroups = $.spEasyForms.sharePointContext.getUserGroups(opt);
                        $.each(userGroups, function (i, group) {
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

        /*********************************************************************
        * Check if a rule passes based solely on its conditional expressions.
        *********************************************************************/
        checkConditionals: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = false;
            if (!opt.rule.conditions || opt.rule.conditions.length === 0) {
                result = true;
            } else {
                result = true;
                $.each(opt.rule.conditions, function (idx, condition) {
                    opt.row = $.spEasyForms.containerCollection.rows[condition.name];
                    if (opt.row) {
                        var currentValue = $.spEasyForms.sharePointFieldRows.value(opt);
                        var type = $.spEasyForms.utilities.jsCase(condition.type);
                        var comparisonOperator = $.spEasyForms.visibilityRuleCollection.comparisonOperators[type];
                        opt.condition = condition;
                        var expandedValue = $.spEasyForms.visibilityRuleCollection.expandRuleValue(opt);
                        result = comparisonOperator(currentValue, expandedValue);
                        if (result === false)
                            return false; // return from $.each
                    }
                    else {
                        result = false;
                        return false; // return from $.each
                    }
                });
            }
            return result;
        },

        /*********************************************************************
        * Search and substitue for variables in the conditional value. Possible
        * variables include:
        * 
        * [CurrentUser] - epands to ctx.userId
        * [CurrentUserId] - epands to ctx.userId
        * [CurrentUserLogin] - epands to ctx.userInformation.userName
        * [CurrentUserEmail] - epands to ctx.userInformation.eMail
        * [Today] - expands to the current date
        * [Today[+-]X] - expands to the current date plus or minus X days
        * [Now] - expands to the current datetime
        * [Now[+-]X] - expands to the current datetime plus or minus X minutes
        *********************************************************************/
        expandRuleValue: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var expandedValue = opt.condition.value;
            // expand current user variables
            if (opt.condition.value.indexOf("[CurrentUser") >= 0) {
                var ctx = $.spEasyForms.sharePointContext.get(opt);
                expandedValue = expandedValue.replace(/\[CurrentUser\]/g, "userdisp.aspx\\?ID=" + ctx.userId + "[$&]");
                expandedValue = expandedValue.replace(/\[CurrentUserId\]/g, ctx.userId);
                expandedValue = expandedValue.replace(/\[CurrentUserLogin\]/g, ctx.userInformation.userName);
                expandedValue = expandedValue.replace(/\[CurrentUserEmail\]/g, ctx.userInformation.eMail);
            }
            // expand [Today] variables
            var date = new Date();
            var parts;
            if (opt.condition.value.indexOf("[Today") >= 0) {
                expandedValue = expandedValue.replace(/\[Today\]/g, $.datepicker.formatDate("mm-dd-yy", date));
                parts = expandedValue.match(/(\[Today[+-][0-9]*\])/g);
                if (parts) {
                    $.each($(parts), function (idx, part) {
                        try {
                            var i = Number(part.match(/\[Today[+-]([0-9]*)\]/)[1]);
                            var newDate = new Date();
                            if (part.indexOf("+") >= 0) {
                                newDate.setTime(date.getTime() + i * 86400000);
                            }
                            else {
                                newDate.setTime(date.getTime() - i * 86400000);
                            }
                            expandedValue = expandedValue.replace(part, $.datepicker.formatDate("mm/dd/yy", newDate));
                        } catch (e) { }
                    });
                }
            }
            // expand [Now] variables
            if (opt.condition.value.indexOf("[Now") >= 0) {
                expandedValue = expandedValue.replace(/\[Now\]/g,
                    $.datepicker.formatDate("mm-dd-yy", date) + " " + date.getHours() + ":" + date.getMinutes());
                parts = expandedValue.match(/(\[Now[+-][0-9]*\])/g);
                if (parts) {
                    $.each($(parts), function (idx, part) {
                        try {
                            var i = Number(part.match(/\[Now[+-]([0-9]*)\]/)[1]);
                            var newDate = new Date();
                            if (part.indexOf("+") >= 0) {
                                newDate.setTime(date.getTime() + i * 60000);
                            } else {
                                newDate.setTime(date.getTime() - i * 60000);
                            }
                            expandedValue = expandedValue.replace(part,
                                $.datepicker.formatDate("mm/dd/yy", newDate) + " " + newDate.getHours() + ":" + newDate.getMinutes());
                        } catch (e) { }
                    });
                }
            }
            return expandedValue;
        }
    };
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adapterCollection.js
/*
 * SPEasyForms.adapterCollection - collection of field control adapters.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    ////////////////////////////////////////////////////////////////////////////
    // Collection of field control adapters.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.adapterCollection = {
        adapterImplementations: {},

        supportedTypes: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            if (opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                $.each(Object.keys(adapterCollection.adapterImplementations), function (idx, impl) {
                    if (impl in adapterCollection.adapterImplementations) {
                        result = result.concat(adapterCollection.adapterImplementations[impl].supportedTypes(opt));
                    }
                });
                result = $(result).filter(function (pos, item) {
                    return $.inArray(item, result) === pos;
                });
            }
            return result;
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (!$.spEasyForms.isSettingsPage(opt)) {
                if (opt.currentConfig && opt.currentConfig.adapters && opt.currentConfig.adapters.def) {
                    opt.adapters = opt.currentConfig.adapters.def;
                    $.each(opt.adapters, function (idx, adapter) {
                        opt.adapter = adapter;
                        if (opt.adapter.type in adapterCollection.adapterImplementations) {
                            adapterCollection.adapterImplementations[opt.adapter.type].transform(opt);
                        }
                    });
                }
            }
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.adapters = opt.currentConfig.adapters.def;

            $.each(Object.keys(adapterCollection.adapterImplementations), function (idx, impl) {
                if (impl in adapterCollection.adapterImplementations) {
                    adapterCollection.adapterImplementations[impl].toEditor(opt);
                }
            });

            $("#spEasyFormsAdapterTable tr.speasyforms-adapter-static").remove();
            $.each(Object.keys(opt.adapters).sort(this.compareAdapters), function (idx, adapterField) {
                opt.adapter = opt.adapters[adapterField];
                opt.fieldName = adapterField;
                if (opt.adapter.type in adapterCollection.adapterImplementations) {
                    adapterCollection.drawAdapter(opt);
                }
            });
            if ($("#spEasyFormsAdapterTable tr.speasyforms-adapter-static").length === 0) {
                $("#spEasyFormsAdapterTable").append("<tr class='speasyforms-adapter-static'>" +
                    "<td class='ui-widget-content ui-corner-all nobr' colspan='5'>" +
                    "There are no adpaters configured for the current form.</td></tr>");
            }

            $(".speasyforms-deleteadapter").button({
                icons: {
                    primary: "ui-icon-closethick"
                },
                text: false
            }).click(function () {
                var internalName = $($(this).closest("tr").find("td")[1]).text();
                opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                delete opt.currentConfig.adapters.def[internalName];
                $.spEasyForms.configManager.set(opt);
                opt.refresh = $.spEasyForms.refresh.adapters;
                $.spEasyForms.containerCollection.toEditor(opt);
                return false;
            });
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#adapterTypeDialog").dialog({
                modal: true,
                autoOpen: false,
                width: 400,
                buttons: {
                    "Ok": function () {
                        $("#adapterTypeDialog").dialog("close");
                        opt.adapterType = $("#adapterType option:selected").text();
                        $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                            if (impl.type === opt.adapterType) {
                                opt.adapterImpl = impl;
                            }
                        });
                        if (opt.adapterImpl) {
                            opt.adapterImpl.launchDialog(opt);
                        }
                    },
                    "Cancel": function () {
                        $("#adapterTypeDialog").dialog("close");
                    }
                }
            });

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
                $.each(adapterCollection.adapterImplementations, function (idx, impl) {
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
                    $.each(opt.typeAdapters, function (idx, current) {
                        $("#adapterType").append("<option value='" + idx + "'>" + current.impl.type + "</option>");
                    });
                    $("#adapterTypeDialog").dialog("open");
                }
            }
            $(".tabs-min").hide();
            $("#tabs-min-adapters").show();
        },

        getSupportedTypes: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = [];
            $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                if ($.inArray(opt.spFieldType, impl.supportedTypes(opt)) >= 0) {
                    result.push(impl.type);
                }
            });
            return result;
        },

        preSaveItem: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var result = true;
            $.each(adapterCollection.adapterImplementations, function (idx, impl) {
                if (typeof (impl.preSaveItem) === "function") {
                    result = result && impl.preSaveItem(opt);
                }
            });
            return result;
        },

        drawAdapter: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var displayName = opt.fieldName;
            var config = "";

            $.each(Object.keys(opt.adapter).sort(), function (idx, key) {
                if (key !== "type" && key !== "columnNameInternal") {
                    if (config.length > 0) {
                        config += "<br />";
                    }
                    config += "<b>" + $.spEasyForms.utilities.titleCase(key) + "</b> = " + opt.adapter[key];
                }
            });
    
            var tableRow = $("#spEasyFormsTemplates .speasyforms-adapterrowtemplate").
                clone().
                attr("data-fieldname", opt.adapter.columnNameInternal);
            $("#spEasyFormsAdapterTable").append(tableRow);

            if ($.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal] &&
                !$.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].fieldMissing) {
                displayName = $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].displayName;
            }
            else {
                tableRow.addClass("speasyforms-fieldmissing").find("td").addClass("speasyforms-fieldmissing");
            }

            tableRow.find(".speasyforms-displayname").text(displayName);
            tableRow.find(".speasyforms-internalname").text(opt.adapter.columnNameInternal);
            tableRow.find(".speasyforms-adaptertype").text(opt.adapter.type);
            tableRow.find(".speasyforms-adapterconfig").html(config);
            tableRow.find("button.speasyforms-deleteadapter").attr("id", opt.adapter.columnNameInternal + "Delete");

            if (opt.verbose && tableRow.hasClass("speasyforms-fieldmissing")) {
                tableRow.find("td.speasyforms-adapter-static").addClass("ui-state-error");
            }
            else if (tableRow.hasClass("speasyforms-fieldmissing")) {
                tableRow.addClass("speasyforms-hidden").find("td").addClass("speasyforms-hidden");
            }
        },

        compareAdapters: function (a, b) {
            var listctx = $.spEasyForms.sharePointContext.getListContext();
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

        validateRequired: function (options) {
            var control = $("#" + options.id);
            control.parent().find(".speasyforms-error").remove();
            if (!control.val()) {
                var div = $("<div/>", { "class": "speasyforms-error" }).text("'" + options.displayName + "' is a required field!");
                control.parent().append(div);
            }
        }
    };
    var adapterCollection = $.spEasyForms.adapterCollection;

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adap.autocompleteAdapter.js
/*
 * SPEasyForms.adapterCollection.autocompleteAdapter - implementation of type ahead field control 
 * adapter for SPFieldText.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for autocomplete on text fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.autocompleteAdapter = {
        type: "Autocomplete",

        supportedTypes: function () {
            return ["SPFieldText"];
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.adapter.columnNameInternal in $.spEasyForms.containerCollection.rows) {
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
                            $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].row.find("input").autocomplete({
                                source: autocompleteData,
                                minLength: 2
                            });
                        }
                    }
                });
            }
        },

        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var autocompleteOpts = {
                modal: true,
                buttons: {
                    "Ok": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        adapterCollection.validateRequired({
                            id: "autocompleteFieldSelect",
                            displayName: "Lookup Field"
                        });
                        if ($("#autocompleteListSelect").val() && $("#autocompleteListSelect").val().length > 0) {
                            if ($("#AutocompleteDialog").find(".speasyforms-error").length === 0) {
                                var result = {
                                    type: "Autocomplete",
                                    sourceList: $("#autocompleteListSelect").val(),
                                    sourceListTitle: $("#autocompleteListSelect option:selected").text(),
                                    sourceField: $("#autocompleteFieldSelect").val(),
                                    columnNameInternal: $("#autocompleteChildSelect").val()
                                };
                                opt.adapters[result.columnNameInternal] = result;
                                $.spEasyForms.configManager.set(opt);
                                $('#autocompleteAdapterDialog').dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                        } else {
                            if ($("#autoCompleteHiddenFieldName").val() in opt.adapters) {
                                delete opt.adapters[$("#autoCompleteHiddenFieldName").val()];
                                $.spEasyForms.configManager.set(opt);
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
                            }
                            $('#autocompleteAdapterDialog').dialog("close");
                        }
                    },
                    "Cancel": function () {
                        $('#autocompleteAdapterDialog').dialog("close");
                        return false;
                    }
                },

                autoOpen: false,
                width: 600
            };
            $('#autocompleteAdapterDialog').dialog(autocompleteOpts);
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#autocompleteAdapterDialog").find(".speasyforms-error").remove();

            opt.adapter = undefined;
            if (opt.fieldName in opt.adapters) {
                opt.adapter = opt.adapters[opt.fieldName];
            }

            // initialize the lookup list
            $("#autocompleteListSelect").val("");
            $("#autocompleteListSelect option").remove();
            $("#autocompleteListSelect").append("<option></option>");
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
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
                opt.autocompleteContext = $.spEasyForms.sharePointContext.getListContext(opt);
                $("#autocompleteFieldSelect option").remove();
                $("#autocompleteFieldSelect").append("<option></option>");
                $.each(Object.keys(opt.autocompleteContext.fields), function (idx, field) {
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
            $.each(Object.keys(opt.currentListContext.fields), function (idx, field) {
                $("#autocompleteChildSelect").append("<option value='" +
                    opt.currentListContext.fields[field].internalName + "'>" +
                    opt.currentListContext.fields[field].displayName + "</option>");
            });
            $("#autocompleteChildSelect").val(opt.fieldName).attr("disabled", "disabled");
            $("#autoCompleteHiddenFieldName").val(opt.fieldName);
            if ($("#autocompleteChildSelect").val() !== $("#autoCompleteHiddenFieldName").val()) {
                $("#autocompleteChildSelect").append("<option value='" +
                    opt.fieldName + "'>" +
                    opt.fieldName + "</option>");
                $("#autocompleteChildSelect").val(opt.fieldName).attr("disabled", "disabled");
            }

            // add a change listener to reinitialize on change of the lookup list
            if ($("#autocompleteListSelect").attr("data-changelistener") !== "true") {
                $("#autocompleteListSelect").attr("data-changelistener", "true");
                $("#autocompleteListSelect").change(function () {
                    opt.listId = $("#autocompleteListSelect").val();
                    if (opt.listId) {
                        opt.autocompleteContext = $.spEasyForms.sharePointContext.getListContext(opt);
                        $("#autocompleteFieldSelect option").remove();
                        $("#autocompleteFieldSelect").append("<option></option>");
                        $.each(Object.keys(opt.autocompleteContext.fields), function (idx, field) {
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

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adap.cascadingLookupAdapter.js
/*
 * SPEasyForms.adapterCollection.cascadingLookupAdapter - implementaiton of a cascading lookup field adapter.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($, undefined) {

    var adapterCollection = $.spEasyForms.adapterCollection;

    ////////////////////////////////////////////////////////////////////////////
    // Field control adapter for configuring cascading lookup fields.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms.cascadingLookupAdapter = {
        type: "Cascading Lookup",

        supportedTypes: function () {
            return ["SPFieldLookup"];
        },

        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.adapter.parentColumnInternal in $.spEasyForms.containerCollection.rows && opt.adapter.columnNameInternal in $.spEasyForms.containerCollection.rows) {
                opt.adapter.parentColumn =
                    $.spEasyForms.containerCollection.rows[opt.adapter.parentColumnInternal].displayName;
                opt.adapter.childColumn =
                    $.spEasyForms.containerCollection.rows[opt.adapter.columnNameInternal].displayName;
                opt.adapter.listName = $.spEasyForms.sharePointContext.getCurrentListId(opt);
                opt.adapter.debug = $.spEasyForms.defaults.verbose;
                $().SPServices.SPCascadeDropdowns(opt.adapter);
            }
        },

        toEditor: function (options) {
            if (!this.initialized) {
                var opt = $.extend({}, $.spEasyForms.defaults, options);
                var adapterOpts = {
                    modal: true,
                    buttons: {
                        "Ok": function () {
                            opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                            opt.adapters = opt.currentConfig.adapters.def;
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
                                $.spEasyForms.configManager.set(opt);
                                $('#cascadingLookupAdapterDialog').dialog("close");
                                opt.refresh = $.spEasyForms.refresh.adapters;
                                $.spEasyForms.containerCollection.toEditor(opt);
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
                                    adapter.relationshipListTitle =
                                        $("#cascadingRelationshipListSelect option:selected").text();
                                    adapter.relationshipListParentColumn =
                                        $("#cascadingLookupRelationshipParentSelect").val();
                                    adapter.relationshipListChildColumn =
                                        $("#cascadingLookupRelationshipChildSelect").val();
                                    adapter.parentColumnInternal =
                                        $("#cascadingLookupParentSelect").val();
                                    adapter.columnNameInternal =
                                        $("#cascadingLookupChildSelect").val();
                                    $.spEasyForms.configManager.set(opt);
                                    $('#cascadingLookupAdapterDialog').dialog("close");
                                    opt.refresh = $.spEasyForms.refresh.adapters;
                                    $.spEasyForms.containerCollection.toEditor(opt);
                                }
                            }
                            return false;
                        },
                        "Cancel": function () {
                            $('#cascadingLookupAdapterDialog').dialog("close");
                            return false;
                        }
                    },
                    autoOpen: false,
                    width: 650
                };
                $('#cascadingLookupAdapterDialog').dialog(adapterOpts);
            }
        },

        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // clear dialog
            cascadingLookupAdapter.clearDialog(opt);
            // init dialog
            var listCollection = $.spEasyForms.sharePointContext.getListCollection(opt);
            $.each(listCollection, function (idx, list) {
                $("#cascadingRelationshipListSelect").append(
                    "<option value='" + list.id + "'>" + list.title +
                    "</option>");
            });
            $("#cascadingLookupList").val(opt.currentListContext.title);
            if ($("#cascadingRelationshipListSelect").attr("data-change") !== "true") {
                $("#cascadingRelationshipListSelect").attr("data-change", "true");
                $("#cascadingRelationshipListSelect").change(function () {
                    opt.listId = $("#cascadingRelationshipListSelect").val().toLowerCase();
                    cascadingLookupAdapter.initRelationshipFields({
                        listId: $("#cascadingRelationshipListSelect").val().toLowerCase()
                    });
                });
                $("#cascadingLookupRelationshipParentSelect").change(function () {
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

        initRelationshipFields: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);

            $("#cascadingLookupRelationshipParentSelect").find("option").remove();
            $("#cascadingLookupRelationshipParentSelect").append("<option></option>");
            $("#cascadingLookupRelationshipParentSelect").val("");
            $("#cascadingLookupRelationshipParentSelect").attr("disabled", "disabled");

            $("#cascadingLookupRelationshipChildSelect").find("option").remove();
            $("#cascadingLookupRelationshipChildSelect").append("<option></option>");
            $("#cascadingLookupRelationshipChildSelect").val("");
            $("#cascadingLookupRelationshipChildSelect").attr("disabled", "disabled");

            if (opt.listId) {
                var listctx = $.spEasyForms.sharePointContext.getListContext(opt);
                $.each(Object.keys(listctx.fields), function (idx, field) {
                    if (listctx.fields[field].spFieldType === "SPFieldLookup") {
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

        clearDialog: function () {

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

            var fields = $.spEasyForms.containerCollection.rows;
            $.each(Object.keys($.spEasyForms.containerCollection.rows).sort($.spEasyForms.sharePointFieldRows.compareField), function (idx, field) {
                if (fields[field].spFieldType === "SPFieldLookup") {
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

})(spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adap.defaultToCurrentUserAdapter.js
/*
 * $.spEasyForms.defaultToCurrentUserAdapter - an adapter plug-in for SPEasyForms
 * that creates an adapter for user fields to enter a default value of the current
 * user on new forms.
 *
 * @version 2015.01.03
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery, SPClientPeoplePicker, ExecuteOrDelayUntilScriptLoaded */
(function ($, undefined) {

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.defaultToCurrentUserAdapter = {
        type: "Default To Current User",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldUser", "SPFieldUserMulti"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (visibilityRuleCollection.getFormType(opt) !== "new") {
                return;
            }
            if (containerCollection.rows[opt.adapter.columnNameInternal]) {
                var pplpkrDiv = $("[id^='" + opt.adapter.columnNameInternal + "'][id$='ClientPeoplePicker']");
                var currentUser = $.spEasyForms.sharePointContext.getUserInformation(opt).name;
                if (pplpkrDiv.length > 0) {
                    ExecuteOrDelayUntilScriptLoaded(function () {
                        setTimeout(function () {
                            var clientPplPicker = SPClientPeoplePicker.SPClientPeoplePickerDict[pplpkrDiv[0].id];
                            if (clientPplPicker.GetAllUserInfo().length === 0) {
                                clientPplPicker.AddUserKeys(currentUser);
                                clientPplPicker.OnValueChangedClientScript = function (elementId, userInfo) {
                                    if (userInfo.length === 0) {
                                        if (document.activeElement && document.activeElement.id !== clientPplPicker.EditorElementId) {
                                            clientPplPicker.AddUserKeys(currentUser);
                                        }
                                    }
                                };
                            }
                        }, 1000);
                    }, "clientpeoplepicker.js");
                } else {
                    var displayName = containerCollection.rows[opt.adapter.columnNameInternal].displayName;
                    var picker = $().SPServices.SPFindPeoplePicker({
                        peoplePickerDisplayName: displayName
                    });
                    if (!picker.currentValue) {
                        ExecuteOrDelayUntilScriptLoaded(function () {
                            setTimeout(function () {
                                $().SPServices.SPFindPeoplePicker({
                                    peoplePickerDisplayName: displayName,
                                    valueToSet: currentUser,
                                    checkNames: false
                                });
                            }, 1000);
                        }, "sp.js");
                    }
                }
            }
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // add the dialog div to the UI if it is not already there
            if ($("#addDefaultToCurrentUserDialog").length === 0) {
                var txt = "<div id='addDefaultToCurrentUserDialog' " +
                    "class='speasyforms-dialogdiv' " +
                    "title='Default to Current User Adapter'>" +
                    "Would you like to add/remove a Default to Current User adapter to " +
                    "'<span id='defaultToCurrentFieldName'></span>'?</div>";
                $("#spEasyFormsContainerDialogs").append(txt);
            }
            // initialize the jQuery UI dialog
            var defaultToCurrentOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        // add an adapter to the adaptes list and redraw the editor
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        if ($("#defaultToCurrentFieldName").text().length > 0) {
                            var result = {
                                type: defaultToCurrentUserAdapter.type,
                                columnNameInternal: $("#defaultToCurrentFieldName").text()
                            };
                            opt.adapters[result.columnNameInternal] = result;
                            $.spEasyForms.configManager.set(opt);
                            opt.refresh = $.spEasyForms.refresh.adapters;
                            containerCollection.toEditor(opt);
                        }
                        $('#addDefaultToCurrentUserDialog').dialog("close");
                    },
                    "Remove": function () {
                        // remove the adapter from the adaptes list and redraw the editor
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        if ($("#defaultToCurrentFieldName").text().length > 0 &&
                            $("#defaultToCurrentFieldName").text() in opt.adapters) {
                            delete opt.adapters[$("#defaultToCurrentFieldName").text()];
                            $.spEasyForms.configManager.set(opt);
                        }
                        $('#addDefaultToCurrentUserDialog').dialog("close");
                        opt.adaptersChanged = true;
                        opt.refresh = $.spEasyForms.refresh.adapters;
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#addDefaultToCurrentUserDialog').dialog(defaultToCurrentOpts);
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // initialize the field name in the dialog
            $("#defaultToCurrentFieldName").text(opt.fieldName);
            // launch the dialog
            $('#addDefaultToCurrentUserDialog').dialog("open");
        }
    };

    // define shorthand local variable for adapter
    var defaultToCurrentUserAdapter = $.spEasyForms.defaultToCurrentUserAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[defaultToCurrentUserAdapter.type] = defaultToCurrentUserAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adap.lookupDetailAdapter.js
/*
 * $.spEasyForms.lookupDetailAdapter - an adapter plug-in for SPEasyForms
 * that creates an adapter for text fields to listen for changes to a lookup
 * and pull in data from another field in the lookup list.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;
    var fieldRows = $.spEasyForms.sharePointFieldRows;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.lookupDetailAdapter = {
        type: "Lookup Detail",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldText", "SPFieldNote", "SPFieldMultiLine", "SPFieldChoice", "SPFieldMultiChoice", "SPFieldDateTime",
                "SPFieldBoolean", "SPFieldURL", "SPFieldUser", "SPFieldUserMulti", "SPFieldCurrency", "SPFieldNumber"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            var adapter = opt.adapter;
            var rowInfo = containerCollection.rows[adapter.columnNameInternal];
            if (rowInfo) {
                var lookupInfo = containerCollection.rows[adapter.parentColumnInternal];
                if (lookupInfo.row.find("select").attr("data-relationshipListListener") !== "true") {
                    lookupInfo.row.find("select").attr("data-relationshipListListener", "true").change(function () {
                        opt.lookup = $(this);
                        lookupDetailAdapter.updateAllDetailFields(opt);
                    });
                    if ($.spEasyForms.visibilityRuleCollection.getFormType(opt) === "new") {
                        opt.lookup = lookupInfo.row.find("select");
                        lookupDetailAdapter.updateAllDetailFields(opt);
                    }
                }
            }
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            this.getRelationshipHelper(options).constructDialog();
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var relationshipHelper = this.getRelationshipHelper(options);
            relationshipHelper.clearDialog();
            relationshipHelper.initControls();
            relationshipHelper.initDialog();
            $("#lookupDetailDialog").dialog("open");
        },

        getRelationshipHelper: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            opt.relationship = {
                type: lookupDetailAdapter.type,
                dialogDiv: "lookupDetailDialog",
                relationshipListColumn: { id: "lookupDetailRelationshipList", displayName: "Relationship List" },
                relationshipChildColumn: { id: "lookupDetailRelationshipDetailColumn", displayName: "Detail Column" },
                formListColumn: { id: "lookupDetailList", displayName: "This List" },
                formParentColumn: { id: "lookupDetailLookupColumn", displayName: "Form Lookup Column" },
                formChildColumn: { id: "lookupDetailDetailColumn", displayName: "Form Detail Column" },
            };
            return new $.spEasyForms.relationshipListAdapterHelper(opt);
        },

        updateAllDetailFields: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (opt.lookup.val() === "0") {
                $.each(Object.keys(opt.adapters), function (idx, key) {
                    var current = opt.adapters[key];
                    opt.row = containerCollection.rows[current.columnNameInternal];
                    opt.row.value = "";
                    fieldRows.setValue(opt);
                    if (opt.row.row.next().attr("data-visibilityadded") === "true") {
                        var h3 = "";
                        if (opt.row.row.next().find("td.ms-formbody").find("h3").length > 0) {
                            h3 = opt.row.row.next().find("td.ms-formbody").find("h3")[0].outerHTML;
                        }
                        opt.row.row.next().find("td.ms-formbody").html("");
                        opt.row.row.next().find("td.ms-formbody").append(h3 + "<span class='readonly'>" + opt.row.value + "</span>");
                    }
                });
            }
            else {
                var query = "<Query><Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" +
                    opt.lookup.val() + "</Value></Eq></Where></Query>";

                var viewFields = "<ViewFields>";
                var adapters = [];
                $.each(Object.keys(opt.adapters), function (idx, key) {
                    var current = opt.adapters[key];
                    if (current.parentColumnInternal === current.parentColumnInternal) {
                        adapters.push(current);
                        viewFields += "<FieldRef Name='" + current.relationshipListChildColumn + "'></FieldRef>";
                    }
                });
                viewFields += "</ViewFields>";

                $().SPServices({
                    operation: "GetListItems",
                    async: false,
                    listName: opt.adapter.relationshipList,
                    CAMLQuery: query,
                    CAMLViewFields: viewFields,
                    completefunc: function (xData) {
                        $(xData.responseXML).SPFilterNode('z:row').each(function () {
                            var resultRow = $(this);
                            $.each($(adapters), function (idx, adapter) {
                                opt.row = containerCollection.rows[adapter.columnNameInternal];
                                var value = resultRow.attr("ows_" + adapter.relationshipListChildColumn);
                                if (typeof (value) !== "undefined" && value !== null) {
                                    switch (opt.row.spFieldType) {
                                        case "SPFieldUser":
                                        case "SPFieldUserMulti":
                                            opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn);
                                            if (opt.value.indexOf(";#") > -1) {
                                                var a = opt.value.split(";#");
                                                opt.value = "";
                                                for (var i = 1; i < a.length; i += 2) {
                                                    if (opt.value.length > 0) {
                                                        opt.value += ";";
                                                    }
                                                    opt.value += a[i];
                                                }
                                            }
                                            break;
                                        case "SPFieldDateTime":
                                            opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(/-/g, "/");
                                            break;
                                        case "SPFieldURL":
                                            opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(", ", "|");
                                            break;
                                        default:
                                            opt.value = resultRow.attr("ows_" + adapter.relationshipListChildColumn).replace(/;#/g, ";");
                                            break;
                                    }
                                }
                                else {
                                    opt.value = "";
                                }
                                fieldRows.setValue(opt);
                                if (opt.row.row.next().attr("data-visibilityadded") === "true") {
                                    var h3 = "";
                                    if (opt.row.row.next().find("td.ms-formbody").find("h3").length > 0) {
                                        h3 = opt.row.row.next().find("td.ms-formbody").find("h3")[0].outerHTML;
                                    }
                                    else if (opt.row.row.next().find("td.ms-formbody").find("nobr.speasyforms-columnheader")) {
                                        h3 = opt.row.row.next().find("td.ms-formbody").find("nobr.speasyforms-columnheader").parent()[0].outerHTML;
                                    }
                                    opt.row.row.next().find("td.ms-formbody").html("");
                                    opt.row.row.next().find("td.ms-formbody").append(h3 + "<span class='readonly'>" + opt.row.value + "</span>");
                                }
                            });
                        });
                    }
                });
            }
            $.spEasyForms.utilities.resizeModalDialog();
        }
    };

    // define shorthand local variable for adapter
    var lookupDetailAdapter = $.spEasyForms.lookupDetailAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[lookupDetailAdapter.type] = lookupDetailAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/adap.starRatingAdapter.js
/*
 * $.spEasyForms.starRatingAdapter - an adapter plug-in for SPEasyForms that
 * can be applied to integer fields and allows users to enter 0-5 stars as the
 * value by clicking on the stars or a slider-like interface.
 *
 * @requires jQuery.SPEasyForms.2015.01.03 
 * @copyright 2014-2016 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // shorthand alias for SPEasyForms instances we're going to need
    var containerCollection = $.spEasyForms.containerCollection;
    var visibilityRuleCollection = $.spEasyForms.visibilityRuleCollection;
    var adapterCollection = $.spEasyForms.adapterCollection;

    /* Field control adapter for default to current user on user fields */
    $.spEasyForms.starRatingAdapter = {
        type: "Star Rating",

        // return an array of field types to which this adapter can be applied
        supportedTypes: function () {
            return ["SPFieldNumber"];
        },

        // modify a configured field in a new, edit, or display form
        transform: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            if (containerCollection.rows[opt.adapter.columnNameInternal]) {
                var rowInfo = containerCollection.rows[opt.adapter.columnNameInternal];
                var value = rowInfo.value ? rowInfo.value : 0;

                if (visibilityRuleCollection.getFormType(opt) === "display") {
                    if ($("#" + opt.adapter.columnNameInternal + "Stars").length === 0) {
                        var td = rowInfo.row.find("td.ms-formbody");
                        td.html("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>");
                        $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * value) + "px");
                    }
                }
                else {
                    if ($("#" + opt.adapter.columnNameInternal + "Stars").length === 0) {
                        var input = rowInfo.row.find("input");
                        input.hide();
                        input.parent().prepend("<div id='" + opt.adapter.columnNameInternal + "Stars' class='speasyforms-stars'>" +
                            "<div id='" + opt.adapter.columnNameInternal + "StarsSlider' class='speasyforms-starsslider'></div></div>");

                        $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * value) + "px");

                        $("#" + opt.adapter.columnNameInternal + "StarsSlider").click(function (e) {
                            var posX = $(this).offset().left;
                            var stars = Math.floor((e.pageX - posX + 10) / 20);
                            input.val(stars);
                            $("#" + opt.adapter.columnNameInternal + "Stars").css("background-position", "0px " + (20 * stars) + "px");
                        });
                    }
                }
            }
        },

        // initialize dialog box for configuring adapter on the settings page
        toEditor: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // add the dialog div to the UI if it is not already there
            if ($("#addStarRatingAdapterDialog").length === 0) {
                var txt = "<div id='addStarRatingAdapterDialog' " +
                    "class='speasyforms-dialogdiv' " +
                    "title='Star Rating Adapter'>" +
                    "Would you like to add/remove a Star Rating adapter to " +
                    "'<span id='starRatingFieldName'></span>'?</div>";
                $("#spEasyFormsContainerDialogs").append(txt);
            }
            // initialize the jQuery UI dialog
            var starRatingOpts = {
                modal: true,
                buttons: {
                    "Add": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        // add an adapter to the adaptes list and redraw the editor
                        if ($("#starRatingFieldName").text().length > 0) {
                            var result = {
                                type: starRatingAdapter.type,
                                columnNameInternal: $("#starRatingFieldName").text()
                            };
                            opt.adapters[result.columnNameInternal] = result;
                            $.spEasyForms.configManager.set(opt);
                            opt.refresh = $.spEasyForms.refresh.adapters;
                            containerCollection.toEditor(opt);
                        }
                        $('#addStarRatingAdapterDialog').dialog("close");
                    },
                    "Remove": function () {
                        opt.currentConfig = $.spEasyForms.containerCollection.toConfig(opt);
                        opt.adapters = opt.currentConfig.adapters.def;
                        // remove the adapter from the adaptes list and redraw the editor
                        if ($("#starRatingFieldName").text().length > 0 &&
                            $("#starRatingFieldName").text() in opt.adapters) {
                            delete opt.adapters[$("#starRatingFieldName").text()];
                            $.spEasyForms.configManager.set(opt);
                        }
                        $('#addStarRatingAdapterDialog').dialog("close");
                        opt.refresh = $.spEasyForms.refresh.adapters;
                        containerCollection.toEditor(opt);
                        return false;
                    }
                },
                autoOpen: false,
                width: 400
            };
            $('#addStarRatingAdapterDialog').dialog(starRatingOpts);
        },

        // launch the adapter dialog box to configure a field
        launchDialog: function (options) {
            var opt = $.extend({}, $.spEasyForms.defaults, options);
            // initialize the field name in the dialog
            $("#starRatingFieldName").text(opt.fieldName);
            // launch the dialog
            $('#addStarRatingAdapterDialog').dialog("open");
        }
    };

    // define shorthand local variable for adapter
    var starRatingAdapter = $.spEasyForms.starRatingAdapter;

    // add adapter to adapter collection
    adapterCollection.adapterImplementations[starRatingAdapter.type] = starRatingAdapter;
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/jquery.cleditor.js
/*!
 CLEditor WYSIWYG HTML Editor v1.4.5
 http://premiumsoftware.net/CLEditor
 requires jQuery v1.4.2 or later

 Copyright 2010, Chris Landowski, Premium Software, LLC
 Dual licensed under the MIT or GPL Version 2 licenses.
 Modified for sharepoint plugin by Joe McShea - all my changes have a comment with my name.
*/
/* global spefjQuery, cleditor:true */
/*jshint -W016, -W038, -W004 */
(function ($) {

    if (!$) {
        return; // Joe McShea - return if spefjQuery is not loaded
    }

    //==============
    // jQuery Plugin
    //==============

    $.cleditor = {

        // Define the defaults used for all new cleditor instances
        defaultOptions: {
            width: 'auto', // width not including margins, borders or padding
            height: 250, // height not including margins, borders or padding
            controls: // controls to add to the toolbar
            "bold italic underline strikethrough subscript superscript | font size " +
                "style | color highlight removeformat | bullets numbering | outdent " +
                "indent | alignleft center alignright justify | undo redo | " +
                "rule image link unlink | cut copy paste pastetext | print source",
            colors: // colors in the color popup
            "FFF FCC FC9 FF9 FFC 9F9 9FF CFF CCF FCF " +
                "CCC F66 F96 FF6 FF3 6F9 3FF 6FF 99F F9F " +
                "BBB F00 F90 FC6 FF0 3F3 6CC 3CF 66C C6C " +
                "999 C00 F60 FC3 FC0 3C0 0CC 36F 63F C3C " +
                "666 900 C60 C93 990 090 399 33F 60C 939 " +
                "333 600 930 963 660 060 366 009 339 636 " +
                "000 300 630 633 330 030 033 006 309 303",
            fonts: // font names in the font popup
            "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
                "Georgia,Impact,Sans Serif,Serif,Tahoma,Trebuchet MS,Verdana",
            sizes: // sizes in the font size popup
            "1,2,3,4,5,6,7",
            styles: // styles in the style popup
            [
                ["Paragraph", "<p>"],
                ["Header 1", "<h1>"],
                ["Header 2", "<h2>"],
                ["Header 3", "<h3>"],
                ["Header 4", "<h4>"],
                ["Header 5", "<h5>"],
                ["Header 6", "<h6>"]
            ],
            useCSS: true, // use CSS to style HTML when possible (not supported in ie)
            docType: // Document type contained within the editor
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
            docCSSFile: // CSS file used to style the document contained within the editor
            "",
            bodyStyle: // style to assign to document body contained within the editor
            "margin:4px; font:10pt Arial,Verdana; cursor:text"
        },

        // Define all usable toolbar buttons - the init string property is 
        //   expanded during initialization back into the buttons object and 
        //   separate object properties are created for each button.
        //   e.g. buttons.size.title = "Font Size"
        buttons: {
            // name,title,command,popupName (""=use name)
            init: "bold,,|" +
                "italic,,|" +
                "underline,,|" +
                "strikethrough,,|" +
                "subscript,,|" +
                "superscript,,|" +
                "font,,fontname,|" +
                "size,Font Size,fontsize,|" +
                "style,,formatblock,|" +
                "color,Font Color,forecolor,|" +
                "highlight,Text Highlight Color,hilitecolor,color|" +
                "removeformat,Remove Formatting,|" +
                "bullets,,insertunorderedlist|" +
                "numbering,,insertorderedlist|" +
                "outdent,,|" +
                "indent,,|" +
                "alignleft,Align Text Left,justifyleft|" +
                "center,,justifycenter|" +
                "alignright,Align Text Right,justifyright|" +
                "justify,,justifyfull|" +
                "undo,,|" +
                "redo,,|" +
                "rule,Insert Horizontal Rule,inserthorizontalrule|" +
                "image,Insert Image,insertimage,url|" +
                "link,Insert Hyperlink,createlink,url|" +
                "unlink,Remove Hyperlink,|" +
                "cut,,|" +
                "copy,,|" +
                "paste,,|" +
                "pastetext,Paste as Text,inserthtml,|" +
                "print,,|" +
                "source,Show Source"
        },

        // imagesPath - returns the path to the images folder
        imagesPath: function () {
            return imagesPath();
        }

    };

    // cleditor - creates a new editor for each of the matched textareas
    $.fn.cleditor = function (options) {

        // Create a new jQuery object to hold the results
        var $result = $([]);

        // Loop through all matching textareas and create the editors
        this.each(function (idx, elem) {
            if (elem.tagName.toUpperCase() === "TEXTAREA") {
                var data = $.data(elem, CLEDITOR);
                if (!data) {
                    data = new cleditor(elem, options);
                }
                $result = $result.add(data);
            }
        });

        // return the new jQuery object
        return $result;

    };

    //==================
    // Private Variables
    //==================

    var

    // Misc constants
    BACKGROUND_COLOR = "backgroundColor",
        BLURRED = "blurred",
        BUTTON = "button",
        BUTTON_NAME = "buttonName",
        CHANGE = "change",
        CLEDITOR = "cleditor",
        CLICK = "click",
        DISABLED = "disabled",
        DIV_TAG = "<div>",
        FOCUSED = "focused",
        UNSELECTABLE = "unselectable",

        // Class name constants
        MAIN_CLASS = "cleditorMain", // main containing div
        TOOLBAR_CLASS = "cleditorToolbar", // toolbar div inside main div
        GROUP_CLASS = "cleditorGroup", // group divs inside the toolbar div
        BUTTON_CLASS = "cleditorButton", // button divs inside group div
        DISABLED_CLASS = "cleditorDisabled", // disabled button divs
        DIVIDER_CLASS = "cleditorDivider", // divider divs inside group div
        POPUP_CLASS = "cleditorPopup", // popup divs inside body
        LIST_CLASS = "cleditorList", // list popup divs inside body
        COLOR_CLASS = "cleditorColor", // color popup div inside body
        PROMPT_CLASS = "cleditorPrompt", // prompt popup divs inside body
        MSG_CLASS = "cleditorMsg", // message popup div inside body

        // Browser detection
        ua = navigator.userAgent.toLowerCase(),
        ie = /msie/.test(ua),
        ie6 = /msie\s6/.test(ua),
        iege11 = /(trident)(?:.*rv:([\w.]+))?/.test(ua),
        webkit = /webkit/.test(ua),

        // Test for iPhone/iTouch/iPad
        iOS = /iPhone|iPad|iPod/i.test(ua),

        // Popups are created once as needed and shared by all editor instances
        popups = {},

        // Used to prevent the document click event from being bound more than once
        documentClickAssigned,

        // Local copy of the buttons object
        buttons = $.cleditor.buttons;

    //===============
    // Initialization
    //===============

    // Expand the buttons.init string back into the buttons object
    //   and create seperate object properties for each button.
    //   e.g. buttons.size.title = "Font Size"
    $.each(buttons.init.split("|"), function (idx, button) {
        var items = button.split(","),
            name = items[0];
        buttons[name] = {
            stripIndex: idx,
            name: name,
            title: items[1] === "" ? name.charAt(0).toUpperCase() + name.substr(1) : items[1],
            command: items[2] === "" ? name : items[2],
            popupName: items[3] === "" ? name : items[3]
        };
    });
    delete buttons.init;

    //============
    // Constructor
    //============

    // cleditor - creates a new editor for the passed in textarea element
    cleditor = function (area, options) {

        var editor = this;

        // Get the defaults and override with options
        editor.options = options = $.extend({}, $.cleditor.defaultOptions, options);

        // Hide the textarea and associate it with this editor
        var $area = editor.$area = $(area).css({
            border: "none",
            margin: 0,
            padding: 0
        }).hide().data(CLEDITOR, editor).blur(function () {
            // Update the iframe when the textarea loses focus
            updateFrame(editor, true);
        });

        // Create the main container
        var $main = editor.$main = $(DIV_TAG).addClass(MAIN_CLASS).width(options.width).height(options.height);

        // Create the toolbar
        var $toolbar = editor.$toolbar = $(DIV_TAG).addClass(TOOLBAR_CLASS).appendTo($main);

        // Add the first group to the toolbar
        var $group = $(DIV_TAG).addClass(GROUP_CLASS).appendTo($toolbar);

        // Initialize the group width
        var groupWidth = 0;

        // Add the buttons to the toolbar
        $.each(options.controls.split(" "), function (idx, buttonName) {
            if (buttonName === "") {
                return true;
            }

            // Divider
            if (buttonName === "|") {

                // Add a new divider to the group
                $(DIV_TAG).addClass(DIVIDER_CLASS).appendTo($group);

                // Update the group width
                $group.width(groupWidth + 1);
                groupWidth = 0;

                // Create a new group
                $group = $(DIV_TAG).addClass(GROUP_CLASS).appendTo($toolbar);

            }

                // Button
            else {

                // Get the button definition
                var button = buttons[buttonName];

                // Add a new button to the group
                var $buttonDiv = $(DIV_TAG).data(BUTTON_NAME, button.name).attr("buttonName", button.name);
                $buttonDiv.addClass(BUTTON_CLASS).attr("title", button.title);
                $buttonDiv.bind(CLICK, $.proxy(buttonClick, editor)).appendTo($group);
                $buttonDiv.hover(
                        // Joe McShea - added the ability for plug-ins to override hover events, for sticky buttons
                        editor.options.hoverEnter ? editor.options.hoverEnter : hoverEnter,
                        editor.options.hoverLeave ? editor.options.hoverLeave : hoverLeave);

                // Joe McShea - reduce button height (should make this configurable?)
                groupWidth += 22;
                $group.width(groupWidth + 1);

                // Prepare the button image
                var map = {};
                if (button.css) {
                    map = button.css;
                }
                else if (button.image) {
                    map.backgroundImage = imageUrl(button.image);
                }
                // Joe McShea - reduce button height
                if (button.stripIndex) {
                    map.backgroundPosition = button.stripIndex * -22;
                }
                $buttonDiv.css(map);

                // Add the unselectable attribute for ie
                if (ie) {
                    $buttonDiv.attr(UNSELECTABLE, "on");
                }

                // Create the popup
                if (button.popupName) {
                    createPopup(button.popupName, options, button.popupClass,
                        button.popupContent, button.popupHover);
                }
            }

        });

        // Add the main div to the DOM and append the textarea
        $main.insertBefore($area).append($area);

        // Bind the document click event handler
        if (!documentClickAssigned) {
            $(document).click(function (e) {
                // Dismiss all non-prompt popups
                var $target = $(e.target);
                if (!$target.add($target.parents()).is("." + PROMPT_CLASS)) {
                    hidePopups();
                }
            });
            documentClickAssigned = true;
        }

        // Bind the window resize event when the width or height is auto or %
        if (/auto|%/.test("" + options.width + options.height)) {
            $(window).bind("resize.cleditor", function () {
                refresh(editor);
            });
        }

        // Create the iframe and resize the controls
        refresh(editor);

    };

    //===============
    // Public Methods
    //===============

    var fn = cleditor.prototype,

        // Expose the following private functions as methods on the cleditor object.
        // The closure compiler will rename the private functions. However, the
        // exposed method names on the cleditor object will remain fixed.
        methods = [
            ["clear", clear],
            ["disable", disable],
            ["execCommand", execCommand],
            ["focus", focus],
            ["hidePopups", hidePopups],
            ["sourceMode", sourceMode, true],
            ["refresh", refresh],
            ["select", select],
            ["selectedHTML", selectedHTML, true],
            ["selectedText", selectedText, true],
            ["showMessage", showMessage],
            ["updateFrame", updateFrame],
            ["updateTextArea", updateTextArea]
        ];

    $.each(methods, function (idx, method) {
        fn[method[0]] = function () {
            var editor = this,
                args = [editor];
            // using each here would cast booleans into objects!
            for (var x = 0; x < arguments.length; x++) {
                args.push(arguments[x]);
            }
            var result = method[1].apply(editor, args);
            if (method[2]) {
                return result;
            }
            return editor;
        };
    });

    // blurred - shortcut for .bind("blurred", handler) or .trigger("blurred")
    fn.blurred = function (handler) {
        var $this = $(this);
        return handler ? $this.bind(BLURRED, handler) : $this.trigger(BLURRED);
    };

    // change - shortcut for .bind("change", handler) or .trigger("change")
    fn.change = function change(handler) {
        var $this = $(this);
        return handler ? $this.bind(CHANGE, handler) : $this.trigger(CHANGE);
    };

    // focused - shortcut for .bind("focused", handler) or .trigger("focused")
    fn.focused = function (handler) {
        var $this = $(this);
        return handler ? $this.bind(FOCUSED, handler) : $this.trigger(FOCUSED);
    };

    //===============
    // Event Handlers
    //===============

    // buttonClick - click event handler for toolbar buttons
    function buttonClick(e) {

        var editor = this,
            buttonDiv = e.target,
            buttonName = $.data(buttonDiv, BUTTON_NAME),
            button = buttons[buttonName],
            popupName = button.popupName,
            popup = popups[popupName];

        // Check if disabled
        if (editor.disabled || $(buttonDiv).attr(DISABLED) === DISABLED) {
            return;
        }

        // Fire the buttonClick event
        var data = {
            editor: editor,
            button: buttonDiv,
            buttonName: buttonName,
            popup: popup,
            popupName: popupName,
            command: button.command,
            useCSS: editor.options.useCSS
        };

        if (button.buttonClick && button.buttonClick(e, data) === false) {
            return false;
        }

        // Toggle source
        if (buttonName === "source") {

            // Show the iframe
            if (sourceMode(editor)) {
                delete editor.range;
                editor.$area.hide();
                editor.$frame.show();
                buttonDiv.title = button.title;
                try {
                    if (ie) {
                        editor.doc.body.contentEditable = true;
                    }
                    else {
                        editor.doc.designMode = "on";
                    }
                }
                catch (err) { }
            }
                // Show the textarea
            else {
                editor.$frame.hide();
                editor.$area.show();
                buttonDiv.title = "Show Rich Text";
                try {
                    if (ie) {
                        editor.doc.body.contentEditable = false;
                    }
                    else {
                        editor.doc.designMode = "off";
                    }
                }
                catch (err) { }
                editor.$area.focus();
            }

        }

            // Check for rich text mode
        else if (!sourceMode(editor)) {

            // Handle popups
            if (popupName) {
                var $popup = $(popup);

                // URL
                if (popupName === "url") {

                    // Check for selection before showing the link url popup
                    if (buttonName === "link" && selectedText(editor) === "") {
                        showMessage(editor, "A selection is required when inserting a link.", buttonDiv);
                        return false;
                    }

                    // Wire up the submit button click event handler
                    $popup.children(":button").unbind(CLICK).bind(CLICK, function () {

                        // Insert the image or link if a url was entered
                        var $text = $popup.find(":text"),
                            url = $.trim($text.val());
                        if (url !== "") {
                            execCommand(editor, data.command, url, null, data.button);
                        }

                        // Reset the text, hide the popup and set focus
                        $text.val("http://");
                        hidePopups();
                        focus(editor);

                    });

                }

                    // Paste as Text
                else if (popupName === "pastetext") {

                    // Wire up the submit button click event handler
                    $popup.children(":button").unbind(CLICK).bind(CLICK, function () {

                        // Insert the unformatted text replacing new lines with break tags
                        var $textarea = $popup.find("textarea"),
                            text = $textarea.val().replace(/\n/g, "<br />");
                        if (text !== "") {
                            execCommand(editor, data.command, text, null, data.button);
                        }

                        // Reset the text, hide the popup and set focus
                        $textarea.val("");
                        hidePopups();
                        focus(editor);

                    });

                }

                // Show the popup if not already showing for this button
                if (buttonDiv !== $.data(popup, BUTTON)) {
                    showPopup(editor, popup, buttonDiv);
                    return false; // stop propagination to document click
                }

                // propaginate to document click
                return;

            }

                // Print
            else if (buttonName === "print") {
                editor.$frame[0].contentWindow.print();
            }
                // All other buttons
            else if (!execCommand(editor, data.command, data.value, data.useCSS, buttonDiv)) {
                return false;
            }

        }

        // Joe McShea - added callback to handle shortcut keys
        if (data.editor.options.buttonClickCallBack) {
            return data.editor.options.buttonClickCallBack(e, data);
        }

        // Focus the editor
        focus(editor);

    }

    // hoverEnter - mouseenter event handler for buttons and popup items
    function hoverEnter(e) {
        var $div = $(e.target).closest("div");
        $div.css(BACKGROUND_COLOR, $div.data(BUTTON_NAME) ? "#FC6" : "#FFC");
    }

    // hoverLeave - mouseleave event handler for buttons and popup items
    function hoverLeave(e) {
        $(e.target).closest("div").css(BACKGROUND_COLOR, "transparent");
    }

    // popupClick - click event handler for popup items
    function popupClick(e) {

        var editor = this,
            popup = e.data.popup,
            target = e.target;

        // Check for message and prompt popups
        if (popup === popups.msg || $(popup).hasClass(PROMPT_CLASS)) {
            return;
        }

        // Get the button info
        var buttonDiv = $.data(popup, BUTTON),
            buttonName = $.data(buttonDiv, BUTTON_NAME),
            button = buttons[buttonName],
            command = button.command,
            value,
            useCSS = editor.options.useCSS;

        // Get the command value
        if (buttonName === "font") {
            // Opera returns the fontfamily wrapped in quotes
            value = target.style.fontFamily.replace(/"/g, "");
        }
        else if (buttonName === "size") {
            if (target.tagName.toUpperCase() === "DIV") {
                target = target.children[0];
            }
            value = target.innerHTML;
        } else if (buttonName === "style") {
            value = "<" + target.tagName + ">";
        }
        else if (buttonName === "color") {
            value = hex(target.style.backgroundColor);
        }
        else if (buttonName === "highlight") {
            value = hex(target.style.backgroundColor);
            if (ie) {
                command = 'backcolor';
            }
            else {
                useCSS = true;
            }
        }

        // Fire the popupClick event
        var data = {
            editor: editor,
            button: buttonDiv,
            buttonName: buttonName,
            popup: popup,
            popupName: button.popupName,
            command: command,
            value: value,
            useCSS: useCSS
        };

        if (button.popupClick && button.popupClick(e, data) === false) {
            return;
        }

        // Execute the command
        if (data.command && !execCommand(editor, data.command, data.value, data.useCSS, buttonDiv)) {
            return false;
        }

        // Hide the popup and focus the editor
        hidePopups();
        focus(editor);

    }

    //==================
    // Private Functions
    //==================

    // checksum - returns a checksum using the Adler-32 method
    function checksum(text) {
        var a = 1,
            b = 0;
        for (var index = 0; index < text.length; ++index) {
            a = (a + text.charCodeAt(index)) % 65521;
            b = (b + a) % 65521;
        }
        return (b << 16) | a;
    }

    // clear - clears the contents of the editor
    function clear(editor) {
        editor.$area.val("");
        updateFrame(editor);
    }

    // createPopup - creates a popup and adds it to the body
    function createPopup(popupName, options, popupTypeClass, popupContent, popupHover) {

        // Check if popup already exists
        if (popups[popupName]) {
            return popups[popupName];
        }

        // Create the popup
        var $popup = $(DIV_TAG).hide().addClass(POPUP_CLASS).appendTo("body");

        // Add the content

        // Custom popup
        if (popupContent) {
            $popup.html(popupContent);
        }
            // Color
        else if (popupName === "color") {
            var colors = options.colors.split(" ");
            if (colors.length < 10) {
                $popup.width("auto");
            }
            $.each(colors, function (idx, color) {
                $(DIV_TAG).appendTo($popup).css(BACKGROUND_COLOR, "#" + color);
            });
            popupTypeClass = COLOR_CLASS;
        }
            // Font
        else if (popupName === "font") {
            $.each(options.fonts.split(","), function (idx, font) {
                $(DIV_TAG).appendTo($popup).css("fontFamily", font).html(font);
            });
        }
            // Size
        else if (popupName === "size") {
            $.each(options.sizes.split(","), function (idx, size) {
                $(DIV_TAG).appendTo($popup).html('<font size="' + size + '">' + size + '</font>');
            });
        }
            // Style
        else if (popupName === "style") {
            $.each(options.styles, function (idx, style) {
                $(DIV_TAG).appendTo($popup).html(style[1] + style[0] + style[1].replace("<", "</"));
            });
        }
            // URL
        else if (popupName === "url") {
            $popup.html('<label>Enter URL:<br /><input type="text" value="http://" style="width:200px" /></label><br /><input type="button" value="Submit" />');
            popupTypeClass = PROMPT_CLASS;
        }
            // Paste as Text
        else if (popupName === "pastetext") {
            $popup.html('<label>Paste your content here:<br /><textarea rows="3" style="width:200px"></textarea></label><br /><input type="button" value="Submit" />');
            popupTypeClass = PROMPT_CLASS;
        }

        // Add the popup type class name
        if (!popupTypeClass && !popupContent) {
            popupTypeClass = LIST_CLASS;
        }
        $popup.addClass(popupTypeClass);

        // Add the unselectable attribute to all items
        if (ie) {
            $popup.attr(UNSELECTABLE, "on").find("div,font,p,h1,h2,h3,h4,h5,h6").attr(UNSELECTABLE, "on");
        }

        // Add the hover effect to all items
        if ($popup.hasClass(LIST_CLASS) || popupHover === true) {
            $popup.children().hover(hoverEnter, hoverLeave);
        }

        // Add the popup to the array and return it
        popups[popupName] = $popup[0];
        return $popup[0];
    }

    // disable - enables or disables the editor
    function disable(editor, disabled) {

        // Update the textarea and save the state
        if (disabled) {
            editor.$area.attr(DISABLED, DISABLED);
            editor.disabled = true;
        } else {
            editor.$area.removeAttr(DISABLED);
            delete editor.disabled;
        }

        // Switch the iframe into design mode.
        // ie6 does not support designMode.
        // ie7 & ie8 do not properly support designMode="off".
        try {
            if (ie) {
                editor.doc.body.contentEditable = !disabled;
            }
            else {
                editor.doc.designMode = !disabled ? "on" : "off";
            }
        }
        // Firefox 1.5 throws an exception that can be ignored
        // when toggling designMode from off to on.
        catch (err) { }

        // Enable or disable the toolbar buttons
        refreshButtons(editor);

    }

    // execCommand - executes a designMode command
    function execCommand(editor, command, value, useCSS, button) {

        // Restore the current ie selection
        restoreRange(editor);

        // Set the styling method
        if (!ie) {
            if (useCSS === undefined || useCSS === null) {
                useCSS = editor.options.useCSS;
            }
            editor.doc.execCommand("styleWithCSS", 0, useCSS.toString());
        }

        // Execute the command and check for error
        var inserthtml = command.toLowerCase() === "inserthtml";
        if (ie && inserthtml) {
            getRange(editor).pasteHTML(value);
        }
        else if (iege11 && inserthtml) {
            var selection = getSelection(editor),
                range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(range.createContextualFragment(value));
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            var success = true,
                message;
            try {
                success = editor.doc.execCommand(command, 0, value || null);
            } catch (err) {
                message = err.message;
                success = false;
            }
            if (!success) {
                if ("cutcopypaste".indexOf(command) > -1) {
                    showMessage(editor, "For security reasons, your browser does not support the " +
                        command + " command. Try using the keyboard shortcut or context menu instead.",
                        button);
                }
                else {
                    showMessage(editor, (message ? message : "Error executing the " + command + " command."),
                        button);
                }
            }
        }

        // Enable the buttons and update the textarea
        refreshButtons(editor);
        updateTextArea(editor, true);
        return success;

    }

    // focus - sets focus to either the textarea or iframe
    function focus(editor) {
        setTimeout(function () {
            if (sourceMode(editor)) {
                editor.$area.focus();
            }
            else {
                editor.$frame[0].contentWindow.focus();
            }
            refreshButtons(editor);
        }, 0);
    }

    // getRange - gets the current text range object
    function getRange(editor) {
        if (ie) {
            return getSelection(editor).createRange();
        }
        return getSelection(editor).getRangeAt(0);
    }

    // getSelection - gets the current text range object
    function getSelection(editor) {
        if (ie) {
            return editor.doc.selection;
        }
        return editor.$frame[0].contentWindow.getSelection();
    }

    // hex - returns the hex value for the passed in color string
    function hex(s) {

        // hex("rgb(255, 0, 0)") returns #FF0000
        var m = /rgba?\((\d+), (\d+), (\d+)/.exec(s);
        if (m) {
            s = (m[1] << 16 | m[2] << 8 | m[3]).toString(16);
            while (s.length < 6) {
                s = "0" + s;
            }
            return "#" + s;
        }

        // hex("#F00") returns #FF0000
        var c = s.split("");
        if (s.length === 4) {
            return "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
        }

        // hex("#FF0000") returns #FF0000
        return s;

    }

    // hidePopups - hides all popups
    function hidePopups() {
        $.each(popups, function (idx, popup) {
            $(popup).hide().unbind(CLICK).removeData(BUTTON);
        });
    }

    // imagesPath - returns the path to the images folder
    function imagesPath() {
        var href = $("link[href*=cleditor]").attr("href");
        return href.replace(/^(.*\/)[^\/]+$/, '$1') + "images/";
    }

    // imageUrl - Returns the css url string for a filemane
    function imageUrl(filename) {
        return "url(" + imagesPath() + filename + ")";
    }

    // refresh - creates the iframe and resizes the controls
    function refresh(editor) {

        var $main = editor.$main,
            options = editor.options;

        // Remove the old iframe
        if (editor.$frame) {
            editor.$frame.remove();
        }

        // Joe McShea - modified src to about:blank
        var $frame = editor.$frame = $('<iframe frameborder="0" src="about:blank" />').hide().appendTo($main);

        // Load the iframe document content
        var contentWindow = $frame[0].contentWindow,
            doc = editor.doc = contentWindow.document,
            $doc = $(doc);

        doc.open();
        doc.write(
            options.docType +
            '<html>' +
            ((options.docCSSFile === '') ? '' : '<head><link rel="stylesheet" type="text/css" href="' + options.docCSSFile + '" /></head>') +
            '<body style="' + options.bodyStyle + '"></body></html>');
        doc.close();

        // Work around for bug in IE which causes the editor to lose
        // focus when clicking below the end of the document.
        if (ie || iege11) {
            $doc.click(function () {
                focus(editor);
            });
        }

        // Load the content
        updateFrame(editor);

        // Bind the ie specific iframe event handlers
        if (ie || iege11) {

            // Save the current user selection. This code is needed since IE will
            // reset the selection just after the beforedeactivate event and just
            // before the beforeactivate event.
            // Joe McShea - added keydown
            $doc.bind("beforedeactivate beforeactivate selectionchange keypress keyup keydown", function (e) {

                // Flag the editor as inactive
                if (e.type === "beforedeactivate") {
                    editor.inactive = true;
                }
                    // Get rid of the bogus selection and flag the editor as active
                else if (e.type === "beforeactivate") {
                    if (!editor.inactive && editor.range && editor.range.length > 1) {
                        editor.range.shift();
                    }
                    delete editor.inactive;
                }

                    // Save the selection when the editor is active
                else if (!editor.inactive) {
                    if (!editor.range) {
                        editor.range = [];
                    }
                    editor.range.unshift(getRange(editor));

                    // We only need the last 2 selections
                    while (editor.range.length > 2) {
                        editor.range.pop();
                    }
                }

                // Joe McShea - added callback to handle shortcut keys
                if (e.type === "keydown" && options.keyDownCallback) {
                    return options.keyDownCallback(e, editor);
                }

                // Joe McShea - added callback to handle shortcut keys
                if (e.type === "selectionchange" && options.selectionChangeCallback) {
                    return options.selectionChangeCallback(e, editor);
                }
            });

            // Restore the text range and trigger focused event when the iframe gains focus
            $frame.focus(function () {
                restoreRange(editor);
                $(editor).triggerHandler(FOCUSED);
            });

            // Trigger blurred event when the iframe looses focus
            $frame.blur(function () {
                $(editor).triggerHandler(BLURRED);
            });

        }

            // Trigger focused and blurred events for all other browsers
        else {
            $($frame[0].contentWindow).focus(function () {
                $(editor).triggerHandler(FOCUSED);
            }).blur(function () {
                $(editor).triggerHandler(BLURRED);
            });
            // Joe McShea - added callback to handle shortcut keys
            $doc.bind("keydown selectionchange", function (e) {
                // Joe McShea - added callback to handle shortcut keys
                if (e.type === "keydown" && options.keyDownCallback) {
                    return options.keyDownCallback(e, editor);
                }

                // Joe McShea - added callback to handle shortcut keys
                if (e.type === "selectionchange" && options.selectionChangeCallback) {
                    return options.selectionChangeCallback(e, editor);
                }
            });

        }

        // Enable the toolbar buttons and update the textarea as the user types or clicks
        $doc.click(hidePopups).keydown(function (e) {
            // Prevent Internet Explorer from going to prior page when an image 
            // is selected and the backspace key is pressed.
            if (ie && getSelection(editor).type === "Control" && e.keyCode === 8) {
                getSelection(editor).clear();
                e.preventDefault();
            }
        }).bind("keyup mouseup", function () {
            refreshButtons(editor);
            updateTextArea(editor, true);
        });

        // Show the textarea for iPhone/iTouch/iPad or
        // the iframe when design mode is supported.
        if (iOS) {
            editor.$area.show();
        }
        else {
            $frame.show();
        }

        // Wait for the layout to finish - shortcut for $(document).ready()
        $(function () {

            var $toolbar = editor.$toolbar,
                $group = $toolbar.children("div:last"),
                wid = $main.width();

            // Resize the toolbar
            var hgt = $group.offset().top + $group.outerHeight() - $toolbar.offset().top + 1;
            $toolbar.height(hgt);

            // Resize the iframe
            hgt = (/%/.test("" + options.height) ? $main.height() : parseInt(options.height, 10)) - hgt;
            $frame.width(wid).height(hgt);

            // Resize the textarea. IE6 textareas have a 1px top
            // & bottom margin that cannot be removed using css.
            editor.$area.width(wid).height(ie6 ? hgt - 27 : hgt - 25);

            // Switch the iframe into design mode if enabled
            disable(editor, editor.disabled);

            // Enable or disable the toolbar buttons
            refreshButtons(editor);

        });

    }

    // refreshButtons - enables or disables buttons based on availability
    function refreshButtons(editor) {

        // Webkit requires focus before queryCommandEnabled will return anything but false
        if (!iOS && webkit && !editor.focused) {
            editor.$frame[0].contentWindow.focus();
            window.focus();
            editor.focused = true;
        }

        // Get the object used for checking queryCommandEnabled
        var queryObj = editor.doc;
        if (ie) {
            queryObj = getRange(editor);
        }

        // Loop through each button
        var inSourceMode = sourceMode(editor);
        $.each(editor.$toolbar.find("." + BUTTON_CLASS), function (idx, elem) {

            var $elem = $(elem),
                button = $.cleditor.buttons[$.data(elem, BUTTON_NAME)],
                command = button.command,
                enabled = true;

            // Determine the state
            if (editor.disabled) {
                enabled = false;
            }
            else if (button.getEnabled) {
                var data = {
                    editor: editor,
                    button: elem,
                    buttonName: button.name,
                    popup: popups[button.popupName],
                    popupName: button.popupName,
                    command: button.command,
                    useCSS: editor.options.useCSS
                };
                enabled = button.getEnabled(data);
                if (enabled === undefined) {
                    enabled = true;
                }
            } else if (((inSourceMode || iOS) && button.name !== "source") ||
                (ie && (command === "undo" || command === "redo"))) {
                enabled = false;
            }
            else if (command && command !== "print") {
                if (ie && command === "hilitecolor") {
                    command = "backcolor";
                }
                // IE does not support inserthtml, so it's always enabled
                if ((!ie && !iege11) || command !== "inserthtml") {
                    try {
                        enabled = queryObj.queryCommandEnabled(command);
                    } catch (err) {
                        enabled = false;
                    }
                }
            }

            // Enable or disable the button
            if (enabled) {
                $elem.removeClass(DISABLED_CLASS);
                $elem.removeAttr(DISABLED);
            } else {
                $elem.addClass(DISABLED_CLASS);
                $elem.attr(DISABLED, DISABLED);
            }

        });
    }

    // restoreRange - restores the current ie selection
    function restoreRange(editor) {
        if (editor.range) {
            if (ie) {
                editor.range[0].select();
            }
            else if (iege11) {
                getSelection(editor).addRange(editor.range[0]);
            }
        }
    }

    // select - selects all the text in either the textarea or iframe
    function select(editor) {
        setTimeout(function () {
            if (sourceMode(editor)) {
                editor.$area.select();
            }
            else {
                execCommand(editor, "selectall");
            }
        }, 0);
    }

    // selectedHTML - returns the current HTML selection or and empty string
    function selectedHTML(editor) {
        restoreRange(editor);
        var range = getRange(editor);
        if (ie) {
            return range.htmlText;
        }
        var layer = $("<layer>")[0];
        layer.appendChild(range.cloneContents());
        var html = layer.innerHTML;
        layer = null;
        return html;
    }

    // selectedText - returns the current text selection or and empty string
    function selectedText(editor) {
        restoreRange(editor);
        if (ie) {
            return getRange(editor).text;
        }
        return getSelection(editor).toString();
    }

    // showMessage - alert replacement
    function showMessage(editor, message, button) {
        var popup = createPopup("msg", editor.options, MSG_CLASS);
        popup.innerHTML = message;
        showPopup(editor, popup, button);
    }

    // showPopup - shows a popup
    function showPopup(editor, popup, button) {

        var offset, left, top, $popup = $(popup);

        // Determine the popup location
        if (button) {
            var $button = $(button);
            offset = $button.offset();
            left = --offset.left;
            top = offset.top + $button.height();
        } else {
            var $toolbar = editor.$toolbar;
            offset = $toolbar.offset();
            left = Math.floor(($toolbar.width() - $popup.width()) / 2) + offset.left;
            top = offset.top + $toolbar.height() - 2;
        }

        // Position and show the popup
        hidePopups();
        $popup.css({
            left: left,
            top: top
        }).show();

        // Assign the popup button and click event handler
        if (button) {
            $.data(popup, BUTTON, button);
            $popup.bind(CLICK, {
                popup: popup
            }, $.proxy(popupClick, editor));
        }

        // Focus the first input element if any
        setTimeout(function () {
            $popup.find(":text,textarea").eq(0).focus().select();
        }, 100);

    }

    // sourceMode - returns true if the textarea is showing
    function sourceMode(editor) {
        return editor.$area.is(":visible");
    }

    // updateFrame - updates the iframe with the textarea contents
    function updateFrame(editor, checkForChange) {

        var code = editor.$area.val(),
            options = editor.options,
            updateFrameCallback = options.updateFrame,
            $body = $(editor.doc.body);

        // Joe McShea - modified to initialize an empty editor to get slightly more consisten
        // behavior across browsers
        if (code.length === 0) {
            code = "<div></div>";
            editor.$area.val(code);
        }

        // Check for textarea change to avoid unnecessary firing
        // of potentially heavy updateFrame callbacks.
        if (updateFrameCallback) {
            var sum = checksum(code);
            if (checkForChange && editor.areaChecksum === sum) {
                return;
            }
            editor.areaChecksum = sum;
        }

        // Convert the textarea source code into iframe html
        var html = updateFrameCallback ? updateFrameCallback(code) : code;

        // Prevent script injection attacks by html encoding script tags
        html = html.replace(/<(?=\/?script)/ig, "&lt;");

        // Update the iframe checksum
        if (options.updateTextArea) {
            editor.frameChecksum = checksum(html);
        }

        // Update the iframe and trigger the change event
        if (html !== $body.html()) {
            $body.html(html);
            $(editor).triggerHandler(CHANGE);
        }

    }

    // updateTextArea - updates the textarea with the iframe contents
    function updateTextArea(editor, checkForChange) {

        var html = $(editor.doc.body).html(),
            options = editor.options,
            updateTextAreaCallback = options.updateTextArea,
            $area = editor.$area;

        // Joe McShea - modified so empty editor results in empty text area
        if (html === "<div></div>") {
            html = "";
        }

        // Check for iframe change to avoid unnecessary firing
        // of potentially heavy updateTextArea callbacks.
        if (updateTextAreaCallback) {
            var sum = checksum(html);
            if (checkForChange && editor.frameChecksum === sum) {
                return;
            }
            editor.frameChecksum = sum;
        }

        // Convert the iframe html into textarea source code
        var code = updateTextAreaCallback ? updateTextAreaCallback(html) : html;

        // Update the textarea checksum
        if (options.updateFrame) {
            editor.areaChecksum = checksum(code);
        }

        // Update the textarea and trigger the change event
        if (code !== $area.val()) {
            $area.val(code);
            $(editor).triggerHandler(CHANGE);
        }

    }

    // Joe McShea - modified to the SPEasyForms instance of jQuery
})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
/*jshint +W016, +W038, +W004 */

///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/jquery.cleditor.sharepoint.js
/*
 * jquery.cleditor.sharepoint plugin to make cleditor look and act like the OOBSharePoint
 * rich text editor (except less buggy/finicky).
 *
 * @copyright 2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery */
(function ($) {

    if (!$) { return; }

    // Define an array of structures describing control key shortcuts
    $.cleditor.buttonShortcuts = {
        key66: {
            name: "bold",
            title: "Bold (Ctrl + B)",
            keyCode: 66,
            shift: false
        },
        key73: {
            name: "italic",
            title: "Italic (Ctrl + I)",
            keyCode: 73,
            shift: false
        },
        key85: {
            name: "underline",
            title: "Underline (Ctrl + U)",
            keyCode: 85,
            shift: false
        },
        key117: {
            name: "underline",
            title: "Underline (Ctrl + U)",
            keyCode: 117,
            shift: false
        },
        key76: {
            name: "alignleft",
            title: "Align Left (Ctrl + L)",
            keyCode: 76,
            shift: false
        },
        key69: {
            name: "center",
            title: "Align Center (Ctrl + E)",
            keyCode: 69,
            shift: false
        },
        key82: {
            name: "alignright",
            title: "Align Right (Ctrl + R)",
            keyCode: 114,
            shift: false
        },
        keyS69: {
            name: "numbering",
            title: "Numbered List (Ctrl + Shift + E)",
            keyCode: 69,
            shift: true
        },
        keyS76: {
            name: "bullets",
            title: "Bulleted List (Ctrl + Shift + L)",
            keyCode: 76,
            shift: true
        },
        keyS77: {
            name: "outdent",
            title: "Decrease Indent (Ctrl + Shift + M)",
            keyCode: 77,
            shift: true
        },
        key77: {
            name: "indent",
            title: "Increase Indent (Ctrl + M)",
            keyCode: 77,
            shift: false
        },
        keyS188: {
            name: "ltr",
            title: "Left to Right (Ctrl + Shift + >)",
            keyCode: 188,
            shift: true
        },
        keyS190: {
            name: "rtl",
            title: "Right to Left (Ctrl + Shift + <)",
            keyCode: 190,
            shift: true
        }
    };
    var buttonShortcuts = $.cleditor.buttonShortcuts;

    // define an array of structures describing sticky buttons
    $.cleditor.stickyButtons = {
        bold: {
            tagNames: "strong"
        },
        italic: {
            tagNames: "em"
        },
        underline: {
            tagNames: "u"
        },
        alignleft: {
            tagNames: "div",
            attrName: "align",
            attrValue: "left"
        },
        center: {
            tagNames: "div",
            attrName: "align",
            attrValue: "center"
        },
        alignright: {
            tagNames: "div",
            attrName: "align",
            attrValue: "right"
        },
        bullets: {
            tagNames: "ul"
        },
        numbering: {
            tagNames: "ol"
        },
        ltr: {
            tagNames: ["div", "ol", "ul", "span", "p"],
            attrName: "dir",
            attrValue: "ltr"
        },
        rtl: {
            tagNames: ["div", "ol", "ul", "span", "p"],
            attrName: "dir",
            attrValue: "rtl"
        },
        source: true
    };
    var stickyButtons = $.cleditor.stickyButtons;

    // Define the right to left button
    $.cleditor.buttons.rtl = {
        name: "rtl",
        stripIndex: 33,
        title: "Right to Left",
        buttonClick: rtl
    };

    // Define the left to right button
    $.cleditor.buttons.ltr = {
        name: "ltr",
        stripIndex: 32,
        title: "Left to Right",
        buttonClick: ltr
    };

    // Define the background button
    $.cleditor.buttons.backgroundcolor = {
        name: "backgroundcolor",
        stripIndex: 34,
        title: "Background Color",
        popupName: "color",
        popupClick: backgroundColor
    };

    // Add the buttons to the default controls before the source button
    $.cleditor.defaultOptions.controls =
        $.cleditor.defaultOptions.controls.replace("source", "ltr rtl source");
    $.cleditor.defaultOptions.controls =
        $.cleditor.defaultOptions.controls.replace("highlight", "highlight backgroundcolor");

    // override the cleditor function to add shortcuts to the button titles (i.e. tooltips)
    var cssLoaded = false;
    $.fn.sharePoint_Original_cleditor = $.fn.cleditor;
    $.fn.cleditor = function (options) {
        if (!cssLoaded) {
            var css = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/2015.01.03/Css/jquery.cleditor.css');
            $("head").append('<link rel="stylesheet" type="text/css" href="' + css + '">');
            cssLoaded = true;
        }
        $.each($(Object.keys(buttonShortcuts)), function (idx, code) {
            var shortcut = buttonShortcuts[code];
            $.cleditor.buttons[shortcut.name].title = shortcut.title;
        });
        return this.sharePoint_Original_cleditor(options);
    };

    // handle rtl clicked
    function rtl(e, data) {
        return setDir(data.editor, "rtl");
    }

    // handle ltr clicked
    function ltr(e, data) {
        return setDir(data.editor, "ltr");
    }

    function backgroundColor(e, data) {
        var editor = data.editor;
        var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
        var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;
        var p = getSelectionContainer(iwin, idoc);
        if (p) {
            var closestBlock = closestBlockInclusive(p, ["div"]);
            if (closestBlock.length > 0) {
                closestBlock.css("background-color", e.target.style.backgroundColor);
            } else {
                $("body", editor.doc).html("<div style='background-color: " +
                    e.target.style.backgroundColor + "'>" + $("body", editor.doc).html() + "</div>");
            }
            editor.updateTextArea(editor);
            editor.focus();
        }
        return false;
    }

    // set the dir attribute of the closest div, span, or paragraph encompassing the
    // current selection range in the editor (adding a div if there is no enclosing element)
    function setDir(editor, dir) {
        var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
        var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;
        var p = getSelectionContainer(iwin, idoc);
        if (p) {
            var closestBlock = closestBlockInclusive(p, ["div", "span", "p"]);
            if (closestBlock.length > 0) {
                closestBlock.attr("dir", dir);
            } else {
                $("body", editor.doc).html("<div dir='" + dir + "'>" + $("body", editor.doc).html() + "</div>");
            }
            editor.updateTextArea(editor);
            editor.focus();
        }
        return false;
    }

    // define a callback for events on the iframe document key down event
    $.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback = $.cleditor.defaultOptions.keyDownCallback;
    $.cleditor.defaultOptions.keyDownCallback = function (e, editor) {
        if (e.keyCode > 17) {
            var key = "key" + (e.shiftKey ? "S" : "") + e.keyCode;
            if (e.type === "keydown" && e.ctrlKey && key in buttonShortcuts) {
                var shortcut = buttonShortcuts[key];
                if (shortcut.name === "ltr") {
                    rtl(e, {
                        editor: editor
                    });
                } else if (shortcut.name === "rtl") {
                    ltr(e, {
                        editor: editor
                    });
                } else {
                    var button = $.cleditor.buttons[shortcut.name];
                    editor.execCommand(button.command, undefined, editor.options.useCSS, e.target);
                }
                e.preventDefault();
                e.keyCode = 0;
                return false;
            }
            else if ($.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback) {
                refreshStickyButtons(editor);
                return $.cleditor.defaultOptions.cleditor_sharepoint_keyDownCallback(e, editor);
            }
            else {
                refreshStickyButtons(editor);
            }
        }
        return true;
    };

    // define a callback for events on the button div click event
    $.cleditor.defaultOptions.cleditor_sharepoint_buttonClickCallBack = $.cleditor.defaultOptions.buttonClickCallBack;
    $.cleditor.defaultOptions.buttonClickCallBack = function (e, data) {
        if (data.buttonName in stickyButtons && !stickyButtons[data.buttonName].closestSelector) {
            if (buttonIsSelected(data.button)) {
                buttonSelect(data.button, false);
            }
            else {
                buttonSelect(data.button, true);
            }
        }
    };

    // hoverEnter - replace the hover enter callback to change the colors and handle sticky buttons
    $.cleditor.defaultOptions.hoverEnter = function (e) {
        var $div = $(e.target).closest("div");
        if ($div.css("background-color") !== "rgb(255, 229, 204)") {
            $div.css("background-color", "rgb(255, 204, 153)");
        }
    };

    // hoverLeave - replace the hover leave callback to change the colors and handle sticky buttons
    $.cleditor.defaultOptions.hoverLeave = function (e) {
        var $div = $(e.target).closest("div");
        if ($div.css("background-color") !== "rgb(255, 229, 204)") {
            $div.css("background-color", "transparent");
        }
    };

    // determine which sticky buttons should be highlighted based on the text range selected in the editor
    function refreshStickyButtons(editor) {
        $.each($(Object.keys($.cleditor.stickyButtons)), function (idx, key) {
            var stickyButton = stickyButtons[key];
            if (stickyButton.tagNames) {
                var button = editor.$main.find("div[buttonName='" + key + "']");

                var idoc = editor.$frame[0].contentDocument || editor.$frame[0].contentWindow.document;
                var iwin = editor.$frame[0].contentWindow || editor.$frame[0].contentDocument.defaultView;

                var p = getSelectionContainer(iwin, idoc);
                if (p) {
                    var tagNames = stickyButton.tagNames.constructor === Array ? stickyButton.tagNames : [stickyButton.tagNames];
                    var closestParent = closestBlockInclusive(p, tagNames);
                    if (closestParent.length > 0) {
                        if (stickyButton.attrName && stickyButton.attrValue) {
                            if (closestParent.attr(stickyButton.attrName) === stickyButton.attrValue) {
                                buttonSelect(button, true);
                            }
                            else {
                                buttonSelect(button, false);
                            }
                        }
                        else {
                            buttonSelect(button, true);
                        }
                    }
                    else {
                        buttonSelect(button, false);
                    }
                }
            }
        });
    }

    // get the closest enclosing block of the current text selection range
    // that matches any of the tagNames passed in.
    function closestBlockInclusive(elem, tagNames) {
        var closestBlock;
        if (elem.tagName && $.inArray(elem.tagName.toLowerCase(), tagNames) > -1) {
            closestBlock = $(elem);
        }
        else {
            closestBlock = $(elem).closest(tagNames.join());
        }
        return closestBlock;
    }

    // select or deselect a button div
    function buttonSelect(button, on) {
        if (!on && buttonIsSelected(button)) {
            $(button).css("background-color", "transparent");
        }
        else if (on && !buttonIsSelected(button)) {
            $(button).css("background-color", "rgb(255, 229, 204)");
        }
    }

    // return true if a button div is selected, false otherwise
    function buttonIsSelected(button) {
        if ($(button).css("background-color") === "rgb(255, 229, 204)") {
            return true;
        }
        return false;
    }

    // get the parent element of the current selection range
    function getSelectionContainer(win, doc) {
        var container = null;
        if (win.getSelection) {  // all browsers, except IE before version 9
            var selectionRange = win.getSelection();
            if (selectionRange.rangeCount > 0) {
                var range = selectionRange.getRangeAt(0);
                container = range.commonAncestorContainer;
            }
        }
        else {
            if (doc.selection) {   // Internet Explorer
                var textRange = doc.selection.createRange();
                container = textRange.parentElement();
            }
        }
        return container;
    }

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
///#source 1 1 /Elements/SPEasyFormsAssets/JavaScript/jquery.cleditor.xhtml.js
/*!
 CLEditor XHTML Plugin v1.0.1
 http://premiumsoftware.net/cleditor
 requires CLEditor v1.3.0 or later
 
 Copyright 2010, Chris Landowski, Premium Software, LLC
 Dual licensed under the MIT or GPL Version 2 licenses.

 Based on John Resig's HTML Parser Project (ejohn.org)
 http://ejohn.org/files/htmlparser.js
 Original code by Erik Arvidsson, Mozilla Public License
 http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
*/

(function ($) {

    if (!$) { return; }

    // Save the previously assigned callback handler
    var oldCallback = $.cleditor.defaultOptions.updateTextArea;

    // Wireup the updateTextArea callback handler
    $.cleditor.defaultOptions.updateTextArea = function (html) {

        // Fire the previously assigned callback handler
        if (oldCallback) {
            html = oldCallback(html);
        }

        // Convert the HTML to XHTML
        return $.cleditor.convertHTMLtoXHTML(html);
    };

    // Expose the convertHTMLtoXHTML method
    $.cleditor.convertHTMLtoXHTML = function (html) {

        // Regular Expressions for parsing tags and attributes

        // var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
        //	  endTag = /^<\/(\w+)[^>]*>/,
        //	  attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

        // Replaced \w+ with [\w+-]+ in the startTag and attr regular expressions just before =.
        // This allows the parsing of attributes containing dashes '-'.
        var startTag = /^<(\w+)((?:\s+[\w+-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
          endTag = /^<\/(\w+)[^>]*>/,
              attr = /([\w+-]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

        // Empty Elements - HTML 4.01
        var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

        // Block Elements - HTML 4.01
        var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

        // Inline Elements - HTML 4.01
        var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

        // Elements that you can, intentionally, leave open (and which close themselves)
        var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

        // Attributes that have their values filled in disabled="disabled"
        var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

        // Special Elements (can contain anything)
        var special = makeMap("script,style");

        // Stack of open tag names
        var stack = [];
        stack.last = function () {
            return this[this.length - 1];
        };

        var index, match, last = html, results = "";

        // Cycle through all html fragments
        while (html) {

            // Make sure we're not in a script or style element
            if (!stack.last() || !special[stack.last()]) {

                // Comment
                if (html.indexOf("<!--") === 0) {
                    index = html.indexOf("-->");
                    if (index >= 0) {
                        results += html.substring(0, index + 3);
                        html = html.substring(index + 3);
                    }
                }

                    // End tag
                else if (html.indexOf("</") === 0) {
                    match = html.match(endTag);
                    if (match) {
                        html = html.substring(match[0].length);
                        match[0].replace(endTag, parseEndTag);
                    }
                }

                    // Start tag
                else if (html.indexOf("<") === 0) {
                    match = html.match(startTag);
                    if (match) {
                        html = html.substring(match[0].length);
                        match[0].replace(startTag, parseStartTag);
                    }
                }

                    // Text
                else {
                    index = html.indexOf("<");
                    results += (index < 0 ? html : html.substring(0, index));
                    html = index < 0 ? "" : html.substring(index);
                }
            }

                // Handle script and style tags
            else {
                html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function (all, text) {
                    text = text.replace(/<!--(.*?)-->/g, "$1").replace(/<!\[CDATA\[(.*?)]]>/g, "$1");
                    results += text;
                    return "";
                });
                parseEndTag("", stack.last());
            }

            // Handle parsing error
            if (html == last) {
                throw "Parse Error: " + html;
            }
            last = html;
        }

        // Clean up any remaining tags
        parseEndTag();

        // Replace depreciated tags
        replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>");
        replace(/<i>(.*?)<\/i>/g, "<em>$1</em>");

        //-----------------
        // Helper Functions
        //-----------------

        // makeMap - creates a map array object from the passed in comma delimitted string
        function makeMap(str) {
            var obj = {}, items = str.split(",");
            for (var i = 0; i < items.length; i++) {
                obj[items[i]] = true;
            }
            return obj;
        }

        // parseStartTag - handles an opening tag
        function parseStartTag(tag, tagName, rest, unary) {

            // IE generates tags in uppercase
            tagName = tagName.toLowerCase();

            if (tagName === "p") {
                tag = tag.replace("<p", "<div");
                tagName = "div";
            }

            // Close all inline tags before this block tag
            if (block[tagName]) {
                while (stack.last() && inline[stack.last()]) {
                    parseEndTag("", stack.last());
                }
            }

            // Close the self closing tag prior to this one
            if (closeSelf[tagName] && stack.last() == tagName) {
                parseEndTag("", tagName);
            }

            // Push tag onto the stack
            unary = empty[tagName] || !!unary;
            if (!unary) {
                stack.push(tagName);
            }

            // Load the tags attributes
            var attrs = [];

            rest.replace(attr, function (match, name) {
                var value = arguments[2] ? arguments[2] :
                          arguments[3] ? arguments[3] :
                          arguments[4] ? arguments[4] :
                          fillAttrs[name] ? name : "";

                attrs.push({
                    name: name,
                    escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
                });

            });

            // Append the tag to the results
            results += "<" + tagName;

            for (var i = 0; i < attrs.length; i++) {
                results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
            }

            results += (unary ? "/" : "") + ">";

        }

        // parseEndTag - handles a closing tag
        function parseEndTag(tag, tagName) {
            var pos;
            // If no tag name is provided, clean shop
            if (!tagName) {
                pos = 0;
            }
                // Find the closest opened tag of the same type
            else {
                tagName = tagName.toLowerCase();
                if (tagName === "p") {
                    tag = tag.replace("p", "div");
                    tagName = "div";
                }
                for (pos = stack.length - 1; pos >= 0; pos--) {
                    if (stack[pos] == tagName) {
                        break;
                    }
                }
            }

            if (pos >= 0) {
                // Close all the open elements, up the stack
                for (var i = stack.length - 1; i >= pos; i--) {
                    results += "</" + stack[i] + ">";
                }

                // Remove the open elements from the stack
                stack.length = pos;
            }

        }

        // replace - replace shorthand
        function replace(regexp, newstring) {
            results = results.replace(regexp, newstring);
        }

        // Return the XHTML
        return results;
    };

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
