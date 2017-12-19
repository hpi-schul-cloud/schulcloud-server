const hooks = require("./hooks");
const service = require("./service");

module.exports = function() {
	const app = this;

	app.use("/lrs", service());

	const lrs = app.service("/lrs");

	lrs.before(hooks.before);
	lrs.after(hooks.after);
}
