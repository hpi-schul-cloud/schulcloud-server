const hooks = require("./hooks");
const service = require("./service");

module.exports = function() {
	const app = this;

	app.use("/feedback", service());

	const feedback = app.service("/feedback");

	feedback.before(hooks.before);
	feedback.after(hooks.after);
};
