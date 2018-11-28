'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const logger = require('winston');

/**
 *
 * @param {object} hook - The hook of the server-request, containing req.params.query.roles as role-filter
 * @returns {Promise }
 */
const mapRoleFilterQuery = (hook) => {
	if (hook.params.query.roles) {
		let rolesFilter = hook.params.query.roles;
		hook.params.query.roles = {};
		hook.params.query.roles.$in = rolesFilter;
	}

	return Promise.resolve(hook);
};

const checkUnique = (hook) => {
	let userService = hook.service;
	const {email} = hook.data;
	if (email === undefined) {
		return Promise.reject(new errors.BadRequest(`Fehler beim Auslesen der E-Mail-Adresse bei der Nutzererstellung.`));
	}
	return userService.find({ query: {email: email, $populate: ["roles"]}})
		.then(result => {
			const length = result.data.length;
			if( length==undefined || length>2 ){
				return Promise.reject(new errors.BadRequest('Fehler beim prüfen der Datenbank informationen.'));
			}
			if(length<=0){
				return Promise.resolve(hook);
			}

			const user 		= typeof result.data[0] == 'object' ? result.data[0] : {};
			const input		= typeof hook.data == 'object' ? hook.data : {};
			const isLoggedIn= ( hook.params || {} ).account && hook.params.account.userId ? true : false;
			const isStudent	= user.roles.filter( role => role.name === "student" ).length == 0 ? false : true;
			const asTask	= ( hook.params._additional || {} ).asTask;

			if(isLoggedIn || asTask=='student' ){
				return Promise.reject(new errors.BadRequest(`Die E-Mail Adresse ${email} ist bereits in Verwendung!`));
			}else if(asTask=='parent' && length==1){
					userService.update({_id: user._id}, {
						$set: {
							children: (user.children||[]).concat(input.children),
							firstName: input.firstName,
							lastName: input.lastName
						}
					});
					return Promise.reject(new errors.BadRequest("parentCreatePatch... it's not a bug, it's a feature - and it really is this time!", user)); /* to stop the create process, the message are catch and resolve in regestration hook */
			}

			return Promise.resolve(hook);
		});
};

const checkUniqueAccount = (hook) => {
	let accountService = hook.app.service('/accounts');
	const {email} = hook.data;
	return accountService.find({ query: {username: email, $populate: ["roles"]}})
		.then(result => {
			if(result.length > 0) return Promise.reject(new errors.BadRequest(`Ein Account mit dieser E-Mail Adresse ${email} existiert bereits!`));
			return Promise.resolve(hook);
		});
};

const updateAccountUsername = (hook) => {
	let accountService = hook.app.service('/accounts');
	
	accountService.find({ query: {userId: hook.id}})
		.then(result =>{
			if (result.length == 0) {
				return Promise.resolve(hook);
			}
			let account = result[0];
			let accountId = (account._id).toString();
			if (!account.systemId){				
				if (!hook.data.email) {
					return Promise.resolve(hook);
				}
				const {email} = hook.data;
				return accountService.patch(accountId, {username: email}, {account: hook.params.account})
					.then(result => {
						return Promise.resolve(hook);
					});
			} else {
				hook.result = {};
				return Promise.resolve(hook);
			}
		}).catch(error => {
			logger.log(error);
			return Promise.reject(error);
		});
	};
  
const removeStudentFromClasses = (hook) => {
	const classesService = hook.app.service('/classes');
	const userId = hook.id;
	if (userId === undefined) throw new errors.BadRequest(`Fehler beim Entfernen des Users aus abhängigen Klassen`);


	const query = { userIds: userId };

	return classesService.find({ query: query})
	.then(classes => {
		return Promise.all(
			classes.data.map(myClass => {
				myClass.userIds.splice(myClass.userIds.indexOf(userId), 1);
				return classesService.patch(myClass._id, myClass);
			})
		).then(_ => hook).catch(err => {throw new errors.Forbidden('No Permission',err);});
	});
};

