const nanoid = require('nanoid');

class HomeworkShareService {
	constructor(app) {
		this.app = app;
	}

	async get(id, params) {
		const homeworkService = await this.app.service('homework');

		let homework = await homeworkService.get(id, params);
		if (!homework.shareToken) {
			homework = await homeworkService.patch(id, { shareToken: nanoid(12) }, params);
		}

		return { shareToken: homework.shareToken };
	}
}

module.exports = (app) => {
	app.use('/homework/share', new HomeworkShareService(app));
	// app.service('/homework/share').hooks(hooks);
};
