import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241113152001 extends Migration {
	async up(): Promise<void> {
		const roomsToSchoolView = [
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
				$match: {
					'roomDetails.school': { $exists: false, $eq: null },
				},
			},
			{
				$lookup: {
					from: 'groups',
					localField: 'userGroup',
					foreignField: '_id',
					as: 'groupDetails',
				},
			},
			{
				$unwind: '$groupDetails',
			},
			{
				$unwind: '$groupDetails.users',
			},
			{
				$lookup: {
					from: 'roles',
					localField: 'groupDetails.users.role',
					foreignField: '_id',
					as: 'roleDetails',
				},
			},
			{
				$unwind: '$roleDetails',
			},
			{
				$match: {
					'roleDetails.name': 'roomeditor',
				},
			},
			{
				$lookup: {
					from: 'users',
					localField: 'groupDetails.users.user',
					foreignField: '_id',
					as: 'userDetails',
				},
			},
			{
				$unwind: '$userDetails',
			},
			{
				$group: {
					_id: '$userDetails.schoolId',
					rooms: { $push: '$roomDetails._id' },
				},
			},
			{
				$project: {
					_id: 0,
					school: '$_id',
					rooms: 1,
				},
			},
		];

		const mappings = await this.driver.aggregate('room-members', roomsToSchoolView);

		for await (const mapping of mappings) {
			const schoolUpdate = await this.driver.nativeUpdate(
				'rooms',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
				{ _id: { $in: mapping.rooms } },
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
				{ $set: { school: mapping.school } }
			);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call
			console.info(`Updated ${schoolUpdate.affectedRows} rooms with school ${mapping.school.toHexString()}`);
		}

		if (mappings.length === 0) {
			console.info(`No rooms without school to update`);
		}
	}

	async down(): Promise<void> {
		await Promise.resolve();
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
