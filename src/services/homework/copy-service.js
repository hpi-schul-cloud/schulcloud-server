const hooks = require('./hooks');
const errors = require('feathers-errors');
const HomeworkModel = require('./model').homeworkModel;
const _ = require('lodash');

class HomeworkCopyService {
	/**
	 * @param id = id of homework to copy
	 * @returns {id of new homework}
	 */
	get(id, params) {

        return HomeworkModel.findOne({_id: id}).exec()
			.then(copyAssignment => {
				let tempAssignment = JSON.parse(JSON.stringify(copyAssignment));
				tempAssignment = _.omit(tempAssignment, ['_id', 'stats', 'isTeacher', 'archived', '__v' ]);
				tempAssignment.private = true;
				tempAssignment.name = tempAssignment.name + " - Copy";

				return HomeworkModel.create(tempAssignment, (err, res) => {
					if (err)
						return err;
					else
						return res;
				})
			});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/homework/copy', new HomeworkCopyService());

	// Get our initialize service to that we can bind hooks
	const homeworkCopyService = app.service('/homework/copy');

	// Set up our before hooks
	//TODO: New hooks for Copy Service
	//homeworkCopyService.before(hooks.before);

	// Set up our after hooks
	//TODO: New hooks for Copy Service
	//homeworkCopyService.after(hooks.after);
};
