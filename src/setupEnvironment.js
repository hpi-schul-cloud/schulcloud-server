/**
 * Created by carl on 03/11/16.
 */
const schools = require('./seeds/schools');
const tools = require('./seeds/tools');

module.exports = function(app) {
	"use strict";
	schools(app);
	tools(app);
};

