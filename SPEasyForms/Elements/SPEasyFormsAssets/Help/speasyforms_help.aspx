<!DOCTYPE html>
<html>

<head>
    <title>SPEasyForms Help</title>
    <script type="text/javascript" src="../JavaScript/jquery.js"></script>
    <style>
        html, body {
            margin: 0px;
            padding: 0px;
            overflow: hidden;
            width: auto;
            font: 1em/1.462em 'Segoe UI', Tahoma, Arial, Helvetica, sans-serif;
            color: rgb(37, 51, 64);
            background-color: #fcfcfc;
        }
        a, a:hover {
            text-decoration: none;
            color: darkblue;
        }
        .menu-outer {
            width: 300px;
            float: left;
            overflow: hidden;
            -webkit-border-radius: 20px;
            -moz-border-radius: 20px;
            border-radius: 20px;
            border: 1px solid lightblue;
        }
        .menu-inner {
            width: 285px;
            padding-left: 15px;
            padding-right: 15px;
            float: left;
            background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RlZWZmZiIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgICA8c3RvcCBvZmZzZXQ9Ijc2JSIgc3RvcC1jb2xvcj0iIzk4YmVkZSIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgPC9saW5lYXJHcmFkaWVudD4KICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJ1cmwoI2dyYWQtdWNnZy1nZW5lcmF0ZWQpIiAvPgo8L3N2Zz4=);
            background: -moz-linear-gradient(left, #deefff 0%, #98bede 76%);
            background: -webkit-gradient(linear, left top, right top, color-stop(0%, #deefff), color-stop(76%, #98bede));
            background: -webkit-linear-gradient(left, #deefff 0%, #98bede 76%);
            background: -o-linear-gradient(left, #deefff 0%, #98bede 76%);
            background: -ms-linear-gradient(left, #deefff 0%, #98bede 76%);
            background: linear-gradient(to right, #deefff 0%, #98bede 76%);
            filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#deefff', endColorstr='#98bede', GradientType=1);
        }
        .menu {
            padding-right: 20px;
            overflow-x: hidden;
            overflow-y: auto;
        }
        .active-item {
            background-color: lightyellow;
        }
        .contents {
            width: auto;
            overflow-x: hidden;
            overflow-y: auto;
        }
        .inner-contents {
            width: 630px;
            margin: 30px;
        }
        .section-div {
            display: none;
        }
        .inner-menu {
            display: none;
        }
        ul li {
            list-style-type: square;
        }
        ul li ul li {
            list-style-type: disc;
        }
    </style>
    <script type="text/javascript">
        var helpQuery = jQuery.noConflict(true);

        (function($, undefined) {
            $.spEasyFormsHelp = {
                init: function() {
                    var contents = parseContents();
                    createMenu(contents);
                    arrangeContents(contents);

                    var section = "Introduction";
                    var params = getRequestParameters();
                    if ("section" in params) {
                        section = params.section;
                    }
                    showActiveSection(section);

                    fullHeight(".menu-outer");
                    fullHeight(".menu-inner");
                    fullHeight(".menu");
                    fullHeight(".contents");

                    $(".menu-link").click(function() {
                        var linkSection = $(this).parent()[0].id.replace("Item", "");
                        showActiveSection(linkSection);
                        if(history.pushState) {
                            history.pushState({section: linkSection}, '');
                        }
                        return false;
                    });
                    
                    window.onpopstate = function(event) {
                        if(event && event.state && event.state.section) {
                            showActiveSection(event.state.section);
                        }  
                        else {
                            showActiveSection("Introduction");
                        }
                        return false;
                    };
                    
                    $("img").each(function(i, item){
                        var it = $(item);
                        if($(it.parent()).is("a")) {
                            $(it.parent()).attr("href", it.attr("src")).attr("target", "_blank");
                        }
                    });
                }
            };

            showActiveSection = function(section) {
                $(".section-div").hide();
                $(".inner-menu").hide();
                $("li").removeClass("active-item");
                $("#" + section + "Item").addClass("active-item");
                if ($($("#" + section + "Item").parent()[0]).hasClass("inner-menu")) {
                    $("#" + section + "Item").parent().show();
                } else {
                    $("#" + section + "Item").find("ul").show();
                }
                $("#" + section + "Div").show();
                $(".contents").scrollTop(0);
            }

            getRequestParameters = function() {
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
            };

            createMenu = function(contents) {
                var currentListId = "IntroductionList";
                var outerListId, currentItemId;
                $(".menu").append("<ul id='" + currentListId + "' class='outer-menu'></ul>");
                $.each($(contents), function(idx, current) {
                    if (idx > 0 && (current.tagName === "h3" && contents[idx - 1].tagName !== "h3")) {
                        outerListId = currentListId;
                        currentListId = current.title.replace(/[^a-zA-Z0-9]/g, "") + "List";
                        $("#" + currentItemId).append("<ul id='" + currentListId + "' class='inner-menu'></ul>");
                    } else if (idx > 0 && (current.tagName === "h2") && contents[idx - 1].tagName !== "h2") {
                        currentListId = outerListId;
                        outerListId = undefined;
                    }
                    currentItemId = current.title.replace(/[^a-zA-Z0-9]/g, "") + "Item";
                    $("#" + currentListId).append("<li id='" + currentItemId + "'>" +
                        "<a href='javascript:void(0)' class='menu-link'>" + current.title + "</a></li>");
                });
            };

            arrangeContents = function(contents) {
                $.each($(contents), function(idx, current) {
                    var currentId = current.title.replace(/ /g, "_").replace(/[^a-zA-Z0-9]/g, "") + "Div";
                    $(".inner-contents").append("<div id='" + currentId + "' class='section-div'></div>");
                    $.each($(current.nodes), function(idxj, node) {
                        $("#" + currentId).append(node);
                    });
                });
            };

            parseContents = function() {
                var result = [];
                var currentDiv;
                $(".inner-contents").children().each(function(idx, child) {
                    var current;
                    if (result.length === 0) {
                        current = {};
                        current.title = "Introduction";
                        current.tagName = "h2";
                        current.nodes = [];
                        current.nodes.push(child);
                        result.push(current);
                    } else if (child.tagName.toLowerCase() === "h2" || child.tagName.toLowerCase() === "h3") {
                        current = {};
                        current.title = child.innerHTML;
                        current.tagName = child.tagName.toLowerCase();
                        current.nodes = [];
                        current.nodes.push(child);
                        result.push(current);
                    } else {
                        current = result[result.length - 1];
                        current.nodes.push(child);
                    }
                });
                return result;
            };

            fullHeight = function(selector) {
                $(selector).height($(window).height());
                $(window).resize(function() {
                    $(selector).height($(window).height());
                });
            };
        })(helpQuery);

        helpQuery().ready(function() {
            helpQuery.spEasyFormsHelp.init();
        });
    </script>
</head>

<body>
    <div class="menu-outer">
        <div class="menu-inner">
            <div class="menu">
                <h2>SPEasyForms Help</h2>
            </div>
        </div>
    </div>
    <div class="contents">
        <div class="inner-contents">
            <p>SPEasyForms is a GUI tool for applying jQuery constructs to Out of Box (OOB) SharePoint forms without necessarily knowing anything about JavaScript or HTML or CSS. You configure SPEasyForms through a drag and
                drop IDE-like list settings page, which is available on the list ribbon or as a link on the list settings page of compatible SharePoint list types (currently all lists except Surveys and Discussion Boards). The things you can configure
                fall into 3 broad categories:</p>
            <ul>
                <li>Containers - the ability to organize fields in a form in some way; current implementations include:
                    <ul>
                        <li>Tabs - an implementation of jQueryUI tabs</li>
                        <li>Accordion - an implementation of jQueryUI Accordion</li>
                        <li>Columns - the ability to put fields into 2 or more columns instead of one per row (technically, one or more, but one column doesn't really buy you much)</li>
                    </ul>
                </li>
                <li>Conditional Visibility - control when a column is visible based on the SharePoint group membership of the current user and/or the current value of another field in the form</li>
                <li>Field Control Adapters - modify the controls users see in the form to input data; current implementations include:
                    <br />
                    <ul>
                        <li>Cascading Look Ups - join two look up fields such that the values available in one look up are trimmed based on the value selected in another look up</li>
                        <li>Autocomplete - provide type ahead functionality in a text field based on values pulled from a field in another list on the same site</li>
                    </ul>
                </li>
            </ul>
            <p>The rest of this user manual will consist of an Overview section (system requirements, installation, and a laundry list of UI buttons and views), and sections for Containers, Conditional Visibility, and Field Control Adapters. In
                those last 3 sections, we'll follow a scenario (i.e. state some basic requirements and how those requirements can be satisfied using SPEasyForms). This scenario will be a Contacts list with multiple content types (Contact and Employee).
            </p>
            <h2>1. Overview</h2>
            <p>People learn differently. This section is primarily reference information. Some people want to scan this first to get an idea of what's available for the 10,000 foot view. Others want to jump right into using the thing and go back to the reference
                material on an as needed basis. I've chosen to put this up front in my document, but if you fall into the latter group and you already know how to install a sandbox solution, you can certainly skip this section and jump to section
                <strong>2. Containers</strong>.If you just need help installing it but then want to jump in, read the next two brief sections and then skip to section
                <strong>2. Containers</strong>.</p>
            <h3>1.1 System Requirements</h3>
            <p>SPEasyForms was developed to run on Office 365 and SharePoint 2010 and 2013. It has been pretty well tested on all three platforms, meaning all of the functionality has been tested on all three platforms, but not necessarily on every list and library type available on all three platforms.&nbsp; Testing was done with Internet Explorer 9, 10, and 11, as well as Firefox 24, 28, and 32 and Chrome 35.&nbsp; That does not mean those are the only browsers we plan to support, but there is a limit to how many browsers a small team can reasonably test. If you find an issue with a particular browser, report it in the issues list on CodePlex and we will address it as quickly as possible. There are no plans to support SharePoint 2007.</p>
            <h3>1.2 Installation</h3>
            <p>In order to install SPEasyForms, you must have sufficient privileges to install a sandbox solution and activate a site collection feature (that means you need to be an SCA).</p>
            <p>Anyway, to get started, download the latest recommended release from <a href="https://speasyforms.codeplex.com/">
https://speasyforms.codeplex.com</a> and follow these steps to install it:</p>
            <ol>
                <li>Go to the root site of your site collection and go to <strong>Site Settings –&gt; Web Designer Galleries –&gt; Solutions</strong>.
                </li>
                <li>Click the <strong>Upload Solution</strong> button in the ribbon.</li>
                <li>Browse to the <strong>SPEasyForms.wsp</strong> file you downloaded from CodePlex and hit
                    <strong>OK</strong>.</li>
                <li>When the upload finishes, click the <strong>Activate</strong> button from the ribbon.
                </li>
            </ol>
            <p>Now that wasn't too painful, was it? To confirm that it appears to be working, go to a list in your site collection and look for a button in the
                <strong>Settings</strong> panel of the <strong>List, Library</strong>or <strong>Calendar</strong> ribbon labeled SPEasyForms:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921080">
                    <img title="image" src="images/Download_016.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="176" width="604">
                </a>
            </p>
            <p>Click on the the icon and you should see the SPEasyForms Settings page, pictured in the next section.</p>
            <p>If you've gotten this far, and the settings page looks OK, the thing is installed. If you've already encountered a problem, go to CodePlex and open a new thread in the discussion board with your issue. I generally try to respond pretty quickly,
                and as I build up a list of frequently encountered issues I'll update this document with a troubleshooting section.</p>
            <h3>1.3 The List Settings Page</h3>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921311">
                    <img title="image" src="images/Download_008.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="526" width="604">
                </a>
            </p>
            <p>The list settings page is pictured above. It is comprised of four parts:</p>
            <ol>
                <li>Bread Crumbs – starts with the name of the list, which is a link back to the page that brought you here, followed by the page title, and optionally followed by the current view. 
                </li>
                <li>The Ribbon – most of the high level functionality is controlled by buttons organized on the ribbon. Each button will be described in the next section.
                </li>
                <li>Properties Pane – on the left-hand side of the main content area, this is where you configure individual fields in the form.
                </li>
                <li>Main Content Area – when the page first comes up, this shows a WYSIWYG (what you see is what you get...well, mostly anyway) on the right-hand side of the main content area. This provides a visual representation of the form as currently
                    configured. You can change the view to display a list of field visibility rules or field adapters using buttons on the ribbon.
                </li>
            </ol>
            <h3>1.4 Ribbon Buttons</h3>
            <p>This section is just a laundry list of the ribbon buttons intended primarily for reference. Most of the functionality of SPEasyForms is exposed through the following ribbon buttons:</p>
            <table border="1" width="599">
                <tbody>
                    <tr>
                        <td valign="top" width="207">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921084">
                                    <img title="image" src="images/Download_042.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="77" width="50">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="384">Saves the configuration as JSON in a text file in the Site Assets library of the same site where the list resides. This button is disabled until there are changes that need to be saved.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="212">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921086">
                                    <img title="image" src="images/Download_036.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="78" width="53">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="381">Return to the page that brought you here, discarding any uncommitted changes. If you do have uncommitted changes, you will be presented with a confirmation dialog.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="215">
                            <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921088">
                                <img title="image" src="images/Download_009.png" alt="image" style="float:none; padding-top:0px; padding-left:0px; margin:15px auto 0px; display:block; padding-right:0px; border-width:0px" border="0" height="47" width="89">
                            </a>
                        </td>
                        <td valign="top" width="379">If there are multiple content types for the current list, this drop down lets you choose which one you are currently editing. The details of multiple content types will be explained later.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="217">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921090">
                                    <img title="image" src="images/Download_010.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="24" width="108">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="378">Add a container to the form for organizing fields, like tabs, accordion, or multi-column table.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="218">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921092">
                                    <img title="image" src="images/Download_025.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="46" width="104">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="377">Undo or redo a change. Undo is only enabled when there are uncommitted changes that have not be undone. Redo is only enabled when you have undone at least one change.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="219">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921094">
                                    <img title="image" src="images/Download_044.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="76" width="49">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Show the visual representation of the form as currently configured in the main content area. This is the default view.

                        </td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921096">
                                    <img title="image" src="images/Download_057.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="77" width="76">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Show the list of conditional visibility rules in the main content area. You are switched to this view automatically when you add or edit conditional visibility rules.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921098">
                                    <img title="image" src="images/Download_018.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="78" width="64">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Show the list of field adapters in the main content area. You are switched to this view automatically when you add or edit field adapters.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921100">
                                    <img title="image" src="images/Download_017.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="51" width="77">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Expand or collapse the containers in the properties pane. When collapsed, only the title shows, otherwise all field collections and fields show. You can also collapse individual containers in the properties pane by double clicking
                            on them.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921102">
                                    <img title="image" src="images/Download_031.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="75" width="49">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Export the configuration file. This just opens up the JSON text file containing the configuration in a new browser window. This button is disabled if you have never saved a configuration for the current list or you have uncommitted
                            changes to the current configuration.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921104">
                                    <img title="image" src="images/Download_054.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="78" width="52">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Import a configuration. This just opens a dialog with a large text area where you can paste JSON text. It is primarily intended to backup a configuration or copy the configuration between two similar lists (i.e. a contacts list
                            in test to a contacts list in production). Muck with the JSON manually AT YOUR OWN RISK. The import completely overwrites the current configuration, but is not committed until you hit save and can be rolled back with undo.
                            This button is disabled when you have uncommitted changes to the current list.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921106">
                                    <img title="image" src="images/Download_005.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="31" width="94">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">SPEasyForms uses a cache in the browser to store context information about the current site and it's lists for the duration of the browser session. This can be confusing because the form will not reflect changes you have made to
                            the list settings in another window. To get around this, click this button to clear the browser cache and reload the page. Note that this cache is different than the cache the browser uses to cache pages and images, clearing
                            that cache will have no affect on SPEasyForms.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921108">
                                    <img title="image" src="images/Download_024.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="32" width="94">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Reload the current form in Verbose mode. This primarily shows fields that don't exist in the current content type and highlights them in red with a tool tip saying they may have been deleted. Normally, these fields are hidden and
                            assumed to be valid in another content type. Also, when in verbose mode, SPServices methods that support the debug parameter are run with debug true, so they popup messages on errors (normally they fail quietly).
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921110">
                                    <img title="image" src="images/Download_051.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="78" width="50">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Present a dialog with the version and license for the currently installed software. Also provides credits and license terms for third party libraries used/distributed as part of SPEasyForms. SPEasyForms is distributed under the
                            MIT License (MIT), and so far all third party libraries that it uses are also distributed under the MIT License (MIT) or are public domain.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="220">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921112">
                                    <img title="image" src="images/Download_030.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="77" width="48">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="376">Brings up this user guide in a separate browser window.</td>
                    </tr>
                </tbody>
            </table>
            <h3>1.5 The Properties Pane</h3>
            <p>The left-hand side of the main content area is the properties pane. Most of the configuration of SPEasyForms is done from the properties pane.
            </p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921128">
                    <img title="image" src="images/Download_023.png" alt="image" style="float:left; padding-top:0px; padding-left:0px; margin:0px 20px 0px 0px; display:inline; padding-right:0px; border-width:0px" align="left" border="0" height="576" width="284">
                </a>
            </p>
            <p>It contains a gray box per container, with the container type as the title. You can collapse all containers (i.e. show only the title) using the buttons on the ribbon. You can also collapse individual containers by double clicking on the container.</p>
            <p>A container contains one or more field collections, which are just logical groupings of fields that are used by the container in a container specific manner. In other words, the tabs container draws one tab per field collection, and puts the
                fields in each field collection on the appropriate tab. The field collection title is also used as the tab name in the form. The columns container creates a table with X columns where X is the number of field collections, and puts the
                fields in each field collection on the appropriate column, and the field collection title is not displayed at all in the form, it is only displayed on the settings page. You can also collapse individual field collections by double clicking
                on the title of the field collection.</p>
            <p>It may seem like I'm spending a lot of time talking about collapsing, but it is important because you move fields between containers and collections, and reorder fields within a collection by dragging and dropping them. When you have a lot
                of fields, and containers, and field collections, and you want to move something from the bottom of the form to the top, it is a lot easier if you collapse stuff that is between the two containers you're currently working with. And if
                you don't have a lot of fields, you probably don't need something like SPEasyForms, although it can still be useful if you have requirements like conditional visibility.
            </p>
            <p>The containers also have buttons that have specific meanings depending on their context/scope (i.e. the buttons are generally to the right of what they configure or the title of what they configure, and can be for configuring the container
                itself, a field collection, or an individual field). These buttons are described in the following table:</p>
            <table border="1" cellpadding="5" cellspacing="2" width="621">
                <tbody>
                    <tr>
                        <td align="center" valign="top" width="130"><strong>Button</strong>
                        </td>
                        <td align="center" valign="top" width="130"><strong>Scope</strong>
                        </td>
                        <td align="center" valign="top" width="351"><strong>Description</strong>
                        </td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921130">
                                    <img title="image" src="images/Download_048.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="33" width="35">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Container</td>
                        <td valign="top" width="351">Add one or more field collections.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921132">
                                    <img title="image" src="images/Download.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="31" width="29">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Container</td>
                        <td valign="top" width="351">Delete this container, all fields are returned to the default form. There is no confirmation, but undo works just fine.

                        </td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921134">
                                    <img title="image" src="images/Download_014.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="32" width="33">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Field Collection</td>
                        <td valign="top" width="351">Change the title of the field collection (i.e. tab name).</td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921136">
                                    <img title="image" src="images/Download_029.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="31" width="29">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Field Collection</td>
                        <td valign="top" width="351">Delete this field collection, all fields are returned to the default form. Again, there is no confirmation, but undo is your friend.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921138">
                                    <img title="image" src="images/Download_041.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="24" width="24">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Field</td>
                        <td valign="top" width="351">Configure field visibility rules for this field.</td>
                    </tr>
                    <tr>
                        <td valign="top" width="130">
                            <p align="center">
                                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921140">
                                    <img title="image" src="images/Download_002.png" alt="image" style="padding-top:0px; padding-left:0px; margin:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="23" width="26">
                                </a>
                            </p>
                        </td>
                        <td valign="top" width="130">Field</td>
                        <td valign="top" width="351">Add or configure the field adapter for this field. If there are no field adapters available for a particular field type, this button will not appear next to fields of that type.</td>
                    </tr>
                </tbody>
            </table>
            <h3>1.6 Limitations</h3>
            <p>SPEasyForms is intended to work on the OOB new, edit, and display forms for most list types. It does not work on Discussions or Surveys, and there are other list types it hasn't been adequately tested on. It also does not allow you to configure
                content types based on folder. Folders rarely have enough metadata to require such a solution, but the bigger issue is that Microsoft subclasses folder for some pretty strange content types (like document set or OneNote document) that
                are so different from other OOB list types that it would nearly double the code to deal with them.</p>
            <p>The reason for these limitations is fairly obvious, in that SPEasyForms modifies the OOB forms by directly manipulating the Document Object Model (DOM) and/or applying CSS to DOM elements. That means it needs to make some assumptions about
                the structure of a document. But SharePoint, and particularly SharePoint designer, allow you to customize the DOM to your hearts content. And in the case of lists like Survey, Microsoft has modified the DOM themselves enough that the OOB
                form does not look much like the DOM for a generic list. For instance, SharePoint normally produces forms that consist of a table with a row for each field. But you can modify the XSLT for a DataFormWebPart such that the fields are displayed
                as floating divs with fixed positions and there is no table whatsoever. And there's technically nothing wrong with that, but you will certainly have made the form unusable by SPEasyForms because you've broken the parser. The rest of this
                section will attempt to describe the DOM elements and structure that SPEasyForms depends on. If you are not going to muck with the structure of the form at all, you don't really need to worry about these details.</p>
            <p>So the basic constraints are as follows:</p>
            <ul>
                <li>The form should be in a table with the CSS class <font face="Courier New"><strong>ms-formtable</strong></font>.
                </li>
                <li>Each row should contain a single field, and be comprised of two table cells with the CSS classes
                    <font face="Courier New"><strong>ms-formheader</strong></font> and <font face="Courier New">
<strong>ms-formbody</strong></font> in that order.</li>
                <li>The row should contain somewhere in it's source the texts [fieldname=”&lt;the field display name&gt;”], [fieldinternalname=”&lt;the field internal name”], and [fieldtype=”&lt;sharepoint field type&gt;”]. The names in these expressions
                    are case insensitive, the values are not.</li>
                <li>The actual name of the ASPX page should contain <strong>new</strong>,

                    <strong>
edit</strong>, or <strong>disp, </strong>case insensitive, and it would be helpful if it was actually the new form if it contains new, the edit form if it contains edit, etc.
                </li>
            </ul>
            <p>These constraints are all met by most OOB list forms. They are not met, however, by SharePoint designer generated custom forms, unless you do some manual messaging of the generated XSLT. I have updated the DOM parser such that it can deal
                with SharePoint designer generated forms assuming you haven't mucked with the XSLT too much. The constraints for designer generated forms are as follows:</p>
            <ul>
                <li>The form should be in a table<font face="Courier New"> <font face="Calibri">(I'll add the class</font>
                    <strong>ms-formtable </strong>
                    </font><font face="Calibri">to it if not already present).
</font>
                </li>
                <li>Each row should contain a single field, and be comprised of two table cells with the CSS classes
                    <font face="Courier New"><strong>ms-formheader</strong></font> and <font face="Courier New">
<strong>ms-formbody</strong></font> in that order.</li>
                <li>The row should contain somewhere in it's source a NOBR element that contains the display name of the field. We'll look up the internal name and type using the list schema.
                </li>
                <li>The actual name of the ASPX page should contain <strong>new</strong>, <strong>
edit</strong>, or <strong>disp, </strong>case insensitive, and it would be helpful if it was actually the new form if it contains new, the edit form if it contains edit, etc.
                </li>
            </ul>
            <p>OOB designer generated forms meet these constraints. If either of these lists of constraints are met by your forms, they should work with SPEasyForms.
            </p>
            <p>Anyway, now that you've got it installed, and I've finished the overview, it's time to start looking at our scenario and take it for a spin.
            </p>
            <h2>2. Containers</h2>
            <p>
                As mentioned previously, the rest of this document is going to follow a scenario, starting with a list and some requirements, and showing how SPEasyForms can be used to satisfy those requirements. This section will describe the list that will be the starting
                point for our scenario.
            </p>
            <p>I generally start regression testing with a Contacts list, because that's an OOB list type that has enough fields that the form looks pretty bad as is and could use some restructuring. In order to demonstrate all of the current capabilities
                of SPEasyForms, I'm going to make the following changes to the list:</p>
            <ul>
                <li>Turn on allow management of content types in the list settings.</li>
                <li>Create a site content type called <strong>Employee</strong> using

                    <strong>Contact</strong> as the parent content type, add the following columns to it, and add it to the list content types:
                    <ul>
                        <li><strong>EmployeeId</strong> - single line of text.</li>
                        <li><strong>HireDate</strong> - date.</li>
                        <li><strong>EmergencyContact</strong> - enhanced rich text.</li>
                        <li><strong>HomeAddress</strong> - enhanced rich text.</li>
                    </ul>
                </li>
                <li>Create the following list columns, choosing 'Add to all content types' when you do:
                    <ul>
                        <li><strong>Code</strong> - a single select choice field (Blue, Green, and Red for the allowed choices).
                        </li>
                        <li><strong>SalesRegion</strong> - look up to a list called SalesRegion where the title field has a display name of SalesRegion.
                        </li>
                        <li><strong>SalesDivision</strong>- look up to a list called SalesDivision where the title field has a display name of SalesDivision.
                        </li>
                        <li><strong>SalesState</strong> - look up to a list called SalesState where the title field has a display name of SalesState.
                        </li>
                    </ul>
                </li>
            </ul>
            <p>These last 3 fields are to demonstrate cascading look ups, which we won't get to until section
                <strong>4. Field Control Adapters. </strong>I'll describe the reference lists in more detail when we get to it, so if you're not sure how to set them up you can skip it until then. However, if you've ever setup cascading look ups for SPServices
                before, it's just like that because I'm using the SPServices library to implement cascading look ups.</p>
            <p>Anyway, now that we have all of this stuff configured, go to the new form for an Employee:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921303">
                    <img title="image" src="images/Download_056.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="841" width="604">
                </a>
            </p>
            <p>I know what you're thinking...prrreeettty! That brings us to the first requirement for our scenario:</p>
            <ol>
                <li>Make the form pretty.</li>
            </ol>
            <p>Now I'll be the first to admit this isn't a very good requirement, but if you've been working in this business for a while you probably recognize it as a pretty common one. So you resist the urge to call the customer stupid and start pitching
                ideas. Maybe we could organize some of the fields into tabs? You start white boarding and come up with a design that the customer seems to like. Maybe pretty is going a bit far but it's hopefully more visually appealing and functional
                at least. That's what containers are all about so lets configure one.</p>
            <h3>2.1 Columns</h3>
            <p>The columns container just lets you organize fields into two or more side by side columns (technically it can be 1 or more, but 1 column doesn't really gain you much). To add a columns container:</p>
            <ul>
                <li>Click the <strong>Add</strong> button.</li>
            </ul>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=876356">
                    <img title="image" src="images/Download_011.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="150" width="289">
                </a>
            </p>
            <ul>
                <li>Select <strong>Columns </strong>from the drop down list and click <strong>Add</strong>.
                </li>
            </ul>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921313">
                    <img title="image" src="images/Download_049.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border-width:0px" border="0" height="195" width="379">
                </a>
            </p>
            <p>* Note: for this particular container, these column names are not used in the form at all, they are only displayed in the editor, so use whatever you want; I usually just put in column numbers.</p>
            <ul>
                <li>Enter column names one per line and hit OK.</li>
            </ul>
            <p>The settings page should now look like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921315">
                    <img title="image" src="images/Download_039.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="572" width="604">
                </a>
            </p>
            <p>The first thing to notice is that nothing really changed on the WYSIWIG side of the form. You might think you just need to scroll down and you'll see columns, but trust me nothing changed. This is because containers that have no fields are
                hidden. This is a trick that you can use to your advantage when configuring multiple content types for a single list, but I'll save that discussion for the end of this section.</p>
            <p>In the properties pane, however, you'll now see 2 containers, the second one being a columns container with two empty field collections. Once you have more
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921317">
                    <img title="image" src="images/Download_015.png" alt="image" style="float:right; padding-top:0px; padding-left:0px; margin:10px 0px 10px 8px; display:inline; padding-right:0px; border-width:0px" align="right" border="0" height="222" width="244">
                </a>
                than one container, you can reorder the containers via drag and drop. In the picture to the right I've dragged the columns container above the default form (after collapsing all containers, I might have mentioned how to do that earlier). There's still
                no change to the WYSIWIG, to see it there you have to put some fields in at least one of the two field collections so lets start doing that.
            </p>
            <p>First expand the containers. Now you can drag fields from the default form and drop them on the field collections in the columns container. You can drag fields from any field collection to any other field collection, or even reorder the fields
                within a field collection via drag and drop. You can only drag fields one at a time, which can be a little tedious but you have to admit it's still easier than coding a custom solution. I may try to implement a multi-select drag and drop
                in a future version, but for now it's one at a time. I'm going to put 2 or three fields in each column, after which my settings page looks like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921319">
                    <img title="image" src="images/Download_027.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="506" width="604">
                </a>
            </p>
            <p>Now there are some changes to the form view. I have 5 fields arranged in 2 columns followed by the default form. Of course the form view isn't really a WYSIWIG, it's just structurally close. It doesn't draw any input controls, the boxes on
                the right-hand side are just the form body table cells with some CSS to give it a border, which becomes apparent when you see the columns container in the form view, because in addition to moving the fields into a multi-column table, the
                columns container moves the field label into the form body cell placed above the input control to save horizontal space. It also applies some CSS to shorten
                <font face="Courier New"><strong>ms-long</strong></font> input controls, when and only when they're on a columns container, again to save on vertical space. To see what it really looks like you need to open up the new form on the list again,
                but first hit the save button in the editor or you'll be utterly underwhelmed by the dramatic lack of changes to the form. Once you've saved, the new form should look something like:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921321">
                    <img title="image" src="images/Download_040.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="563" width="604">
                </a>
            </p>
            <p>I would be lying at this point if I was to say that we'd achieved anything even close to pretty, but we're making some progress and it took a lot less time to configure it then it took to write this section. But the real power of containers
                is that you can put as many as you want on a page and mix and match them any way you want. To demonstrate, add another columns container to the form with 4 columns, drag it just below the first columns container, and add the four fields
                Code, SalesRegion, SalesDivision, and SalesState to it, one per field collection. Save it and refresh the new form and it should look something like:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=921323">
                    <img title="image" src="images/Download_059.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="492" width="604">
                </a>
            </p>
            <p>Again, its not particularly sexy, but it&#39;s starting to show some potential. With just the columns container I can create a wide variety of grid view type layouts, limited only by the horizontal size of the controls and how wide I&#39;m willing to let the form get. And let&#39;s face it, everyone knows most user&#39;s have a display with more horizontal real estate than vertical and nobody likes to scroll (at least maybe everybody except the guys who wrote the first SharePoint forms ;).
            </p>
            <p>Anyway, the basic idea behind containers is to organize fields in a way that maximizes screen real estate, and the Columns container provides some ability to do just that. But the other containers, tabs and accordion, have even more potential
                to maximize screen real estate, so lets quickly see how they work. Since we hopefully have the basics down, I'm going to move a little quicker through those sections.</p>
            <h3>2.2 Tabs</h3>
            <p>Tabs are configured in the same way as columns, in fact so is accordion, so I'm not going to go into the same step by step description of how to configure them like I did for columns, I'll just give you a table of tab names and the fields
                to put on each tab and then show what the editor looks like if you configure it correctly. The tabs I'm going to configure look like this:</p>
            <table style="height:95px; width:447px" border="1" cellpadding="3" cellspacing="2" width="447">
                <tbody>
                    <tr>
                        <th style="vertical-align:top; text-align:center">Tab Name</th>
                        <th style="vertical-align:top; text-align:center">Fields</th>
                    </tr>
                    <tr>
                        <td>Address</td>
                        <td>
                            <p>Address</p>
                            <p>City</p>
                            <p>State/Province</p>
                            <p>ZIP/Postal Code</p>
                            <p>Country</p>
                        </td>
                    </tr>
                    <tr>
                        <td>Phone</td>
                        <td>
                            <p>Business Phone</p>
                            <p>Mobile Number</p>
                            <p>Fax Number</p>
                            <p>HR</p>
                        </td>
                    </tr>
                    <tr>
                        <td>HR</td>
                        <td>&nbsp;</td>
                    </tr>
                </tbody>
            </table>
            <p>Leave the HR tab empty for now. Once you've configured these tabs, the editor should look like this:</p>
            <p>
                <img src="images/Download_050.png" alt="" height="527" width="600">
            </p>
            <p>Note that the tabs are fully functional, and that the HR tab is not displayed at all in the WYSIWIG. Just like empty containers are hidden, generally empty parts of containers are hidden too. Also note that I snuck in a change and moved the
                field content type to one of the columns containers.</p>
            <h3>2.3 Accordion</h3>
            <p>The accordion is more or less just like tabs except that headers are stacked vertically taking up more vertical real estate, and all content areas are collapsed initially taking up less vertical real estate. This makes the accordion more appropriate
                for optional fields of lesser importance. Configure the accordion as follows:
            </p>
            <table style="height:95px; width:447px" border="1" cellpadding="3" cellspacing="2" width="447">
                <tbody>
                    <tr>
                        <th style="vertical-align:top; text-align:center">Header Name</th>
                        <th style="vertical-align:top; text-align:center">Fields</th>
                    </tr>
                    <tr>
                        <td>Notes &amp; Attachments</td>
                        <td>
                            <p>Notes</p>
                            <p>Attachments</p>
                        </td>
                    </tr>
                    <tr>
                        <td>E-Address</td>
                        <td>
                            <p>Email Address</p>
                            <p>Web Page</p>
                        </td>
                    </tr>
                    <tr>
                        <td>HR</td>
                        <td>&nbsp;</td>
                    </tr>
                </tbody>
            </table>
            <p>Again, leave the HR content area empty. Once you've configured the accordion, the editor looks like:</p>
            <p>
                <img src="images/Download_037.png" alt="" height="504" width="600">
            </p>
            <p>&nbsp;</p>
            <p>Now beauty is in the eye of the beholder, but I still think pretty is a stretch. For pretty, you're going to need a designer, I'm a coder. Or at least tell me exactly what you want, I can make it work, my short comings are that I think functional
                is pretty. I used to do UI design with intentionally hideous color schemes in order to force the customer to tell me what they want. I kind of stopped doing that when one time they just said ship it.</p>
            <p>Anyway, I think we've achieved the goal of making a messy form more visually appealing and functional. If you disagree, move some stuff around, add some containers, make it your own.</p>
            <p>So it's taken me hours to write this document so far. It's probably taken you 30 minutes or so to read it up to this point, depending on a number of factors like attention span, and weather your trying to follow along with a SharePoint site
                open in another tab, etc. But once you get familiar with the interface, you could configure a form like this from scratch in 2-3 minutes tops. Being able to satisfy a requirement as vague as 'make the form pretty' in a few minutes is pretty
                nice.
            </p>
            <h3>2.4 The Finished Product...Almost</h3>
            <p>We're pretty much done with the basic structure and layout of the form. Go ahead and go to the new form for your list and it should look like this (assuming you've saved your changes of course):</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922017">
                    <img title="image" src="images/Download_019.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border-width:0px" border="0" height="533" width="604">
                </a>
            </p>
            <p>So what's with this ...Almost crap? OK, I know I'm not fooling anybody, you can all see the next header, I've dropped plenty of hints, and we haven't configured any of the fields specific to the Employee content type. If you go back to the
                list and open the new Employee form, you'll see the Employee specific fields at the bottom of the form drawn just the way SharePoint would usually draw them. That's because they are on the default form, and in our SPEasyForms configuration
                we put the default form at the bottom of the page. If you drag the default form to the top of the containers in the editor, save your configuration, and reload the page you'll see these fields are at the top of the form. You may want to
                leave some fields on the default form; you may not. If you don't, read the next section which will tell you how to configure multiple content types.</p>
            <h3>2.5 Multiple Content Types</h3>
            <p>If you skipped the overview and you've just been following along without being particularly inquisitive and clicking on stuff I haven't told you about yet, you may have noticed that at no point in following this scenario did you see the Employee
                specific fields anywhere in the editor. That's because when the editor loads it brings up the default content type. But given your recent experience with opening the new Employee form, you should understand some things about how SPEasyForms
                deals with multiple content types:
            </p>
            <ol>
                <li>There is only one configuration per SharePoint list.</li>
                <li>Fields that commonly exist in multiple content types are only configured once, and appear in the same place in the forms of all content types.
                </li>
                <li>Fields that don't exist in the currently selected content type are not displayed in the editor and skipped when transforming a form without raising any kind of error.
                </li>
                <li>As previously mentioned, containers or parts of containers that don't have any visible fields for the current content type are hidden.
                </li>
                <li>Finally, to change the currently selected content type, find the content type drop down on the ribbon and select the one you want.
                </li>
            </ol>
            <p>And wait...and wait...OK, should be done by now unless SharePoint is particularly slow where you are. The wait is because the first time a content type is selected I fetch information about it from a web service. There is no visual indication
                of what I'm doing, the screen just freezes for a few seconds. I should probably fix that with some kind of spinning/whirling thing in a future release, but for now it's good enough for me.</p>
            <p>Once the web service returns its data, any fields from the previous content type that don't exist in the new content type are removed from the editor, and of course any fields specific to the new content type are added to the editor. If they've
                never been configured before, they are added to the default form container. If you don't see them, you might need to expand this container. Once the data has been fetched, it is cached in the browser session so there is no wait switching
                back and forth between content types, but not in the browsers page cache, so clearing the page cache will have no effect. If you modify the content type in this or another browser after it has been cached, to see your changes in the editor
                you need to hit the clear cache button in the ribbon, which will reload the page (save any changes first).</p>
            <p>The configuration JSON structure has room to easily expand to allow the configuration for a given content type to be ‘divorced' from the list configuration allowing multiple configurations for the same list, one per content type, but I haven't
                decided if that is even desirable yet. If I get requests for it or I decide it would be useful for me, I might add it in some future release. But I decided to implement multiple content types the way I did, not because I‘m lazy, but because
                of my personal experience with how I use multiple content types in a single list. Usually, I put multiple content types in the same list because they are more the same than different. If two content types are mostly different (i.e. share
                few or no fields), I generally put them in different lists anyway, it's not like they can usefully share many views. And if they're mostly the same, I want the forms to be mostly the same.</p>
            <p>So switch to the Employee content type in the editor now and you should see the Employee specific fields appear in the default form container. If you don't, try expanding the default form container. Now drag a couple of these fields onto the
                HR tab, and the other two onto the HR content area of the accordion. Save your changes and refresh or reopen the new Employee form, and you should now see the HR tab/content area with the employee specific fields on them. Go back to the
                new Contact form and you should still see the HR tab and content area are hidden. So your new Employee form should look something like this:</p>
            <p>
                <img src="images/Download_045.png" alt="" height="720" width="600">
            </p>
            <p>With the following caveats:</p>
            <ul>
                <li>I didn't tell you which fields to place on which HR content area, so yours may not look quite like this.
                </li>
                <li>I opened the HR tab and expanded the HR content area on the accordion before taking the snapshot in order to fully show what changed. The form loads with the Address tab selected and the accordion fully collapsed to conserve vertical real
                    estate.
                </li>
            </ul>
            <p>You now know everything you need to know about configuring multiple content types in SPEasyForms, we are truly done with modifying the form structure, and thus we are done with containers.</p>
<h3>2.6&nbsp;Validation</h3>
<p>So what happens when a required field is on a tab and the user hits submit without providing a value?&nbsp;</p>
<ul>
<li>First, any tab that has a validation error is highlighted by giving the tab header a red border.</li>
<li>Also, the first tab with a validation error is automatically selected.</li>
<li>The OOB validation messages that are normally displayed with a field are still displayed with the field.</li>
</ul>
<p>Accordion works the same way, and Columns does not need any special logic for this because it does not have any hidden content areas.</p>
            <h2>3. Conditional Visibility</h2>
            <p><strong>Note: this is NOT a security mechanism. It is appropriate for
 workflow-type visibility requirements. If disclosure of fields to the 
wrong people would be considered to be any kind of a security breach, no
 front end solution is appropriate. A clever/technically
 savvy user can get to fields that are supposed to be hidden from them 
using the JavaScript debugger or DOM inspector, or in SharePoint 2010 
even just viewing source in the browser. Even if I could fix that, they 
could write their own JavaScript, call the web
 services, and view the raw data.</strong>
            </p>
            <p>With that caveat out of the way, I implemented containers first when I started working on SPEasyForms, because it's the lowest hanging fruit of forms customization. Pretty much every time I've worked on a form for a customer, the list of fields
                quickly got long, the form started looking pretty bad, and somebody threw out the old ‘make the form pretty' requirement in some guise or another.
            </p>
            <p>Second on the low hanging fruit list in my opinion is conditional visibility. I get a lot of requirements like I don't want people in group X to see the phone number field. Or I only want people in group Y to see the phone number field. Or
                the address field should be on the edit form but not the new form. Or even I want people to be able to edit the title field if A=B, but it should be read only when A=C, where A is another field in the same form. Conditional visibility
                in SPEasyForms is intended to satisfy all of these requirements and more.</p>
            <p>And they are all pretty simple. Most of the time you can get away with only a few state handlers, hide the field, make the field read only, or leave the field alone. The dialog to allow the rules to be configured is most of the work. And yet,
                they are surprisingly difficult to explain in documentation. I've done it several times in several different ways and ended up with several different sets of misunderstandings. I've come to think that it is so because I usually start right
                off trying to satisfy realistic requirements, which usually requires multiple rules for a single field, without first explaining the kind of things you can configure in an individual rule in a vacuum. So I mix in the concepts of individual
                rules and rule collections, it all runs together a bit, and there are usually too many ambiguities in my description.</p>
            <p>I find the best way is as follows:</p>
            <ol>
                <li>Explain the kind of rules that can be configured based on the type of condition, more or less in a vacuum, and don't worry if the rule by itself doesn't seem that useful.
                </li>
                <li>Explain a few rules with multiple conditions.</li>
                <li>Explain how rules are matched and executed and when processing stops for a given field, when there are multiple rules for a given field (i.e. precedence of operations).
                </li>
                <li>Provide step by step instructions for creating a few rules on a given field, and then explain the result of creating those fields in the form (i.e. reinforce precedence of operations).
                </li>
                <li>Throw in a few more complex examples. This is where we'll get back to our scenario.
                </li>
            </ol>
            <p>So that's what we're going to do. But first, here are the step by step instructions to start configuring a field visibility rule for a given field, because I really don't want to provide these same steps over and over in the examples to come:
            </p>
            <ul>
                <li>On the properties pane, find the field you want to create a rule for and click on the little key icon button to the right of the field. This brings up the
                    <strong>Conditional Visibility Dialog</strong> for the field:</li>
            </ul>
            <p>
                <img src="images/Download_043.png" alt="" height="141" width="600">
            </p>
            <ul>
                <li>Now click on the + icon button. This brings up the <strong>Add/Edit Visibility Rule Dialog.</strong>
                </li>
            </ul>
            <h3>3.1 Simple Rules</h3>
            <p>For a new rule, the <strong>Add/Edit Visibility Dialog</strong> comes up looking like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=876486">
                    <img title="image" src="images/Download_006.png" alt="image" border="0" height="184" width="600">
                </a>
            </p>
            <p>There is a lot of stuff here, most of which we're going to ignore for a moment. The only required field on this dialog is the State, which determines what you want done to the field if this rule is executed. Choose Hidden as the State and
                click the OK button. The Conditional Visibility Dialog now looks like this:</p>
            <p>
                <img src="images/Download_055.png" alt="" height="165" width="600">
            </p>
            <p>This rules just says hide the field from everyone on all forms with no conditions. As a stand alone rule, this is rarely going to make sense. if you never want it displayed or editable, why did you add the field in the first place? I suppose
                you could be setting the field through a workflow and using it in a view or something like that. However, once we start looking at multiple rules and precedence, you may find that you are writing rules like this pretty frequently as part
                of a set of rules for the same field, but we'll get to that in a bit.</p>
            <p>Looking back at the <strong>Add/Edit Rule Dialog </strong>you can see the forms to which the rule applies, and New, Edit, and Display are all checked by default. Click the gear icon next to the rule to edit it, remove the check on the Edit
                and Display, click OK. Now the rule says hide the field on the new form with no other conditions. This rule is more likely to make sense even as a stand alone rule. It satisfies all of the 'the address field should be on the edit form
                but not the new form' type requirements, and I've certainly been given real requirements like this before. If you click the
                <strong>OK</strong> button on the <strong>Visibility Rules Dialog</strong> and the
                <strong>Save</strong> button on the ribbon, you can go to the new Contact form and the
                <strong>Full Name</strong> column is now gone. If you save a Contact and go to the edit form, it's back. That's about it for the simplest of rules.

            </p>
            <h3>3.2 Rules Based on SharePoint Group Membership (and Author)</h3>
            <p>The next class of requirements that I wanted to satisfy is the 'some people should see it, others should not' type of requirements, which is the most common use case for conditional visibility. To accomplish this, you need to put the people
                in question in SharePoint groups and then create a rule using those groups, like so:</p>
            <p>
                <img src="images/Download_007.png" alt="" height="236" width="600">
            </p>
            <p>The applies to control is an entity editor, much like SharePoint's people picker, which mostly works but I know still needs some work too. It allows you to start entering a SharePoint group name, provides auto complete on contains case insensitive,
                and when you select a group it adds an entity. To remove an entity click the X on the entity. Where it falls short is that if you type some text but don't resolve it to an entity, when you click
                <strong>OK</strong> it silently throws away your text instead of raising a validation error, even if you typed the full group name. I may fix that before the first release, I may not, but either way I know it is a little weak and will fix
                it eventually, and for now I've warned you about it so <em>caveat emptor</em>.</p>
            <p>Back on point, the above rule says hide the field for members and visitors with no other conditions. This will show the field to anybody not in those groups, so it satisfies some of this type of requirement. For more complex cases, you need
                multiple rules, and blah, blah, blah, we'll get to it soon I promise.</p>
            <p>The other thing to note is the author check box in the applies to area. This is there to allow you to apply a rule specifically to the original author of the item (i.e. whoever opened the new form and saved it). It's not that uncommon to get
                requirements like make this field editable by the author but read only for everybody else, and without this check box there would be no way to generally satisfy this requirement. Of course, once again you'd need multiple blah, blah, blah,
                because a single rule can only have one state.</p>
            <h3>3.3 Rules Based on the Value of Another Field</h3>
            <p>The last class of individual conditional requirements I wanted to satisfy is rules like 'make the field hidden if Code is red, read only if Code is green, and editable if Code is blue. This will obviously require multiple rules and we're still
                not ready for that, but the basic building block for this type of rule is something like:</p>
            <p>
                <img src="images/Download_013.png" alt="" height="234" width="600">
            </p>
            <p>Which is make the field hidden when Code equals red. Note that all three of the comparison operators built in are case insensitive. I went back and forth on this a little, but mostly I question the usefulness of having a form where red and
                Red are both options but mean different things, so I think I settled on the most common use case. In addition to
                <strong>Equals</strong>, the built in comparison operators include <strong>Matches</strong> and
                <strong>NotMatches</strong>. If the value is literal, then these are equivalent to
                <strong>Contains</strong> or <strong>NotContains</strong>. But <strong>Matches</strong> and
                <strong>NotMatches</strong> also accept and will evaluate JavaScript style regular expressions. If you're not familiar with regular expressions, start binging because this document is not going to attempt to explain them, but a really verbose/obtuse
                way to achieve the equivalent of what's above would be 
            </p>
            <p>"And When Code <strong>Matches ^[Rr][Ee][Dd]$</strong>"
            </p>
            <p>
                (unnecessarily verbose in this case because the comparison is already case insensitive, but if you know anything about regular expressions you get the idea). It's also important to understand what you are comparing too. You're comparison is against the
                text that is displayed when the field is read only (or more accurately, the HTML). It is not against the internal representation of the data as it is stored in SharePoint. So don't try matching a user with something like "2;#Joe McShea",
                that's not going to work. What's displayed for a user is a link to the userdisp.aspx page with the text of the display name, so that is what you're comparing against. If you are not sure what to look for, make the field read only for everyone,
                open the edit form for an item that has a value in the field, and look at the source in the DOM inspector or debugger of your browser.
            </p>
            <p>One of the cool things about rules based on the value of another field is that they will be executed immediately as the value of the other field changes on the form. So save the above rule, open the new Contact form, and change the <strong>Code</strong> to
                Red and the
                <strong>Full Name</strong> field should disappear. Change it back to Green and it reappears. But in the interest of full disclosure I should note that I started off this paragraph with a half truth. This only works for some types of 'other fields'
                right now. I've tested it on check boxes, radio buttons, drop downs, multi-select choices, and even single and multi-line text fields and it works. But I also know it doesn't work on rich text, enhanced rich text, and date fields,
                and I haven't even bothered to test some field types. I suspect where it doesn't work it is because Microsoft has their own change listeners on the controls and they are swallowing the event, or something like that, but I haven't looked
                too hard to prove that at this point. What it comes down to is, I satisfied most of the requirements for this type of functionality that I've encountered in the real world just making this work with choice fields, so I've moved on for now.</p>
            <p>The final thing of interest for this type of rule as a stand alone rule is that you can have more than one condition in a rule. Up to 3 right now just to simplify the UI, but the back end supports an unlimited number and I may make the UI
                more flexible later on. You add conditions by clicking the + icon button, and multiple conditions in a rule are
                <strong>ANDed</strong> together, so:</p>
            <p>
                <img src="images/Download_022.png" alt="" height="252" width="600">
            </p>
            <p>says when Code Equals red <strong>AND</strong> State/Province matches VA. You can do
                <strong>OR</strong> as well, but only with multiple rules, and blah, blah, blah, if I'm sick of saying it I imagine you're sick of hearing it.</p>
            <h3>3.4 Rules that Combine the Concepts Described Previously</h3>
            <p>So there are basically three fundamental types of conditions as described in the three previous sections,
                <strong>Applies To</strong>, <strong>Forms</strong>, and <strong>And When</strong>. You can specify any combination of these conditions in a single rule. When more than one of these types of conditions is specified, they are
                <strong>ANDed</strong> together. And I've already said it in the previous sections, but it bears repeating succinctly and in one place to avoid confusion; each of these types of conditions can contain multiple comparisons, and when they
                do, weather it is an
                <strong>AND</strong> or <strong>OR</strong> is handled differently for each, so to reiterate:</p>
            <ul>
                <li><strong>Applies To</strong>: specify Author and one or more groups, or multiple groups, and it is an
                    <strong>OR</strong> comparison, i.e. 'member <strong>OR</strong> visitor'.</li>
                <li><strong>Forms</strong>: specify more than than one form and it is an <strong>
OR</strong> comparison, and if this isn't intuitive to you, how in the heck do you imagine somebody could be on the New
                    <strong>AND</strong> Edit forms at the same time?</li>
                <li><strong>And When</strong>: specify more than one condition and it's an <strong>
AND</strong> comparison, i.e. 'Code Equals red <strong>AND</strong> State/Province Equals VA'. You can achieve
                    <strong>OR</strong> with these conditions only through multiple rules, which thank heaven we're finally ready to talk about.
                </li>
            </ul>
            <h3>3.5 Multiple Rules for a Field and Precedence</h3>
            <p>Consider the following rules for the <strong>Full Name</strong> field:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922584">
                    <img title="image" src="images/Download_032.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border:0px" border="0" height="214" width="604">
                </a>
            </p>
            <p>How do you imagine these rules will be interpreted? Hint: not as they were intended to be interpreted I'm guessing. Rules are evaluated as follows:
            </p>
            <ul>
                <li>Rules are evaluated in the same order in which the appear in the UI.</li>
                <li>If a rule is evaluated to be true, it's state handler is executed.

                </li>
                <li>Once a state handler has been executed, all rule processing for the current field is terminated until another event occurs which starts the rule evaluation processing at the beginning.
                </li>
            </ul>
            <p>So when the above rules are evaluated, the first rule, which applies to everyone with no other conditions is always true, the field is always hidden, and the other rules are never evaluated. To get the intended results, you need to reorder
                these rules like so (which you can do via drag and drop):</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922586">
                    <img title="image" src="images/Download_004.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="216" width="604">
                </a>
            </p>
            <p>That's better, but understand that these rules must be in this order exactly to be interpreted consistently. You may think that you can reverse the first two rules and the results are the same, but these rules are not mutually exclusive. Somebody
                can be both the author and a member, or a member and a manager, and if you reversed the order of the first two fields these users would always see the field as read only, which is clearly not the desired result but given the precedence
                of operations it is what you told SPEasyForms you wanted.</p>
            <p>The other thing to note with this set of rules is the state of <strong>Editable</strong>. This really just means don't do anything to the field (so for instance on the view form it will still be read only). Why would we need such a rule? I
                can easily accomplish nothing without any rules whatsoever; heck, without any code whatsoever too. In this case it is so I don't fall through to the 'hide the field from everyone' rule. This is the reason why ‘hide the field from everyone'
                may make sense as part of a set of rules even though it usually does not make sense as a stand alone rule. It's kind of like firewall rules if you are familiar with the concept. You need to put specific rules before general rules, so in order
                to satisfy requirements like ‘managers can edit, but for everyone else it should be hidden,' you need some way to specify a rule that permits managers to edit, even though allowing edit is the default if there are no rules whatsoever.</p>
            <h3>3.6 Putting it all Together (and back to the scenario)</h3>
            <p>For our scenario, we have the following requirements for the given fields:</p>
            <ul>
                <li><strong>Company</strong>, <strong>Content Type</strong>, <strong>Full Name</strong>, and
                    <strong>Job Title</strong>
                    <ul>
                        <li>should be hidden when <strong>Code</strong> equals red.</li>
                        <li>should be read only when <strong>Code</strong> equals green.</li>
                        <li>should be editable when <strong>Code</strong> equals blue.</li>
                        <li>should be editable by <strong>Manager</strong> at all times.</li>
                    </ul>
                </li>
                <li>All fields on the HR tab or content area (i.e. <strong>EmployeeId</strong>, <strong>
HireDate</strong>, <strong>EmergencyContact</strong>, and <strong>HomeAddress</strong>)
                    <ul>
                        <li>should be editable for people in the <strong>HR</strong> group.</li>
                        <li>should be read only for people in the <strong>Manager</strong> group.

                        </li>
                        <li>should be hidden from everyone else.</li>
                    </ul>
                </li>
            </ul>
            <p>Lets take the first set of requirements and start with the <strong>Job Title</strong>
                field. First off, given what we now know about precedence of operations, these requirements are not in the order in which they should be implemented, but customers do not really care about such technical details. The configuration for <strong>Job Title</strong> should
                look something like:</p>
            <p>
                <img src="images/Download_060.png" alt="" height="227" width="600">
            </p>
            <p>In this case <em>something like</em> is accurate, because since the last three rules are mutually exclusive it does not matter what order they are in, the code will never be both red and green. If code were a multiple choice select field it would
                be a different story. But the manager rule has to be at the top, or one
                of the other three rules will always get executed before it is reached. Note also, that the rule that says 'make Job Title Editable if Code equals blue' is completely unnecessary. If removed, when Code is blue and the current user is not
                a manager, it will drop through all rules without executing any of them, and the result is the same. I think it is a little cleaner with the unneeded rule, but you can decide for yourself. If you configure the above rules for all four
                of the fields named above, the
                <strong>Conditional Visibility View</strong> will look like:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922566">
                    <img title="image" src="images/Download_028.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="375" width="604">
                </a>
            </p>
            <p>This view is the only place where you can go and see all of the visibility rules for the form (for a given content type, rules that are for fields that do not exist in the current content type are hidden). The rules are sorted by column display
                name. There are no buttons, and you cannot drag and drop these rules from here, but you can double click on a rule to bring up the
                <strong>Conditional Visibility Dialog</strong> for the given field.</p>
            <p>Once you have saved these rules you can check out how they affect the form, but before you do, make sure you know if you are in the
                <strong>Manager</strong> group or not, or you may once again be utterly unimpressed with the lack of anything new happening in the form (I've made this mistake before a few times, generally ending in a humbling debugging exercise). By the
                way, if you add or remove yourself from the Manager group, you should just have to refresh the form to see the difference. The current user's group membership is not cached in any way across page loads, so the effects should be immediate.</p>
            <p>Lets move on to the second set of requirements, starting with the field <strong>
EmployeeId</strong>. The configuration for this field should look like:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922568">
                    <img title="image" src="images/Download_003.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="213" width="604">
                </a>
            </p>
            <p>Note that I didn't say <em>something like</em> this time, the order of these rules is entirely significant. The last rule obviously must be last because it always executes. But you also cannot reverse the order of the first two rules, because
                if you did then somebody in both the Manager and HR groups would see the field read only while somebody in just the HR group would see it editable, which I doubt is what you want. Go ahead and configure the other three fields like this
                and the
                <strong>Configuration Visibility View</strong> should now look like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922579">
                    <img title="image" src="images/Download_034.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="543" width="604">
                </a>
            </p>
            <p>Save the configuration, go to the new Employee form, and check out the results. You should now know pretty much everything you need to know about conditional visibility rules. Try adding some of your own. Refresh the form and check out the
                result.
            </p>
<h3>3.7 Validation</h3>
<p>Note that if you use conditional visibility to hide a field or make it read only, and the field has validation errors, the user will be unable to submit the form.&nbsp;The OOB validation message is hidden, because the entire cell is hidden.&nbsp;If the field is on a tab or accordion content area, the header will be highlighted in red and the first one with validation errors will be automatically selected, but again the OOB validation message is hidden.&nbsp;Even if the validation message was displayed, the user would not be able to fix the problem because there are no input controls in which the required field can be entered. So as a general rule of thumb:</p>
<ul>
<li>Do not hide required fields or fields with validation from users who have contribute access to your list.</li>
<li>If you must hide a field that potentially could have validation errors, make sure that it always has a default value that will pass validation.</li>
</ul>
            <h2>4. Field Control Adapters</h2>
            <p>Field Control Adapters are basically intended to be a replacement for custom fields in SharePoint, or at least to provide custom field like behavior in SharePoint forms using only OOB field types. There are numerous shortcomings of custom
                field types. For starters they are a farm solution, which is tantamount to being downright evil by modern Microsoft doctrine. But they also suffer some reduced functionality, for instance they cannot be edited in datasheet view. This has
                always struck me as an unnecessary limitation; why not let people edit it just like an SPFieldText if it is based on SPFieldText, but Microsoft chose to punt and it is what it is.
            </p>
            <p>This is also the area where I see SPEasyForms expanding the most in future releases. The possibilities are nearly endless. Have you ever gotten requirements like:</p>
            <ul>
                <li>I want this field to be an integer, but the control should be a thermometer with a slider.
                </li>
                <li>I want this field to be a voting/star system where the user casts their vote by moving a dogs tail up or down.
                </li>
            </ul>
            <p>These may be obscure cases, but if you can imagine it, you can probably find someone out there who will say ‘yeah, give me one of those.'
            </p>
            <p>But for version 1 of SPEasyForms I've tried to implement just a couple of these that I consider to be low hanging fruit, meaning I've been asked for these often or I've seen people asking how to implement these in a SharePoint list often.
                The two I've implemented, in perceived order of popularity, are:</p>
            <ul>
                <li>Cascading Look Ups – the ability to trim the options available in one look up field based on the value selected in another look up field.
                </li>
                <li>Autocomplete – the ability to provide type ahead functionality for a text field based on the values in a field on a different list in the SharePoint site.
                </li>
            </ul>
            <p>I will document these in the reverse order below, just because Autocomplete is the easiest to setup, but before I do I want to document the steps for getting to a control adapter dialog for a given field right now so I don't have to repeat
                it in the implementation specific sections below:</p>
            <ul>
                <li>Hit the shuffle icon button (looks like 2 intertwined arrows) next to a field in the properties pane. Note that if this icon does not appear next to a particular field, it is because there are no adapters currently available for that field
                    type.
                </li>
                <li>If there are multiple adapters available for a given field type, you will be prompted to choose which implementation you want applied to this field:
                </li>
            </ul>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922595">
                    <img title="image" src="images/Download_053.png" alt="image" style="float:none; padding-top:0px; padding-left:0px; margin-left:auto; display:block; padding-right:0px; margin-right:auto; border:0px" border="0" height="228" width="414">
                </a>
            </p>
            <ul>
                <li>Once you choose the implementation, an implementation specific adapter dialog will be opened to let you configure the adapter. Note that if there is only one implementation for the given field type, the dialog above is skipped and you
                    jump right to the implementation specific adapter dialog.</li>
            </ul>
            <p>The adapter specific dialogs will be described below, but one thing I should point out first is that if you have just installed SPEasyForms with no plugins and no custom code of your own, you will never see the above dialog. That's because
                there are only two adapters built into the product, one for SPFieldText and one for SPFieldLookup, so there is no way you are ever going to choose a field that has two potential implementations. The above dialog was baked into the product
                just to allow for the possibility of plugins.</p>
            <p>The second general point I want to make is that even if there were multiple adapter implementations available for a given field type, you will only ever be able to configure a specific field to use one adapter or the other. To change the adapter
                for a given field, you must first remove the adapter and then add one again choosing a different implementation. How you remove an adapter is entirely up to the adapter specific dialog. The reason you will only ever be able to put one
                adapter on a specific field is that adapters manipulate the DOM of the OOB controls for a field, and would almost certainly step on each other. Not buying it? Try to imagine merging the functionality of the dog's tail voter and the thermometer
                slider described at the beginning of this section in any kind of generic way. Think about it?</p>
            <h3>4.1 Autocomplete</h3>
            <p>In order for Autocomplete to be configured, all you need to know is the name of another list in the same site and the display name of the field in that list that you want used for type ahead functionality. For our scenario, my requirement
                is going to be:</p>
            <ul>
                <li>The <strong>Job Title</strong> field should have type ahead functionality based on the values of the title field in the
                    <strong>JobTitles</strong> list.</li>
            </ul>
            <p>I've already created the <strong>JobTitles</strong> list and populated it, and it looks like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922597">
                    <img title="image" src="images/Download_038.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="434" width="596">
                </a>
            </p>
            <p>So when I click on the shuffle icon button next to <strong>Job Title</strong> I am presented with the following dialog:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922599">
                    <img title="image" src="images/Download_026.png" alt="image" style="padding-top:0px; padding-left:0px; margin:5px 0px; display:inline; padding-right:0px; border:0px" border="0" height="203" width="413">
                </a>
            </p>
            <p>Of course yours is not all filled in yet like mine is, I just didn't want to do before and after screen shots. The only configuration is that you need to select the title of the lookup list and the title of the lookup column. The screen may
                freeze for a few seconds when you first launch this dialog or when you choose a lookup list. The first case is because I need to get a list of list titles for the site from a web service, and the second is because I need to get list meta
                data from a web service. In both cases I cache the result so subsequent usage of the same data in the same browser session will be faster.</p>
            <p>Anyway, once I've configured this and saved my configuration, I can go back to the form and I should have Autocomplete functionality on the
                <strong>Job Title</strong> field:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922601">
                    <img title="image" src="images/Download_012.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="229" width="605">
                </a>
            </p>
            <p>And that's all you need to know about Autocomplete…sort of. You didn't think there wouldn't be another caveat, did you? If you look back at the screen shot of the
                <strong>JobTitles</strong> list, you can see that there is a count in the view, and the view currently has 2499 items in it. If the view has more than the list view threshold for SharePoint (usually 5000 items) you may run into some pretty
                insurmountable performance issues, especially in Internet Explorer. In fact, sometimes the browser hangs with 4000 items. It may be worse if you are bandwidth or latency challenged or your SharePoint farm is not very speedy.</p>
            <p>This is in part because of the current implementation of the Autocomplete adapter, which fetches the entire list into a big array on form load (well, just the one field, but still it can be a non-trivial amount of data). I could theoretically
                make some performance gains by not fetching the list until the user typed a few characters and trimming the results on the server side by sending a CAML query. On the other hand, that would mean more web service calls if the user changed
                the first few characters, which could perform even worse. I may look at a solution for larger lists in the future, but for now I think I've satisfied the low hanging fruit of Autocomplete.
            </p>
            <p>If you want to remove an Autocomplete adapter from a field, open the dialog, blank out the lookup list control, and hit Ok.</p>
            <h3>4.2 Cascading Look Ups</h3>
            <p>Do a search on Bing for ‘sharepoint cascading lookup' or ‘sharepoint cascading dropdown' and you'll see a lot of questions and even a lot of solutions. I chose not to write my own since there is a perfectly good implementation in SPServices,
                which I'm already using for calling all of the SharePoint web services, so if you have ever used cascading lookups using SPServices you already know how to setup the lookup lists. If not, I'll show you in a moment, but first lets talk
                about the requirements for our scenario:</p>
            <ul>
                <li>The options in the <strong>SalesDivision</strong> drop down should be trimmed based on the value selected in the
                    <strong>SalesRegion</strong> drop down.</li>
                <li>The options in the <strong>SalesState</strong> drop down should be trimmed based on the value selected in the
                    <strong>SalesDivision</strong> drop down.</li>
            </ul>
            <p>Pretty standard stuff in terms of cascading lookup requirements. The lookup lists look like:</p>
            <p align="center">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922603">
                    <img title="image" src="images/Download_058.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border:0px" border="0" height="217" width="244">
                </a>
            </p>
            <p align="center">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922605">
                    <img title="image" src="images/Download_052.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border:0px" border="0" height="360" width="244">
                </a>
            </p>
            <p align="center">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922607">
                    <img title="image" src="images/Download_020.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border:0px" border="0" height="410" width="244">
                </a>
            </p>
            <p align="left">The concept of cascading lookups depends heavily on a relationship list, which describes the relationship between a parent column and a child column. In the case of the first requirement above:</p>
            <ul>
                <li>
                    <div align="left">The parent column is SalesRegion and the child column is SalesDivision.</div>
                </li>
                <li>
                    <div align="left">SalesDivision is also the name of the relationship list.</div>
                </li>
            </ul>
            <p align="left">There is a parent field and a child field in both the relationship list and the current form, and that is what you need to pair up to configure cascading drop downs. The relationship list is a lookup list for the child column in the current
                form. It also has a lookup to the list that the parent column in the current form looks up against. When I say the current form, I'm talking about the form you are currently configuring in SPEasyForms.</p>
            <p align="left">Note that in my case I have also modified the fields in my lookup list so the display names of the parent column and child column match the display names of the lookup fields in the current list. This is not strictly speaking necessary, but
                it does make the configuration of cascading drop downs much easier as I'll demonstrate in a moment. I've also grouped the views above by the parent lookup field, which isn't necessary at all to make this work, but doesn't it look nice?</p>
            <p align="left">To configure cascading drop downs, click the shuffle icon button next to the child lookup field (the one that will be trimmed) in the properties pane (for requirement 1 that's the SalesDivision field). That brings up the
                <strong>Cascading Lookup Dialog</strong>:</p>
            <p align="left">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922609">
                    <img title="image" src="images/Download_021.png" alt="image" style="float:none; padding-top:0px; padding-left:0px; margin:15px auto; display:block; padding-right:0px; border:0px" border="0" height="301" width="511">
                </a>
            </p>
            <p align="left">It may take a couple of seconds to launch if I haven't already cached the list of list titles. The only things filled out on load are the name of this list and the name of the child column. In order to configure the rest, I first need to select
                the name of the relationship list, which in this case is SalesDivision, after which the dialog looks like this:</p>
            <p align="left">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922611">
                    <img title="image" src="images/Download_047.png" alt="image" style="float:none; padding-top:0px; padding-left:0px; margin:15px auto; display:block; padding-right:0px; border:0px" border="0" height="299" width="512">
                </a>
            </p>
            <p align="left">And voila, we're done. I was able to guess the rest of the configuration because there is only one lookup in the relationship list and the display names in the relationship list match the display names in the child form. If that were not true,
                I would have had to manually marry up the relationship list fields with the current form fields. So follow the same steps to configure the SalesState cascading look up, and the form fields now look like:
            </p>
            <p align="center">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922613">
                    <img title="image" src="images/Download_046.png" alt="image" style="padding-top:0px; padding-left:0px; display:inline; padding-right:0px; border:0px" border="0" height="73" width="450">
                </a>
            </p>
            <p align="left">Note that there are no options to select for SalesDivision or SalesState. Select a SalesRegion, and SalesDivision gets appropriate options:</p>
            <p align="left">
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922615">
                    <img title="image" src="images/Download_035.png" alt="image" style="float:none; padding-top:0px; padding-left:0px; margin-left:auto; display:block; padding-right:0px; margin-right:auto; border:0px" border="0" height="126" width="461">
                </a>
            </p>
            <p>And if you configured SalesState correctly, select a SalesDivision and SalesState should have appropriate options.</p>
            <p>If you want to remove a Cascading Look Up adapter from a field, open the dialog, blank out the relationship list control, and hit Ok.</p>
            <p>And that is all you need to know about cascading look ups. No really, no caveat.</p>
            <h3>4.3 The Field Adapters View</h3>
            <p>Just as there is a view for seeing all visibility rules, there is also a<strong> Field Adapters View</strong>
                in the editor for seeing all configured adapters by field display name (for the current content type). After configuring the adapters described in the previous sections, this view should look like this:</p>
            <p>
                <a href="http://download-codeplex.sec.s-msft.com/Download?ProjectName=speasyforms&amp;DownloadId=922619">
                    <img title="image" src="images/Download_033.png" alt="image" style="padding-top:0px; padding-left:0px; margin:10px 0px; display:inline; padding-right:0px; border:0px" border="0" height="329" width="604">
                </a>
            </p>
            <p>The last column in this table shows adapter specific configuration in the raw, because the editor does not know anything about this configuration information other than that it is in the configuration. 
                Also note that the foreign lists are
                stored by GUID and Title. The GUID is used to find the list, but if there is no list with the given id the Title is used
                instead. This means the configuration should fix itself on import as long as there is a list with the same Title in 
                the site you are importing to, and it has the same fields.
            </p>
<h3>4.4 Validation</h3>
<p>Neither of the two adapters included in the first release has any validation issues, since they do not hide the field/controls, they just augment the functionality of the field.&nbsp; It is certainly quite possible that a field adapter could hide validation errors from the user, making it difficult or impossible for the user to submit the form, but validation works the same on Autocomplete fields and Cascading Look Up fields as it does on OOB text fields and look up fields.</p>
            <h2>5. Wrap Up</h2>
            <p>Well, that's it. I think I've now described all of the functionality that will be included in the first release. This document has gotten a lot bigger than I thought it would. But then, there are a lot of pictures, which is kind of required
                if you want to describe a user interface. 
            </p>
            <p>When I set out on this project, my goal was to provide a turn key professional solution that could be installed and used by administrators and power users. I think I've achieved that goal somewhat. Agree or disagree, I'd love to hear your
                feedback on the SPEasyForms CodePlex site. I think I’ve achieved that to some degree too, and I will start documenting that over the next few months.</p>
            <p>The nice thing about the requirements in the scenario used in this document is that they all mapped perfectly to what SPEasyForms already does. You're mileage may vary.</p>
        </div>
        <div></div>

    </div>
</body>

</html>