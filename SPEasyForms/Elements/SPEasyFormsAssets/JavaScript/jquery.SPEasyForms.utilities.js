/*
 * SPEasyForms.utilites - general helper functions for SPEasyForms
 *
 * @requires jQuery.SPEasyForms.2015.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
/* global spefjQuery, _spPageContextInfo */
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
            if (window.location.search.length > 0 &&
                window.location.search.indexOf('?') >= 0) {
                var nvPairs = window.location.search.slice(
                    window.location.search.indexOf('?') + 1).split('&');
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
