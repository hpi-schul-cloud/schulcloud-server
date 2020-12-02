const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { coursesRepo } = require('../repo/index');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

/**
 *
 * @param {string} userId
 */
const deleteUserData = (userId) => {
	// TODO permissions

	// delete user relations from course:
	// (userIds[ObjectId], teacherIds[ObjectId], substitutionIds[ObjectId])
	// add to trashbin

	// delete user relations from course groups:
	// (userIds[ObjectId])

	// add to trashbin:
	// courses: [{
	//  id: courseId
	// 	user: Boolean,
	// 	teacher: Boolean,
	// 	substitutionTeacher: Boolean
	// 	courseGroups: [courseGroupIds]
	// }]
	//

	// delete user from lesson contents
	// see mapUser, seems not to be required anywhere (can be deleted)

	const trashBinData = [];
	const success = false;
	return { success, trashBinData };
};

module.exports = {
	deleteUserData,
};
