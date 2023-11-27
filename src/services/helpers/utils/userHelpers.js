/**
 * Returns a User with given userId
 * @param {*} ref 				this
 * @param {ObjectId} userId 	UserId
 * @param {*} req				requestParams (optional)
 * @returns {Object}			user object
 */
const getUser = async (app, userId) => {
	const user = await app.service('users').get(userId);
	return user;
};

module.exports = {
	getUser,
};
