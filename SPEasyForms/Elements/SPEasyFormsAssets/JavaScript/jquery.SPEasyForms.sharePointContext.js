/*
 * SPEasyForms.sharePointContext - object for capturing SharePoint context information
 * using web services.
 *
 * @requires jQuery.SPEasyForms.2015.01.beta 
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
