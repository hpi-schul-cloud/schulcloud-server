import { Migration } from '@mikro-orm/migrations-mongodb';

const COLLECTION = 'teams';
const FIELD = 'userIds';
const ARCHIVE_FIELD = 'userIds_archived';

export class Migration20261117084729 extends Migration {
	public async up(): Promise<void> {
		const teams = this.getCollection(COLLECTION);

		// Teams that were already archived must not be touched again, otherwise a re-run would
		// overwrite the archive with the (now empty) userIds and the members would be lost.
		const alreadyArchivedCount = await teams.countDocuments({
			[FIELD]: { $exists: true },
			[ARCHIVE_FIELD]: { $exists: true },
		});
		if (alreadyArchivedCount > 0) {
			console.info(`Skipped ${alreadyArchivedCount} teams that already have '${ARCHIVE_FIELD}'.`);
		}

		const result = await teams.updateMany({ [FIELD]: { $exists: true }, [ARCHIVE_FIELD]: { $exists: false } }, [
			{
				$set: {
					[ARCHIVE_FIELD]: `$${FIELD}`,
					[FIELD]: { $literal: [] },
				},
			},
		]);

		console.info(`Archived '${FIELD}' of ${result.modifiedCount} teams into '${ARCHIVE_FIELD}'.`);
	}

	public async down(): Promise<void> {
		const teams = this.getCollection(COLLECTION);

		const result = await teams.updateMany({ [ARCHIVE_FIELD]: { $exists: true } }, [
			{ $set: { [FIELD]: `$${ARCHIVE_FIELD}` } },
			{ $unset: ARCHIVE_FIELD },
		]);

		console.info(`Restored '${FIELD}' of ${result.modifiedCount} teams from '${ARCHIVE_FIELD}'.`);
	}
}
