'use strict';
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const hooks = require('./hooks');
const errors = require('feathers-errors');
const FileModel = require('../fileStorage/model').fileModel;

/** Wopi-CheckFileInfo-Service
 * https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html
 */
class WopiFilesService {
	get(id, params) {
		return Promise.resolve({success: true});
	}
}

/** Wopi-Get/PutFile-Service
 * https://wopirest.readthedocs.io/en/latest/files/GetFile.html 
 * retrieves a content of a file
 */
class WopiFilesContentsService {
	//todo: generate signedUrl from signedUrlService
  find({query, fileId, payload}) {
		// check whether a valid file is requested
		return FileModel.findOne({_id: fileId}).then(file => {
			if (!file) throw new errors.NotFound("Not a valid Schul-Cloud file!");
			console.log(file);
			return 'success';
		});
	}


	//todo: generate signedUrl and directly put file here
	create(data, params) {
		return Promise.resolve(true);
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
  app.use('/wopi/files/', new WopiFilesService());
	app.use('/wopi/files/:fileId/contents', new WopiFilesContentsService());

	// Get our initialize service to that we can bind hooks
	const filesService = app.service('/wopi/files');
	const filesContentService = app.service('/wopi/files/:fileId/contents');

	// Set up our before hooks
	filesService.before(hooks.before);
	filesContentService.before(hooks.before);

	// Set up our after hooks
	filesService.after(hooks.after);
	filesContentService.after(hooks.after);
};
