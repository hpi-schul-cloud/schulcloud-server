'use strict';
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
class Service {
	constructor() {
	}

	/**
	 * todo: swagger
	 * @param data, contains schoolId
	 * @returns {Promise}
     */
	create(data) {
		return new AWSStrategy().create(data.schoolId); // todo: get strategy from school!
	}

	/**
	 * todo: swagger
	 * @param data, contains storageContext
	 * @returns {Promise}
	 */
	find(data) {
		return new AWSStrategy().getFiles(data.payload.userId, data.query.storageContext);
	}
}

module.exports = function(){
  const app = this;

  // Initialize our service with any options it requires
  app.use('/fileStorage', new Service());
	// todo: upload to client!
  //app.use('/files/upload', new uploadService());

  // Get our initialize service to that we can bind hooks
  const filesService = app.service('/fileStorage');

  // Set up our before hooks
  filesService.before(hooks.before);

  // Set up our after hooks
  filesService.after(hooks.after);
};

module.exports.Service = Service;
