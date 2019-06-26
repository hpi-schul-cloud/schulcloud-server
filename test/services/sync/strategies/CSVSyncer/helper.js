const { userModel } = require('../../../../../src/services/user/model.js');
const accountModel = require('../../../../../src/services/account/model.js');

const app = require('../../../../../src/app');

const deleteUser = async (email = 'foo@bar.baz') => {
	await userModel.deleteOne({ email });
	await accountModel.deleteOne({ username: email });
};

const createClass = async ([gradeLevelName, className, schoolId]) => {
	const gradeLevels = await app.service('gradeLevels').find({
		query: {
			name: gradeLevelName,
		},
		paginate: false,
	});
	let classObject;
	if (gradeLevels.length > 0) {
		classObject = {
			schoolId,
			nameFormat: 'gradeLevel+name',
			gradeLevel: gradeLevels[0]._id,
			name: className,
		};
	} else {
		classObject = {
			schoolId,
			nameFormat: 'static',
			name: className,
		};
	}
	await app.service('classes').create(classObject);
};

const findClass = async ([gradeLevelName, className]) => {
	const gradeLevels = await app.service('gradeLevels').find({
		query: {
			name: gradeLevelName,
		},
		paginate: false,
	});
	let classObject;
	if (gradeLevels.length > 0) {
		[classObject] = await app.service('classes').find({
			query: {
				nameFormat: 'gradeLevel+name',
				gradeLevel: gradeLevels[0]._id,
				name: className,
			},
			paginate: false,
		});
	} else {
		[classObject] = await app.service('classes').find({
			query: {
				nameFormat: 'static',
				name: className,
			},
			paginate: false,
		});
	}
	return classObject;
};

const deleteClass = async ([gradeLevelName, className]) => {
	const classObject = await findClass([gradeLevelName, className]);
	await app.service('classes').remove(classObject._id);
};

class MockEmailService {
	constructor(eventHandler) {
		this.eventHandler = eventHandler;
	}

	create({ subject, content }, params) {
		this.eventHandler({ subject, content, params });
		return Promise.resolve();
	}
}

module.exports = {
	deleteUser,
	createClass,
	findClass,
	deleteClass,
	MockEmailService,
};
