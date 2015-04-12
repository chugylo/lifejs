#!/usr/bin/env node

/*
 * It converts README files that is wriiten in Markdown into HTML.
 */

var ADDITIONAL_LANGS = [
    "uk"
];

var DIR = "lang/";

var fs = require("fs")
  , md = require("markdown-it")();

for (var i = 0; i < ADDITIONAL_LANGS.length + 1; i++) {
    if (i < ADDITIONAL_LANGS.length) {
        var lang = ADDITIONAL_LANGS[i];
        var mdfile = DIR + "README." + lang + ".md";
    } else {
        var lang = "en";
        var mdfile = DIR + "README.md";
    }
    var htmlfile = DIR + "README." + lang + ".html";

    (function() {
        var task = {
            mdfile: mdfile
          , htmlfile: htmlfile
        };

        fs.readFile(task.mdfile, { encoding: "utf8" }, function(err, data) {
            if (err) {
                console.warn("cant read the content of " + task.mdfile);
                return;
            }
            console.log("the content of " + task.mdfile + " has been read.");
            var htmlContent = md.render(data);
            fs.writeFile(task.htmlfile, htmlContent, function(err) {
                if (err) {
                    console.warn("cant write data to " + task.htmlfile);
                } else {
                    console.log(task.mdfile + " has been successfully converted to " + task.htmlfile);
                }
            });
        });
    })();
}
