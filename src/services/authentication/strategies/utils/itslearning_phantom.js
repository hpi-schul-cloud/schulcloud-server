/* eslint-disable */
var system = require('system');
var args = system.args;
var steps = [];
var testindex = 0;
var loadInProgress = false; //This is set to true when a page is still loading
var requests = [];
var url;
var username = args[1];
var password = args[2];
var initialUrl = args[3];

/*********SETTINGS*********************/
var webPage = require('webpage');
var page = webPage.create();
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36';
page.settings.javascriptEnabled = true;
page.settings.loadImages = false; //Script is much faster with this field set to false
phantom.cookiesEnabled = true;
phantom.javascriptEnabled = true;
/*********SETTINGS END*****************/

page.onConsoleMessage = function(msg) {
	console.log(msg);
};
/**********DEFINE STEPS THAT FANTOM SHOULD DO***********************/
steps = [

	//Step 1 - Open ITSLearning home page
	function() {
		page.open(initialUrl, function(status) {});
	},
	//Step 2 - Populate and submit the login form
	function() {
		page.evaluate(function(username, password) {
			document.getElementById("ctl00_ContentPlaceHolder1_Username_input").value = username;
			document.getElementById("ctl00_ContentPlaceHolder1_Password_input").value = password;
			document.getElementById("ctl00_ContentPlaceHolder1_nativeLoginButton").click();
		}, username, password);
		page.onResourceRequested = function(request) {
			//console.log('Request ' + JSON.stringify(request, undefined, 4));
			requests.push(request);
			requests.forEach(function(request) {
				if (request.id == 18) {
					url = request.url;
				}
			});
		};
	},
	//Step 3 - clearCookies of ITSLearning
	function() {
		//console.log(url);
		page.clearCookies();
	}
];
/**********END STEPS THAT FANTOM SHOULD DO***********************/

//Execute steps one by one
interval = setInterval(executeRequestsStepByStep, 25);

function executeRequestsStepByStep() {
	if (loadInProgress == false && typeof steps[testindex] == "function") {
		//console.log("step " + (testindex + 1));
		steps[testindex]();
		testindex++;
	}
	if (typeof steps[testindex] != "function") {
		console.log(url);
		phantom.exit();
	}
}

/**
 * These listeners are very important in order to phantom work properly. Using these listeners, we control loadInProgress marker which controls, weather a page is fully loaded.
 * Without this, we will get content of the page, even a page is not fully loaded.
 */
page.onLoadStarted = function() {
	loadInProgress = true;
};
page.onLoadFinished = function() {
	loadInProgress = false;
};
page.onConsoleMessage = function(msg) {
	console.log(msg);
};
