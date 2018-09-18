const errors = require('feathers-errors');
const _ = require('lodash');
const CourseModel = require('../../user-group/model').courseModel;
const LessonModel = require('../../lesson/model');
const ClassModel = require('../../user-group/model').classModel;
const FilePermissionModel = require('../model').fileModel;

class FilePermissionHelper {
	constructor() {
	}

	/**
	 * checks extra permissions for a given file, e.g. for shared files
	 * @param userId {String} - the User for which the permissions are checked
	 * @param fileKey {String} - the key/path to the file
	 * @param permissionTypes [String] - the type of permissions which will be checked
	 * @param throwError {Boolean} - whether to throw an error or not
	 */
	checkExtraPermissions(userId, fileKey, permissionTypes, throwError, queries) {
		if (!fileKey || fileKey === '') return throwError ? Promise.reject(new errors.Forbidden("You don't have permissions!")) : false;

		return FilePermissionModel.find({key: fileKey}).exec().then(res => {

			// check whether key and shareToken are identical to return file
			if (res[0].key === (queries || {}).key && res[0].shareToken === (queries || {}).shareToken && typeof (queries || {}).shareToken !== 'undefined') {
				return Promise.resolve({permission: "shared"});
			}

			// res-object should be unique for file key, but it's safer to map all permissions
			let permissions = _.flatten(res.map(filePermissions => filePermissions.permissions));

			// try to find given permissionTypes for given userId
			let permissionExists = permissions.filter(p => {
					return JSON.stringify(userId) === JSON.stringify(p.userId) && _.difference(permissionTypes, p.permissions).length === 0;
				}).length > 0;

			if (!permissionExists) return throwError ? Promise.reject(new errors.Forbidden("You don't have permissions!")) : false;

			return Promise.resolve({permission: "shared"});
		}).catch(err => {
			return throwError ? Promise.reject(new errors.Forbidden("You don't have permissions!")) : false;
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
					return Promise.resolve({context: 'user'});
				}
			case 'courses':
				// checks, a) whether the user is student or teacher of the course, b) the course exists
				return CourseModel.find({
					$and: [
						{$or: [{userIds: userId}, {teacherIds: userId}]},
						{_id: contextId}
					]
				}).exec().then(res => {
					// user is not in that course, check if the file is one of a shared lesson
					if (!res || res.length <= 0) {
						return LessonModel.find({
							$and: [
								{ "contents.content.text": { $regex: filePath, $options: 'i'}},
								{ "shareToken": { $exists: true }}
								]
						}).exec().then(res => {
							if (!res || res.length <= 0) {
								return Promise.reject(new errors.Forbidden("You don't have permissions!"));
							}
							return Promise.resolve({context: res[0]});
						});
					}
					return Promise.resolve({context: res[0]});
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
					return Promise.resolve({context: res[0]});
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
	 * @param throwError {Boolean} - whether to throw an error or not
	 * @returns {*}
	 */
	checkPermissions(userId, filePath, permissions = ["can-read", "can-write"], throwError = true, queries) {
		return this.checkNormalPermissions(userId, filePath).catch(err => this.checkExtraPermissions(userId, filePath, permissions, throwError, queries));
	}
}

module.exports = new FilePermissionHelper();
