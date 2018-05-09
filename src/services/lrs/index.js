const hooks = require("./hooks");

module.exports = function() {
	const app = this;

	app.use("/lrs", require("./service")(app));

	const lrs = app.service("/lrs");

	lrs.before(hooks.before);
	lrs.after(hooks.after);
}
