//const request = require("request-promise-native");
const hooks = require("../hooks");
const EduSharingConnector = require("../logic/connector");

class EduSearch {
	find(data) {
		console.log("EduSearch.find");
		return EduSharingConnector.GET(data);
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
