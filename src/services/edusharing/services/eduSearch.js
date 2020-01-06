//const request = require("request-promise-native");
const hooks = require("../hooks");
const EduSharingConnector = require("../logic/connector");
const { BadRequest } = require("@feathersjs/errors");

class EduSearch {
	find(data) {
		console.log("EduSearch.find");
		return EduSharingConnector.GET(data);
	}
	get(mode, params) {
		console.log(mode, "<-- MODE");
		if (mode !== "preview") {
			throw new BadRequest("Mode must be preview");
		}
		// expect edusharingconnector fetches the image from edu sharing and return the image data back.
		return EduSharingConnector.GET({ mode, params });
	}
}

module.exports = app => {
	const eduRoute = "/edu-sharing";
	app.use(eduRoute, new EduSearch(), (req, res) => {
		res.send(res.data);
	});
	const eduService = app.service("/edu-sharing");
	eduService.hooks(hooks);
};
