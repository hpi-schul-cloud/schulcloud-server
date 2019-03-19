const lessonCreate = (app) => {
	app.service('lessons').on('create', (result, context) => {
		console.log(result, context.id);
	});
};

module.exports = (app) => {
	lessonCreate(app);
};
