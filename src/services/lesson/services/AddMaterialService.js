const hooks = require('../hooks/addMaterial');

class AddMaterialService {
	setup(app) {
		this.app = app;
		this.hooks({ before: hooks.before() });
	}

	async create(data, params) {
		const { title, client, url, merlinReference } = data;

		const material = await this.app.service('materials').create({ title, client, url, merlinReference });

		await this.app.service('lessons').patch(params.lesson._id, {
			courseId: params.lesson.courseId, //
			$push: {
				materialIds: material._id,
			},
		});
		return material;
	}
}

module.exports = AddMaterialService;