const removeStudentFromCourses = (hook) => {
	const coursesService = hook.app.service('/courses');
	const userId = hook.id;
	if (userId === undefined) throw new errors.BadRequest(`Fehler beim Entfernen des Users aus abhängigen Kursen`);

	const query = { userIds: userId };

	return coursesService.find({ query: query})
	.then(courses => {
		return Promise.all(
			courses.data.map(course => {
				course.userIds.splice(course.userIds.indexOf(userId), 1);
				return coursesService.patch(course._id, course);
			})
		).then(_ => hook).catch(err => {throw new errors.Forbidden('No Permission',err);});
	});
};

const sanitizeData = (hook) => {
	if ("email" in hook.data) {
		var regex = RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
		if (!regex.test(hook.data.email)) {
			return Promise.reject(new errors.BadRequest('Bitte gib eine valide E-Mail Adresse an!'));
		}
	}
	const idRegExp = RegExp("^[0-9a-fA-F]{24}$");
	if ("schoolId" in hook.data) {
		if (!idRegExp.test(hook.data.schoolId)) {
			return Promise.reject(new errors.BadRequest('invalid Id'));
		}
	}
	if ("classId" in hook.data) {
		if (!idRegExp.test(hook.data.classId)) {
			return Promise.reject(new errors.BadRequest('invalid Id'));
		}
	}
	return Promise.resolve(hook);
};

const checkJwt = () => {
	return function (hook) {
		if (((hook.params||{}).headers||{}).authorization != undefined) {
			return (auth.hooks.authenticate('jwt')).call(this, hook);
		} else {
			return Promise.resolve(hook);
		}
	};
};

const pinIsVerified = hook => {
	if((hook.params||{}).account && hook.params.account.userId){
		return (globalHooks.hasPermission('USER_CREATE')).call(this, hook);
	} else {
		const email=(hook.params._additional||{}).parentEmail||hook.data.email;
		return hook.app.service('/registrationPins').find({query:{email:email , verified: true}})
		.then(pins => {
			if (pins.data.length === 1 && pins.data[0].pin) {
				const age = globalHooks.getAge(hook.data.birthday);

				if (!((hook.data.roles||[]).includes("student") && age < 18)) {
					hook.app.service('/registrationPins').remove(pins.data[0]._id);
				}

				return Promise.resolve(hook);
			}
			else{
				return Promise.reject(new errors.BadRequest('Der Pin wurde noch nicht bei der Registrierung eingetragen.'));
			}

		});
	}
};

// student administrator helpdesk superhero teacher parent
const permissionRoleCreate = async (hook) =>{
	if (!hook.params.provider) {
		//internal call
		return hook;
	}

	if( hook.data.length <= 0 ){
		return Promise.reject(new errors.BadRequest('No input data.'));
	}

	let isLoggedIn = false;
	if(((hook.params||{}).account||{}).userId){
		isLoggedIn = true;
		const userService = hook.app.service('/users/');
		const currentUser = await userService.get(hook.params.account.userId, {query: {$populate: 'roles'}});
		const userRoles = currentUser.roles.map((role) => {return role.name;});
		if(userRoles.includes('superhero')){
			//call from superhero Dashboard
			return Promise.resolve(hook);
		}
	}

	if( isLoggedIn===true  && globalHooks.arrayIncludes((hook.data.roles||[]),['student','teacher'],['parent','administrator','helpdesk','superhero']) ||
		isLoggedIn===false && globalHooks.arrayIncludes((hook.data.roles||[]),['student','parent'],['teacher','administrator','helpdesk','superhero'])
	){
		return Promise.resolve(hook);
	}else{
		return Promise.reject(new errors.BadRequest('You have not the permissions to create this roles.'));
	}
};

