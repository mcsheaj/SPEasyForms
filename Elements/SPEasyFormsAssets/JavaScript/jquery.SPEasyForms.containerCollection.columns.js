/*
 * SPEasyForms.containerCollection.columns - Object representing a multi-column container.
 *
 * @requires jQuery v1.11.1 
 * @copyright 2014 Joe McShea
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
			var result = [];
			var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
			var outerTableClass = "speasyforms-container speasyforms-columns";
			$("#" + opt.containerId).append("<table id='" + outerTableId +
				"' class='" + outerTableClass + "'></table>");

			var condensedFieldCollections = [];
			$.each(opt.currentContainerLayout.fieldCollections, function (idx, fieldCollection) {
				var newCollection = {};
				newCollection.name = fieldCollection.name;
				newCollection.fields = [];
				$.each(fieldCollection.fields, function (i, field) {
					var row = containerCollection.rows[field.fieldInternalName];
					if (row && !row.fieldMissing) {
						newCollection.fields.push(field);
					}
				});
				if (newCollection.fields.length > 0) {
					condensedFieldCollections.push(newCollection);
				}
			});

			var rowCount = 0;
			$.each(condensedFieldCollections, function (idx, fieldCollection) {
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
									if (tdh.html() === "Content Type") {
										currentRow.row.find("td.ms-formbody").prepend(
											"<h3 class='ms-standardheader'><nobr>" + tdh.html() + "</nobr></h3>");
									}
									else {
										currentRow.row.find("td.ms-formbody").prepend(
											tdh.html());
									}
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

			return result;
		},

		postTransform: function (options) {
			var opt = $.extend({}, $.spEasyForms.defaults, options);
			var outerTableId = "spEasyFormsColumnsOuterTable" + opt.index;
			$("#" + outerTableId + " tr.speasyforms-columnrow").each(function () {
				if ($(this).find("tr:not([data-visibilityhidden='true']) td.ms-formbody").length === 0) {
					$(this).hide();
				}
			});
		}
	};

	containerCollection.containerImplementations.columns = $.extend({}, baseContainer, columns);

})(spefjQuery);
