const { Forbidden, NotFound } = require('@feathersjs/errors');

/**
 * @param  {string, array[string]} inputPermissions
 * @returns resolves if the current user has ANY of the given permissions
 */
const hasPermission = (inputPermissions) => {
	const permissionNames = (typeof inputPermissions === 'string') ? [inputPermissions] : inputPermissions;

	return (context) => {
		const { params: { account, provider }, app } = context;
		// If it was an internal call then skip this context
		if (!provider) {
			return Promise.resolve(context);
		}

		if (!account && !account.userId) {
			throw new Forbidden('Can not read account data');
		}

		// Otherwise check for user permissions
		return app.service('users').get(account.userId)
			.then(({ permissions = [] }) => {
				const hasAnyPermission = permissionNames.some((perm) => permissions.includes(perm));
				if (!hasAnyPermission) {
					throw new Forbidden(`You don't have one of the permissions: ${permissionNames.join(', ')}.`);
				}
				return Promise.resolve(context);
			});
	};
};


const testIfRoleNameExist = (user, roleNames) => {
	if (typeof roleNames === 'string') {
		roleNames = [roleNames];
	}
	if ((user.roles[0] || {}).name === undefined) {
		throw new Error('Role is not populated.');
	}
	return user.roles.some(({ name }) => roleNames.includes(name));
};

const getUser = (context) => context.app.service('users').get(context.params.account.userId, {
	query: {
		$populate: 'roles',
		// todo select in roles only role name
		// test which keys from user should selected
	},
}).then((user) => {
	if (user === null) {
		throw new Error('User not found.');
	}
	return user;
}).catch((err) => {
	throw new NotFound('Can not fetch user.', err);
});

/* todo: Many request pass id as second parameter, but it is confused with the logic that should pass.
	It should evaluate and make clearly.
 */
const userIsInThatCourse = (user, { userIds = [], teacherIds = [], substitutionIds = [] }, isCourse) => {
	const userId = user._id.toString();
	if (isCourse) {
		return userIds.some((u) => u.toString() === userId.toString())
			|| teacherIds.some((u) => u.toString() === userId.toString())
			|| substitutionIds.some((u) => u.toString() === userId.toString());
	}

	return userIds.some((u) => u.toString() === userId.toString()) || testIfRoleNameExist(user, 'teacher');
};


const restrictToUsersOwnCourses = (context) => getUser(context).then((user) => {
	if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
		return context;
	}
	const { _id } = user;
	if (context.method === 'find') {
		context.params.query.$and = (context.params.query.$and || []);
		context.params.query.$and.push({
			$or: [
				{ userIds: _id },
				{ teacherIds: _id },
				{ substitutionIds: _id },
			],
		});
	} else {
		const courseService = context.app.service('courses');
		return courseService.get(context.id).then((course) => {
			if (!userIsInThatCourse(user, course, true)) {
				throw new Forbidden('You are not in that course.');
			}
		});
	}

	return context;
});

const injectUserId = (context) => {
	if (typeof (context.params.provider) === 'undefined') {
		if (context.data && context.data.userId) {
			context.params.account = { userId: context.data.userId };
			context.params.payload = { userId: context.data.userId };
			delete context.data.userId;
		}
	}

	return context;
};

module.exports = {
	hasPermission,
	restrictToUsersOwnCourses,
	injectUserId,
	getUser,
};
