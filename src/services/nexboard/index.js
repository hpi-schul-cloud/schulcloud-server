const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Project, Board } = require('./services');

const hooks = require('./hooks');

module.exports = (app) => {
	const projectRoute = '/nexboard/projects';
	const boardRoute = '/nexboard/boards';

	app.use(projectRoute, new Project());
	app.use(boardRoute, new Board());

	app.use('/nexboard/api', staticContent(path.join(__dirname, '/docs')));

	const projects = app.service(projectRoute);
	projects.hooks(hooks);

	const boards = app.service(boardRoute);
	boards.hooks(hooks);
};
