'use strict';
/**
 * Provides a basic wopi - endpoint, https://wopirest.readthedocs.io/en/latest/index.html
 */
const hooks = require('./hooks');

class WopiFilesService {
	get(id, params) {
		return {success: true};
	}
}

/** retrieves a content of a file
 * todo: generate signedUrl from signedUrlService 
 */
class WopiFilesContentsService {
  find(query, payload) {
    return {success: true};
  }
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
  app.use('/wopi/files/', new WopiFilesService());
  /** how to handle :id? https://wopirest.readthedocs.io/en/latest/endpoints.html#file-contents-endpoint */
	//app.use('/wopi/:id/contents', new WopiFilesContentsService());

	// Get our initialize service to that we can bind hooks
	const filesService = app.service('/wopi/files');

	// Set up our before hooks
	filesService.before(hooks.before);
	
	// Set up our after hooks
	filesService.after(hooks.after);
};
