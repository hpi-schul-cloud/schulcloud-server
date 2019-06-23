const { FileModel } = require('./model');

class ThumbnailService {
	constructor() {
		this.app = null;
	}

	patch(id, data) {
		return FileModel.updateOne(
			{ thumbnailRequestToken: id },
			{
				$set: {
					thumbnailRequestToken: null,
					thumbnail: data.thumbnail,
				},
			},
		).exec();
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/thumbnail', new ThumbnailService());
};
