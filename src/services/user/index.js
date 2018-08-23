'use strict';

const service = require('feathers-mongoose');
const user = require('./model');
const hooks = require('./hooks');
const registrationPinsHooks = require('./hooks/registrationPins');
const errors = require('feathers-errors');

const userDataFilter=(user)=>{
	return {
		"userId":user._id,
		"email":user.email,
		"firstName":user.firstName,
		"lastName":user.lastName,
		"importHash":user.importHash,
		"schoolId":user.schoolId,
		"birthday":user.birthday
	}
}

class UserLinkImportService {
		constructor(userService) {
			this.userService = userService;
			this.docs = {}
        }
		
		get(hash,params){	//can not use get becouse the hash can have / that mapped to non existing routes
			return this.userService.find({ query: { importHash: hash }})
			.then(users=>{
				if(users.data.length<=0 || users.data.length>1){
					throw new errors.BadRequest('Can not match the hash.');
				}
				return userDataFilter(users.data[0]);
			}).catch(err=>{
				return err;
			});
		}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: user.userModel,
		paginate: {
			default: 25,
			max: 1000
		},
		lean: true
	};

	app.use('/users', service(options));

	const userService = app.service('/users');	
	app.use('users/linkImport',new UserLinkImportService(userService));	//do not use hooks

	
	userService.before(hooks.before(app));	// TODO: refactor
	userService.after(hooks.after);

	/* registrationPin Service */
	app.use('/registrationPins', service({
		Model: user.registrationPinModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const registrationPinService = app.service('/registrationPins');
	registrationPinService.before(registrationPinsHooks.before);
	registrationPinService.after(registrationPinsHooks.after);
};
