[Donload the latest release from https://speasyforms.intellipointsol.com](http://speasyforms.intellipointsol.com/sdm_downloads/speasyforms-2018-01/) 

### Latest Release is 2018.02, which fixes:

[Issue 75: Form is being submitted without any validation, SP2013 and Later](https://github.com/mcsheaj/SPEasyForms/issues/75)

##### Fixed in 2015.01.07:

[Issue 59: Visibility based on the value of a field is only available for fields in the default content type](https://github.com/mcsheaj/SPEasyForms/issues/59)

[Issue 68: Date / Time Field shows Date only in Read-Only mode on Edit Form (non en-us sites)](https://github.com/mcsheaj/SPEasyForms/issues/68)

[Issue 69: Managed meta data in read only mode shows term and guid](https://github.com/mcsheaj/SPEasyForms/issues/69)

[Issue 70: Add lists to an HTML Snippet Container causes the editor to come blank on subsequent page loads](https://github.com/mcsheaj/SPEasyForms/issues/70)

[Issue 73: Fields in foreign lists do not load when the foreign list allows management of content types (affects cascading lookups, autocomplete, and lookup detail)](https://github.com/mcsheaj/SPEasyForms/issues/73)

##### Fixed in 2015.01.07:

[Issue 58: Error cannot call get_childDialog on undefined](https://github.com/mcsheaj/SPEasyForms/issues/58)

[Issue 61: When attaching files it won't save on sites with Minimal Download Strategy (MDS) enabled](https://github.com/mcsheaj/SPEasyForms/issues/61)

[Issue 63: Dialog explaining that old rich text fields are not supported does not work on SP 2013 or earlier](https://github.com/mcsheaj/SPEasyForms/issues/63)

##### Fixed in 2015.01.06:

[Issue 55: Form rendering issue in dialogs when using SPEasyForms](https://speasyforms.codeplex.com/workitem/55)

##### Fixed in 2015.01.05:

[Issue 54: Some forms will not submit](https://speasyforms.codeplex.com/workitem/54)

##### Fixed in 2015.01.04:

[Issue 52: SPEasyForms is unnecessarily invasive on forms for lists which have no configuration](https://speasyforms.codeplex.com/workitem/52)

[Issue 53: Conflicts with PreSaveAction](https://speasyforms.codeplex.com/workitem/53)

##### Fixed in 2015.01.03:

[Issue 49: Old Rich Text fields lose data (sometimes?)](https://speasyforms.codeplex.com/workitem/49)

[Issue 50: Matches CurrentUser does not work in validation rules](https://speasyforms.codeplex.com/workitem/50)

##### Fixed in 2015.01.02:

[Issue 44: jQuery-UI Theme is Loaded on All Pages](https://speasyforms.codeplex.com/workitem/44)

[Issue 45: People Picker Required Fields Show 'You must specify a value' Message On Form Load (2010 only)](https://speasyforms.codeplex.com/workitem/45)

[Issue 46: SharePoint 2010 forms do not submit](https://speasyforms.codeplex.com/workitem/46)

##### Fixed in 2015.01.01:

[Issue 40: Themes do not work on a root site collection](https://speasyforms.codeplex.com/workitem/40)

[Issue 41: 404 error for SPEasyFormsSiteSettings.aspx](https://speasyforms.codeplex.com/workitem/41)

##### What's new in v2015.01

1. Added a Client Side Rendering (CSR) hook to hide the form until SPEasyForms has done it's work, making the page load less jumpy. Note that CSR was introduced in SharePoint 2013, so this does nothing in SharePoint 2010. To achieve the same result in 2010, you need to modify the master page (see 'Why is my form so jumpy?' in the SPEasyForms blog for more information).
2. The ability to specify the jQuery UI theme to be used site collection wide or at the list level. There's a page on the editor where you can choose between the 6 themes I've included, or you can upload your own theme to anywhere in SharePoint (or even not in SharePoint) and just point me to the style sheet and I'll use your theme, allowing you to use any of the gallery themes from the jQuery UI site or their tools to roll your own theme.
3. The biggest change in this version is the ability rearrange more or less everything through drag and drop. In the previous version, you could drag and drop containers and fields. You can now drag and drop collections of fields, for instance you can reorder the tabs in a tabs container, or even move a tab over to an accordion which now makes it an accordion page. You can also nest containers, so you can drag an accordion onto a tabs container, making it a tabs container that has an accordion on one of its tab stops. There are some limitations, which I cover in the user manual.
4. Also, I've gotten rid of the master page on my settings page. I used to use the default master for the site. This caused a lot of compatibility issues between SharePoint 2010 and 2013/Online. Having to live with the IE 8 compatibility setting that's standard in the 2010 master page meant I have to water down the interface some for 2010 to get everything to work. Now I can use straight-up HTML 5 on all platforms, which is a big improvement. Also, one of the more common problems people had with the previous version was that they had a highly customized master page which effectively scramble the interface of SPEasyForms beyond usability. Since I'm no longer using your master page, that problem should go away.
5. All of this rework has also yielded significant performance improvements in the editor. Without the master page, it loads much quicker, it doesn't freeze up as often or as long on intense redraw operations like drag and drop or undo/redo.
6. Updated my third party libraries to their latest stable release. In the case of jQuery and jQuery-UI, that's the latest 1.x release.
7. Rolled up all previous updates to 2014.01 into the baseline.

The complete list of customizations supported, old and new, is now:

* Containers: the ability to organize fields in a form in some way; current implementations include: Tabs: an implementation of jQueryUI tabs
  - Accordion: an implementation of jQueryUI Accordion
  - Columns: the ability to put fields or containers into 2 or more columns instead of one per row (technically, one or more, but one column doesn't really buy you much)
  - Stack (NEW!): allows you to stack 2 or more containers on top of each other, so you can put multiple containers onto a single tab or accordion page.
  - Wizard (NEW!): a specialty container that allows users to page through containers using next and previous buttons.
  - HTML Snippet (NEW!): a specialty container, that doesn't actually hold any fields, but allows you to inject arbitrary HTML into the page, including referencing external scripts and style sheets.
* Conditional Visibility: conditionally format a field:
  - Based on various conditions like:
    + Membership in a SharePoint group
    + Which form is open (i.e. the new, edit or display form)
    + Comparing the values of other fields based on various comparison operators (i.e. make this field read only when the Color field is equal to Red), comparison operators include:
      * Equals: equals a string literal
      * Matches: matches a JavaScript regular expression
      * NotMatches: does not match a JavaScript regular expression
      * GreaterThan (NEW!): greater than a string literal
      * GreaterThanOrEquals (NEW!): greater than or equals to a string literal
      * LessThan (NEW!): less than a string literal
      * LessThanOrEquals (NEW!): less than or equals a string literal
      * NotEquals (NEW!): is not equal to a string literal
  - Formatting Options:
    + Hiding a field completely
    + Making a field read-only
    + Highlighting a field in one of four colors (NEW!)
* Field Control Adapters: modify the controls users see in the form to input data; current implementations include:

  - Cascading Look Ups: join two look up fields such that the values available in one look up are trimmed based on the value selected in another look up
  - Autocomplete: provide type ahead functionality in a text field based on values pulled from a field in another list on the same site
  - Lookup Detail (NEW!): allows you to pull in additional fields from a lookup list based on the value selected in a lookup field.
  - Default to Current User (NEW!): pre-populate a user field with the current user on the new form.
  - Star Rating Adapter (NEW!): can be applied to numeric fields. Fields are displayed as five stars and edited by clicking on one of the stars.

*All comparison operators ignore case

** All comparison operators except Matches/NotMatches will check if both operands are valid dates and use date comparison, check if both operands are valid numbers and use numeric comparison second, and lastly use string comparison

Most of the things marked (NEW!) were actually released in the updates package to v2014.01. The Stack and Star Ratings Adapter are actually brand new.
