import { Migration } from '@mikro-orm/migrations-mongodb';
import moment from 'moment';

export class Migration20250911071838 extends Migration {
	public async up(): Promise<void> {
		// Due to a long living bug in the legacy client a lot of birthdays were not saved with 0 hours on the correct day but with 22 or 23 hours on the day before.
		// These birthdays are displayed wrong in the nuxt-client. The bug is fixed and we fix the existing data with this migration.
		const usersWithWrongBirthday = this.getCollection('users').find({
			birthday: { $ne: null },
			$expr: { $ne: [{ $hour: '$birthday' }, 0] },
		});

		let count = 0;

		for await (const user of usersWithWrongBirthday) {
			const { birthday } = user;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const updatedBirthday = moment(birthday).utc().add(1, 'days').hour(0).minute(0).second(0).millisecond(0).toDate();

			await this.getCollection('users').updateOne({ _id: user._id }, { $set: { birthday: updatedBirthday } });

			count += 1;
		}

		console.info(`Fixed birthday of ${count} users.`);
	}

	public async down(): Promise<void> {
		// no possibility to revert
	}
}
