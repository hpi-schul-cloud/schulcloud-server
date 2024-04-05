const mongoose = require('mongoose');

const { Schema } = mongoose;
const { program } = require('commander');
const { v4: uuidv4 } = require('uuid');
const { SchoolEntity, UserLoginMigrationEntity } = require('../apps/server/src/shared/domain/entity');

program.requiredOption('-u, --url <value>', '(Required) URL of the MongoDB instance');
program.parse();

const options = program.opts();
const mongodbUrl = options.url;

const close = async () => mongoose.connection.close();

const connect = async () => {
	const mongooseOptions = {
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true,
		useUnifiedTopology: true,
	};

	return mongoose.connect(mongodbUrl, mongooseOptions);
};

const User = mongoose.model(
	'users_0406202411483',
	new Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			ldapId: { type: Schema.Types.ObjectId, required: false },
			previousExternalId: { type: Schema.Types.ObjectId, required: false },
			lastLoginChange: { type: Schema.Types.Date, required: false },
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
			school: {
				_id: { type: Schema.Types.ObjectId, required: true },
			},
			sourceSystem: { type: Schema.Types.ObjectId, required: false },
			startedAt: { type: Schema.Types.Date, required: true },
		},
		{
			timestamps: true,
		}
	),
	'user-login-migrations'
);

const up = async (schoolId) => {
	await connect();

	const migrationStart = await UserLoginMigration.findOne({ school: { _id: schoolId } })
		.select('startedAt')
		.lean()
		.exec();
	// const migrationStart = migration.startedAt;

	const migratedUsersFromSchool = await User.find({ lastLoginSystemChange: { $gte: migrationStart } })
		.lean()
		.exec();

	migratedUsersFromSchool.forEach((user) => {
		if (user.previousExternalId) {
			user.ldapId = user.previousExternalId;
			user.previousExternalId = undefined;
		}
		user.lastLoginChange = undefined;

		await Account.findOneAndUpdate({userId: user.id})
	});
};

(async () => {
	try {
		await up(schoolId);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
