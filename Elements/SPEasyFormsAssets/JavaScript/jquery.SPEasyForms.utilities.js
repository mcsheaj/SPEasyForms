/*
 * SPEasyForms.utilites - general helper functions for SPEasyForms
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */
(function ($, undefined) {

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
        },
        
        siteRelativePathAsAbsolutePath: function(path) {
            var site = _spPageContextInfo.siteServerRelativeUrl;
            if(path[0] !== '/') {
                path = '/' + path;
            }
            if(site !== '/') {
                path = site + path;
            }
            return path;
        },
        
        webRelativePathAsAbsolutePath: function(path) {
            var site = $.spEasyForms.sharePointContext.getCurrentSiteUrl();
            if(path[0] !== '/') {
                path = '/' + path;
            }
            if(site !== '/') {
                path = site + path;
            }
            return path;
        }
    };
    var utils = $.spEasyForms.utilities;

})(spefjQuery);
