const errors = require('feathers-errors');
const _ = require('lodash');
const CourseModel = require('../../user-group/model').courseModel;
const ClassModel = require('../../user-group/model').classModel;
const FilePermissionModel = require('../proxy-model').fileModel;

class FilePermissionHelper {
	constructor() {
	}

	/**
	 * checks extra permissions for a given file, e.g. for shared files
	 * @param userId {String} - the User for which the permissions are checked
	 * @param fileKey {String} - the key/path to the file
	 * @param permissionTypes [String] - the type of permissions which will be checked
	 */
	checkExtraPermissions(userId, fileKey, permissionTypes) {
		if (!fileKey || fileKey === '') return Promise.reject(new errors.Forbidden("You don't have permissions!"));

		return FilePermissionModel.find({key: fileKey}).exec().then(res => {
			// res-object should be unique for file key, but it's safer to map all permissions
			let permissions = _.flatten(res.map(filePermissions => filePermissions.permissions));

			// try to find given permissionTypes for given userId
			let permissionExists = permissions.filter(p => {
					return JSON.stringify(userId) === JSON.stringify(p.userId) && _.difference(permissionTypes, p.permissions).length === 0;
				}).length > 0;

			if (!permissionExists) return Promise.reject(new errors.Forbidden("You don't have permissions!"));

			return Promise.resolve();
		}).catch(err => {
			return Promise.reject(new errors.Forbidden("You don't have permissions!"));
		});
	}

	checkNormalPermissions(userId, filePath) {
		let values = filePath.split("/");
		if (values[0] === '') values = values.slice(1);	// omit empty component for leading slash
		if (values.length < 2) return Promise.reject(new errors.BadRequest("Path is invalid"));
		const contextType = values[0];
		const contextId = values[1];
		switch (contextType) {
			case 'users':	// user's own files
				if (contextId !== userId.toString()) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				} else {
					return Promise.resolve();
				}
			case 'courses':
				// checks, a) whether the user is student or teacher of the course, b) the course exists
				return CourseModel.find({
					$and: [
						{$or: [{userIds: userId}, {teacherIds: userId}]},
						{_id: contextId}
					]
				}).exec().then(res => {
					if (!res || res.length <= 0) {
						return Promise.reject(new errors.Forbidden("You don't have permissions!"));
					}
					return Promise.resolve(res);
				});
			case 'classes':
				// checks, a) whether the user is student or teacher of the class, b) the class exists
				return ClassModel.find({
					$and: [
						{$or: [{userIds: userId}, {teacherIds: userId}]},
						{_id: contextId}
					]
				}).exec().then(res => {
					if (!res || res.length <= 0) {
						return Promise.reject(new errors.Forbidden("You don't have permissions!"));
					}
					return Promise.resolve(res);
				});
			default:
				return Promise.reject(new errors.BadRequest("Path is invalid"));
		}
	}

	/**
	 * verifies whether the given userId has permission for the given directory (course, user, class)
	 * @param userId {String}
	 * @param filePath {String} - e.g. users/{userId}
	 * @param permissions [String] - extra permissions to check
	 * @returns {*}
	 */
	checkPermissions(userId, filePath, permissions = ["can-read", "can-write"]) {
		return this.checkNormalPermissions(userId, filePath).catch(err => this.checkExtraPermissions(userId, filePath, permissions));
	}
}

module.exports = new FilePermissionHelper();
