const news = require('./news');

function _onNewsAdded(context) {
	news.added(context);
}

module.exports = {

	register(app) {
		app.on('news:added', _onNewsAdded.bind(this));
		// app.on('course:updated', ...)
	},

};
