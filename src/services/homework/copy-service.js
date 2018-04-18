const hooks = require('./hooks');
const errors = require('feathers-errors');
const HomeworkModel = require('./model').homeworkModel;

class HomeworkCopyService {
	/**
	 * @param id = id of homework to copy
	 * @returns {id of new homework}
	 */
	get(id, params) {
        console.log("copy",id);
        //TODO: get old homework by id and create new one
        /*
        // not working
        HomeworkModel.get(id).exec().then((oldAssignment) => {
            console.log("oldAssignment", oldAssignment);
            let assignment = JSON.parse(JSON.stringify(oldAssignment));
            // sanitize before copy
            delete assignment._id;
            delete assignment.stats;
            delete assignment.isTeacher;
            delete assignment.archived;
            delete assignment.__v;
            if(assignment.courseId){
                if((assignment.courseId||{})._id){
                    assignment.courseId = assignment.courseId._id;
                }
            }else{
                delete assignment.courseId
            }
            assignment.private = true;

            // post copied task
            return HomeworkModel.create(assignment).exec().then((newAssignment) => {
                return newAssignment;
            }).catch(err => {
                return Promise.reject(new errors.GeneralError(err));
            })
            return;
        });
        */
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/homework/copy', new HomeworkCopyService());

	// Get our initialize service to that we can bind hooks
	const homeworkCopyService = app.service('/homework/copy');

	// Set up our before hooks
	homeworkCopyService.before(hooks.before);

	// Set up our after hooks
	homeworkCopyService.after(hooks.after);
};
