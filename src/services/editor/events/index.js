const { coursesPatch } = require('./coursePatch');
const { topicsCreate, topicsRemove } = require('./topics');

const configure = (app) => {
	topicsCreate(app);
	topicsRemove(app);
	coursesPatch(app);
};

module.exports = {
	configure,
};
