(function ($, undefined) {
    $.spEasyForms.userDefaults = {
        // path to the default jquery-ui style sheet
        jQueryUITheme: "~sitecollection/Style Library/SPEasyFormsAssets/~version/Css/jquery-ui-redmond/jquery-ui.css",
        // path to the spEasyForms style sheet
        css: "~sitecollection/Style Library/SPEasyFormsAssets/~version/Css/speasyforms.css"
    };
    $.spEasyForms.defaults = $.extend({}, $.spEasyForms.defaults, $.spEasyForms.userDefaults);
})(spefjQuery);