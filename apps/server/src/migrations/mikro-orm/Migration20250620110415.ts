import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type UserLoginMigration = {
	_id: ObjectId;
	sourceSystem: ObjectId;
	targetSystem: ObjectId;
	school: ObjectId;
	finishedAt: Date;
};

export class Migration20250620110415 extends Migration {
	async up(): Promise<void> {
		const userLoginMigrationCursor = this.getCollection<UserLoginMigration>('user-login-migrations').find({
			finishedAt: { $lte: new Date() },
			sourceSystem: { $exists: true },
		});

		let numberOfFinishedUserLoginMigrationsWithSourceSystem = 0;
		let numberOfSystemReferencesRemoved = 0;
		for await (const migration of userLoginMigrationCursor) {
			numberOfFinishedUserLoginMigrationsWithSourceSystem += 1;
			const system = migration.sourceSystem;

			const shouldRemoveSystem = await this.getCollection('schools').findOne({
				_id: migration.school,
				systems: { $in: [system] },
			});

			if (shouldRemoveSystem) {
				await this.getCollection('schools').updateOne(
					{ _id: migration.school },
					{ $pull: { systems: { $in: [system] } } }
				);
				numberOfSystemReferencesRemoved += 1;
			}
		}

		console.info(
			`Found ${numberOfFinishedUserLoginMigrationsWithSourceSystem} finished user-login-migrations with a source system.`
		);
		console.info(`Removed ${numberOfSystemReferencesRemoved} system references in schools`);
	}

	async down(): Promise<void> {
		const userLoginMigrationCursor = this.getCollection<UserLoginMigration>('user-login-migrations').find({
			finishedAt: { $lte: new Date() },
			sourceSystem: { $exists: true },
		});

		let numberOfFinishedUserLoginMigrationsWithSourceSystem = 0;
		let numberOfSystemReferencesAdded = 0;
		for await (const migration of userLoginMigrationCursor) {
			numberOfFinishedUserLoginMigrationsWithSourceSystem += 1;
			const system = migration.sourceSystem;

			const shouldAddSystem = await this.getCollection('schools').findOne({
				_id: migration.school,
				systems: { $not: { $in: [system] } },
			});

			if (shouldAddSystem) {
				await this.getCollection('schools').updateOne(
					{ _id: migration.school },
					{ $addToSet: { systems: { $each: [system] } } }
				);
				numberOfSystemReferencesAdded += 1;
			}
		}

		console.info(
			`Found ${numberOfFinishedUserLoginMigrationsWithSourceSystem} finished user-login-migrations with a source system.`
		);
		console.info(`Added ${numberOfSystemReferencesAdded} system references in schools`);
	}
}
