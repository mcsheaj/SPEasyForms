(function($) {

    if(!$) return;

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

    // Add the button to the default controls before the source button
    $.cleditor.defaultOptions.controls = $.cleditor.defaultOptions.controls
        .replace("source", "ltr rtl source");

    // handle rtl clicked
    function rtl(e, data) {
        var editor = data.editor;
        $(editor.doc).contents().find("body").css("direction", "rtl");
        editor.options.bodyStyle = "direction: rtl;"
        editor.focus();
        return false;
    }

    // handle ltr clicked
    function ltr(e, data) {
        var editor = data.editor;
        $(editor.doc).contents().find("body").css("direction", "ltr");
        editor.options.bodyStyle = "direction: ltr;"
        editor.updateTextArea(editor);
        editor.focus();
        return false;
    }
	
	// Save the previously assigned callback handler
	var oldCallback = $.cleditor.defaultOptions.updateTextArea;
	
	// Wireup the updateTextArea callback handler
	$.cleditor.defaultOptions.updateTextArea = function(html) {
	
	    // Fire the previously assigned callback handler
	    if (oldCallback)
	        html = oldCallback(html);
		  
	    return html;
	}

})(typeof (spefjQuery) === 'undefined' ? null : spefjQuery);
