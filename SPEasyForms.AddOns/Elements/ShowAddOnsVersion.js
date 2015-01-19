/*
 * SPEasyForms ShowAddOnsVersion - show the current AddOns version on the
 * About dialog.
 *
 * @version 2015.00.05
 * @requires SPEasyForms v2014.01 
 * @copyright 2014-2015 Joe McShea
 * @license under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 */

/* global spefjQuery */
(function ($, undefined) {

    // return without doing anything if SPEasyForms has not been loaded
    if (!$.spEasyForms) return;

    // only operate on the settings page
    if (window.location.href.toLowerCase().indexOf("speasyformssettings.aspx") > -1) {
        $().ready(function () { 
            $("b:contains('Version: 2014.01')").parent().append("<br /><b>AddOns: 2015.00.05</b>");
        });
    }

})(spefjQuery);
