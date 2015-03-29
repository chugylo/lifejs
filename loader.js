window.onload = function(ev) {
    function addScript(src) {
        var script = document.createElement("script");
        script.setAttribute("src", src);
        document.body.appendChild(script);
    }

    // global var
    LifeGameLang = {};
    var LifeGameTest = document.documentElement.getAttribute("data-rel") == "test" ? true : false;

    // check the browser
    // IE 9 should ok
    if (
        typeof Array.prototype.map != "function"
        || typeof Array.prototype.filter != "function"
        || typeof Array.prototype.reduce != "function"
        || typeof Array.prototype.forEach != "function"
        || typeof Array.prototype.indexOf != "function"
        || typeof Event.prototype.preventDefault != "function"
        || typeof Document.prototype.querySelector != "function"
        || typeof Document.prototype.querySelectorAll != "function"
        || typeof Function.prototype.bind != "function"
        || !ev
        // check getters
        || (function() {
                try {
                    return !eval('({ get x() { return 1; } }).x === 1');
                } catch (e) {
                    return true;
                }
           })()
        // check setters
        || (function () {
                try {
                    var value;
                    eval('({ set x(v) { value = v; } }).x = 1');
                    return value !== 1;
                } catch (e) {
                    return true;
                }
            })()
    ) {
        var tooOldDiv = document.createElement("div");
        tooOldDiv.className = "too-old";
        tooOldDiv.innerHTML = "ERROR: Your browser is too old!";
        document.body.innerHTML = "";
        document.body.appendChild(tooOldDiv);
    } else {
        var testPrefix = LifeGameTest === true ? "../" : "";

        ["en", "uk"].forEach(function(lang) {
            addScript(testPrefix+"lang/"+lang+".js");
        });

        addScript(testPrefix+"life.js");

        if (LifeGameTest === true) {
            addScript("test.js");
        }
    }
};
