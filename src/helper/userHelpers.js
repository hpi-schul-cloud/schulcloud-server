const reqlib = require('app-root-path').require;

const { NotFound } = reqlib('src/errors');

const getUser = (app, userId) =>
	app
		.service('users')
		.get(userId, {
			query: {
				$populate: 'roles',
			},
		})
		.then((user) => {
			if (user === null) {
				throw new Error('User not found.');
			}
			return user;
		})
		.catch((err) => {
			throw new NotFound('Can not fetch user.', err);
		});

const testIfRoleNameExist = (user, ...roleNames) => {
	if ((user.roles[0] || {}).name === undefined) {
		throw new Error('Role is not populated.');
	}
	return user.roles.some(({ name }) => roleNames.includes(name));
};

const isSuperheroUser = async (app, userId) => {
	const user = await getUser(app, userId);
	return testIfRoleNameExist(user, 'superhero');
};

module.exports = {
	isSuperheroUser,
};
