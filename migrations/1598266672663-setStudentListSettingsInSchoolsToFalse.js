const logger = require('../src/logger');
const { connect, close } = require('../src/utils/database');

const { schoolModel: SchoolModel } = require('../src/services/school/model');

const reduceToId = (s) => s._id;

const run = async () => {
	const allSchools = await SchoolModel.find({
		'permissions.teacher.STUDENT_LIST': { $ne: true },
	})
		.select(['permissions', 'name'])
		.lean()
		.exec();

	const relatedSchools = [];
	const schoolsWithoutPermissionFlag = [];

	allSchools.forEach((s) => {
		if (s && s.permissions && s.permissions.teacher && typeof s.permissions.teacher.STUDENT_LIST === 'boolean') {
			if (s.permissions.teacher.STUDENT_LIST === false) {
				relatedSchools.push(s);
			}
		} else {
			schoolsWithoutPermissionFlag.push(s);
		}
	});

	logger.info('Schools with permissions.teacher.STUDENT_LIST=false', relatedSchools.map(reduceToId));
	logger.info('Schools without permissions.teacher.STUDENT_LIST', schoolsWithoutPermissionFlag.map(reduceToId));

	return SchoolModel.updateMany(
		{
			'permissions.teacher.STUDENT_LIST': { $ne: true },
		},
		{
			$set: {
				'permissions.teacher.STUDENT_LIST': true,
			},
		}
	)
		.lean()
		.exec();
};

module.exports = {
	async up() {
		// eslint-disable-next-line no-process-env
		if (!process.env.SC_TITLE || process.env.SC_TITLE === 'Niedersächsische Bildungscloud') {
			logger.warning(
				`Migration is not executed for this instance. 
				Because process.env.SC_TITLE is not set, or instance is xxxx.`
			);
			return;
		}
		await connect();
		await run()
			.then((patchResultObject) => {
				logger.info(patchResultObject);
			})
			.catch((err) => {
				logger.info('migration setStudentListSettingsInSchoolsToFalse run into error.');
				logger.error(err);
			});
		await close();
	},
	async down() {
		logger.warning('In this case no rollback is implemented');
	},
};
