/*
 * SPEasyForms - modify SharePoint forms using jQuery (i.e. put fields on
 * tabs, show/hide fields, validate field values, modify the controls used
 * to enter field values etc.)
 *
 * @version 2014.01.o
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

/* global spefjQuery:true, ssw, PreSaveItem:true, _spPageContextInfo, ssw_init */

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

(function($, undefined) {

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
    var cache = (typeof(ssw) !== 'undefined' ? ssw.get() : undefined);

    ////////////////////////////////////////////////////////////////////////////
    // Main entry point is init.
    ////////////////////////////////////////////////////////////////////////////
    $.spEasyForms = {
        defaults: {
            // use cross-page caching
            useCache: (typeof(ssw) !== 'undefined' || typeof(ssw_init) !== 'undefined'),
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
                $.spEasyForms.sharePointContext.initAsync(opt);
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
        transform: function(opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
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
            $.spEasyForms.containerCollection.transform(opt);
            // Override the core.js PreSaveItem function, to allow containers 
            // and/or adapters to react to validation errors.
            if (typeof(PreSaveItem) !== 'undefined') {
                var originalPreSaveItem = PreSaveItem;
                PreSaveItem = function() {
                    var result = $.spEasyForms.containerCollection.preSaveItem();
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
            if (_spPageContextInfo.webUIVersion === 4) {
                $(".ui-widget input").css("font-size", "8pt");
            }
        },

        /********************************************************************
         * See if we have a configuration for the current list context and setup
         * the editor for the current configuration (or the default configuration).
         ********************************************************************/
        toEditor: function(opt) {
            opt.currentConfig = $.spEasyForms.configManager.get(opt);
            if (_spPageContextInfo.webUIVersion === 4) {
                $("#spEasyFormsContent").css({
                    position: "static",
                    "overflow-y": "visible",
                    "overflow-x": "visible"
                });
                $("div.speasyforms-panel").css({
                    width: "auto",
                    height: "auto",
                    position: "static",
                    "overflow-y": "visible",
                    "overflow-x": "visible"
                });
                $("td.speasyforms-form").css("padding-left", "0px");
                $(".s4-title-inner").css("display", "none");
                $(".speasyforms-ribbon").css("position", "fixed");
                $("#s4-bodyContainer").css("overflow-x", "visible");
                $(".s4-notdlg").hide();
                $("#spEasyFormsOuterDiv").css({
                    "margin-left": "-160px",
                    "margin-top": "88px"
                });
                $("#RibbonContainer").append("<h3 class='speasyforms-breadcrumbs' style='position:fixed;top:0px;color:white;'><a href='" + opt.source + "' style='color:white;'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h3>");
                $("tr.speasyforms-sortablefields, tr.speasyforms-sortablerules").css("font-size", "0.9em");
            }
            else {
                $(".ms-cui-topBar2").prepend("<h2 class='speasyforms-breadcrumbs'><a href='" + opt.source + "'>" + opt.currentListContext.title + "</a>  -&gt; SPEasyForms Configuration</h2>");
            }
            $.each(opt.currentListContext.contentTypes.order, function(i, ctid) {
                if(ctid.indexOf("0x0120") !== 0) {
                    $("#spEasyFormsContentTypeSelect").append("<option value='" +
                        opt.currentListContext.contentTypes[ctid].id + "'>" + 
                        opt.currentListContext.contentTypes[ctid].name + "</option>");
                }
            });
            $("#spEasyFormsContentTypeSelect").change(function() {
                delete $.spEasyForms.containerCollection.rows;
                delete $.spEasyForms.sharePointContext.formCache;
                opt.contentTypeChanged = true;
                $.spEasyForms.containerCollection.toEditor(opt);
            });
            $.spEasyForms.containerCollection.toEditor(opt);
            $(window).on("beforeunload", function() {
                if(!$("#spEasyFormsSaveButton img").hasClass("speasyforms-buttonimgdisabled")) {
                    return "You have unsaved changes, are you sure you want to leave the page?";
                }
            });
            spEasyForms.appendContext(opt);
            $("div.speasyforms-panel").height($(window).height()-180);
            if (_spPageContextInfo.webUIVersion === 4) {
                $("#spEasyFormsContent").height($(window).height()-180).width($(window).width()-445);
            }
            else {
                $("#spEasyFormsContent").height($(window).height()-180).width($(window).width()-325);
            }
            $(window).resize(function() {
                $("div.speasyforms-panel").height($(window).height()-180);
                if (_spPageContextInfo.webUIVersion === 4) {
                    $("#spEasyFormsContent").height($(window).height()-180).width($(window).width()-445);
                }
                else {
                    $("#spEasyFormsContent").height($(window).height()-180).width($(window).width()-325);
                }
            });
            $('#spEasyFormsRibbon').show;
        },

        /********************************************************************
         * Add a link to the SPEasyForms settings page to an OOB list settings
         * page (listedit.aspx).
         ********************************************************************/
        insertSettingsLink: function(opt) {
            var generalSettings = $("td.ms-descriptiontext:contains('description and navigation')").closest("table");
            if (generalSettings.length > 0) {
                var source = window.location.href;
                if (source.indexOf("start.aspx#") >= 0) {
                    source = $.spEasyForms.utilities.webRelativePathAsAbsolutePath(source.substring(source.indexOf('#') + 1));
                }
                var settings = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath("/Style Library/SPEasyFormsAssets/2014.01.o/Pages/SPEasyFormsSettings.aspx") +
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

            if (typeof(ssw) === 'undefined' && typeof(ssw_init) !== 'undefined') {
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
                options.jQueryUITheme = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/2014.01.o/Css/jquery-ui/jquery-ui.css');
            }
            $("head").append(
                '<link rel="stylesheet" type="text/css" href="' + options.jQueryUITheme + '">');

            if (options.css === undefined) {
                options.css = $.spEasyForms.utilities.siteRelativePathAsAbsolutePath('/Style Library/SPEasyFormsAssets/2014.01.o/Css/speasyforms.css');
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
            if (typeof(ssw) !== 'undefined') {
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
        appendContext: function() {
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