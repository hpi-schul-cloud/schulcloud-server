const { coursesPatch } = require('./coursePatch');
const { topicsCreate, topicsRemove } = require('./topics');

module.exports = (app) => {
	topicsCreate(app);
	topicsRemove(app);
	coursesPatch(app);
};
