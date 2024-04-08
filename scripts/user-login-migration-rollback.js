const mongoose = require('mongoose');

const { Schema } = mongoose;
const { program } = require('commander');

program
	.requiredOption('-u, --url <value>', '(Required) URL of the MongoDB instance')
	.requiredOption('-s, --schoolId <value>', 'The schoolId of the migrated school, that should be roll-backed.')
	.addHelpText(
		'after',
		'This script rolls back all user-login-migrations of one school. It needs the values of the MongoDB url and the Object Id of the school. The call should look like:\n' +
			"node .\\scripts\\user-login-migration-rollback.js -s '5f2987e020834114b8efd6f8' -u 'mongodb://localhost:27018/scapp?directConnection=true'"
	);
program.parse();

const options = program.opts();
const mongodbUrl = options.url;
const { schoolId } = options;

const close = async () => mongoose.connection.close();

const connect = async () => {
	const mongooseOptions = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	return mongoose.connect(mongodbUrl, mongooseOptions);
};

const User = mongoose.model(
	'users_0406202411483',
	new Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			schoolId: { type: Schema.Types.ObjectId, required: true },
			ldapId: { type: Schema.Types.String, required: false },
			previousExternalId: { type: Schema.Types.String, required: false },
			lastLoginSystemChange: { type: Schema.Types.Date, required: false },
		},
		{
			timestamps: true,
		}
	),
	'users'
);

const Account = mongoose.model(
	'accounts_0406202411483',
	new Schema(
		{
			userId: { type: Schema.Types.ObjectId, required: true },
			systemId: { type: Schema.Types.ObjectId, required: false },
		},
		{
			timestamps: true,
		}
	),
	'accounts'
);

const UserLoginMigration = mongoose.model(
	'user_login_migration_0406202411483',
	new Schema(
		{
			school: { type: Schema.Types.ObjectId, required: true },
			sourceSystem: { type: Schema.Types.ObjectId, required: false },
			startedAt: { type: Schema.Types.Date, required: true },
		},
		{
			timestamps: true,
		}
	),
	'user-login-migrations'
);

const up = async () => {
	console.info('Rollback started');
	await connect();
	const userLoginMigration = await UserLoginMigration.findOne({ school: schoolId }).lean().exec();

	const migratedUsersFromSchool = await User.find({
		lastLoginSystemChange: { $gte: userLoginMigration.startedAt },
		schoolId,
	})
		.lean()
		.exec();
	console.info(`Found ${migratedUsersFromSchool.length} migrated users. Starting rollback.`);

	for await (const user of migratedUsersFromSchool) {
		user.ldapId = user.previousExternalId;

		await User.findOneAndUpdate(
			{ _id: user._id },
			{ $unset: { lastLoginSystemChange: '', previousExternalId: '', ldapId: '' } }
		);

		if (user.previousExternalId) {
			await User.findOneAndUpdate(
				{ _id: user._id },
				{
					$set: { ldapId: user.ldapId },
				}
			);
		}

		if (userLoginMigration.sourceSystem) {
			await Account.findOneAndUpdate({ userId: user._id }, { $set: { systemId: userLoginMigration.sourceSystem } });
		} else {
			await Account.findOneAndUpdate({ userId: user._id }, { $unset: { systemId: '' } });
		}
	}
	console.info('Finished without errors');

	await close();
	return Promise.resolve();
};

(async () => {
	try {
		await up();
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
