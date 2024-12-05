import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241128155801 extends Migration {
	async up(): Promise<void> {
		const roomMembershipToSchoolView = [
			{
				$match: {
					school: { $exists: false, $eq: null },
				},
			},
			{
				$lookup: {
					from: 'rooms',
					localField: 'room',
					foreignField: '_id',
					as: 'roomDetails',
				},
			},
			{
				$unwind: '$roomDetails',
			},
			{
				$group: {
					_id: '$roomDetails.school',
					roomMemberships: { $push: '$_id' },
				},
			},
			{
				$project: {
					_id: 0,
					school: '$_id',
					roomMemberships: 1,
				},
			},
		];

		const mappings = await this.driver.aggregate('room-memberships', roomMembershipToSchoolView);

		for await (const mapping of mappings) {
			const schoolUpdate = await this.driver.nativeUpdate(
				'room-memberships',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
				{ _id: { $in: mapping.roomMemberships } },
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
				{ $set: { school: mapping.school } }
			);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call
			console.info(`Updated ${schoolUpdate.affectedRows} rooms with school ${mapping.school.toHexString()}`);
		}

		if (mappings.length === 0) {
			console.info(`No roomMemberships without school to update`);
		}
	}

	async down(): Promise<void> {
		await Promise.resolve();
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
