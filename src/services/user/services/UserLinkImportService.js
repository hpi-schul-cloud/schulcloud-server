const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

const userDataFilter = (user) => ({
	userId: user._id,
	email: user.email,
	firstName: user.firstName,
	lastName: user.lastName,
	importHash: user.importHash,
	schoolId: user.schoolId,
	birthday: user.birthday,
});

class UserLinkImportService {
	constructor(userService) {
		this.userService = userService;
		this.docs = {};
	}

	get(hash) {
		// can not use get becouse the hash can have / that mapped to non existing routes
		return this.userService
			.find({ query: { importHash: hash } })
			.then((users) => {
				if (users.data.length !== 1) {
					throw new BadRequest('Can not match the hash.');
				}
				return userDataFilter(users.data[0]);
			})
			.catch((err) => err);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = UserLinkImportService;
