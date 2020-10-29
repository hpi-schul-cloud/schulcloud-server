const deleteUser = async (id, app) => {
	return { success: true };
}
const replaceUserWithTombstone = async (id, app) => {
	const modelService = app.service('usersModel');
	const user = await modelService.get(id);
	const { email } = user;
	const deletedEmail = email.indexOf('DELETED_') < 0 ? `DELETED_${email}` : email;
	return modelService.patch(id, {
		email: deletedEmail,
		deletedAt: new Date(),
	});
};

module.exports = {
	replaceUserWithTombstone,
	deleteUser,
};
