const {
	Project,
	Board,
} = require('./services/');
// const { before, after, beforeLesson } = require('./hooks');
// const { setForceKey } = require('./helper');

module.exports = function setup() {
	const app = this;

	const projectRoute = '/nexboard/project';
	const boardRoute = '/nexboard/board';

	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());
};