const securePatching = (hook) => {
	return Promise.all([
		globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
		globalHooks.hasRole(hook, hook.params.account.userId, 'administrator'),
		globalHooks.hasRole(hook, hook.params.account.userId, 'teacher'),
		globalHooks.hasRole(hook, hook.id, 'student')
	])
	.then(([isSuperHero, isAdmin, isTeacher, targetIsStudent]) => {
		if (!isSuperHero) {
			delete hook.data.schoolId;
			delete (hook.data.$push || {}).schoolId;
		}
		if (!(isSuperHero || isAdmin)) {
			delete hook.data.roles;
			delete (hook.data.$push || {}).roles;
		}
		if (hook.params.account.userId != hook.id) {
			if (!(isSuperHero || isAdmin || (isTeacher && targetIsStudent)))
			{
				return Promise.reject(new errors.BadRequest('You have not the permissions to change other users'));
			}
		}
		return Promise.resolve(hook);
	});
};

exports.before = function(app) {
	return {
		all: [],
		find: [
			globalHooks.mapPaginationQuery.bind(this),
			globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),	// resolve ids for role strings (e.g. 'TEACHER')
			auth.hooks.authenticate('jwt'),
			globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
			mapRoleFilterQuery
		],
		get: [auth.hooks.authenticate('jwt')],
		create: [
			checkJwt(),
			pinIsVerified,
			sanitizeData,
			checkUnique,
			checkUniqueAccount,
			//permissionRoleCreate,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [hooks.disable()],
		patch: [
			auth.hooks.authenticate('jwt'),
			globalHooks.hasPermission('USER_EDIT'),
			globalHooks.ifNotLocal(securePatching),
			globalHooks.permitGroupOperation,
			sanitizeData,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
			updateAccountUsername,
		],
		remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USER_CREATE'), globalHooks.permitGroupOperation]
	};
};

/**
 *
 * @param user {object} - the user the display name has to be generated
 * @param app {object} - the global feathers-app
 * @returns {string} - a display name of the given user
 */
const getDisplayName = (user, app) => {
	// load protected roles
	return app.service('/roles').find({query:{	// TODO: cache these
		name: ['teacher', 'admin']
	}}).then((protectedRoles) => {
		const protectedRoleIds = (protectedRoles.data || []).map(role => role._id);
		let isProtectedUser = protectedRoleIds.find(role => {
			return (user.roles || []).includes(role);
		});

		user.age = globalHooks.getAge(user.birthday);

		if(isProtectedUser) {
			return user.lastName ? user.lastName : user._id;
		} else {
			return user.lastName ? `${user.firstName} ${user.lastName}` : user._id;
		}
	});
};

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated user
 */
const decorateUser = (hook) => {
	return getDisplayName(hook.result, hook.app)
		.then(displayName => {
			hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
			hook.result.displayName = displayName;
		})
		.then(() => Promise.resolve(hook));
};

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated users
 */
const decorateUsers = (hook) => {
	hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
	const userPromises = (hook.result.data || []).map(user => {
		return getDisplayName(user, hook.app).then(displayName => {
			user.displayName = displayName;
			return user;
		});
	});

	return Promise.all(userPromises).then(users => {
		hook.result.data = users;
		return Promise.resolve(hook);
	});
};

const handleClassId = (hook) => {
	if (!("classId" in hook.data)) {
		return Promise.resolve(hook);
	} else {
		hook.app.service('/classes').patch(hook.data.classId, {
			$push: {userIds: hook.result._id}
		}).then(res => {
			return Promise.resolve(hook);
		});
	}
};

const User = require('../model');

exports.after = {
	all: [],
	find: [decorateUsers],
	get: [
		decorateUser,
		globalHooks.computeProperty(User.userModel, 'getPermissions', 'permissions'),
		globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!'}))
	],
	create: [handleClassId],
	update: [],
	patch: [],
	remove: [removeStudentFromClasses, removeStudentFromCourses]
};
