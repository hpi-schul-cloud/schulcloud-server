const { importUserModel } = require('../../../../src/services/sync/model/importUser.schema');

let createdImportUserIds = [];

const rnd = () => Math.round(Math.random() * 10000);

const createTestImportUser =
	(opt) =>
	async ({
		firstName = 'Max',
		lastName = 'Mustermann',
		email = `max${`${Date.now()}_${rnd()}`}@mustermann.de`,
		schoolId = opt.schoolId,
		roles = [],
		ldapDn = `ldapDN_${rnd()}`,
		ldapId = `ldapId_${rnd()}`,
		system,
		classNames,
	} = {}) => {
		const importUser = await importUserModel.create({
			firstName,
			lastName,
			email,
			schoolId,
			roles,
			ldapDn,
			ldapId,
			system,
			classNames,
		});

		createdImportUserIds.push(importUser._id.toString());

		return importUser;
	};

const cleanup = () => async () => {
	if (createdImportUserIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdImportUserIds;
	createdImportUserIds = [];
	return importUserModel.deleteMany({ _id: { $in: ids } });
};

module.exports = (opt) => ({
	create: createTestImportUser(opt),
	cleanup: cleanup(),
	info: createdImportUserIds,
});
