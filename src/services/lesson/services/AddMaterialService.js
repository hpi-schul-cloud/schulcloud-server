const hooks = require('../hooks/addMaterial');

class AddMaterialService {
	setup(app) {
		this.app = app;
		this.hooks({ before: hooks.before() });
	}

	async create(data, params) {
		const { title, client, url } = data;
		let material;

		if (data.merlinReference) {
			const { merlinReference } = data;
			material = await this.app.service('materials').create({ title, client, url, merlinReference });
		} else {
			material = await this.app.service('materials').create({ title, client, url });
		}

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
