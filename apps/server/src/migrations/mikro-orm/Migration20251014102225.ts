import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20251014102225 extends Migration {
	public async up(): Promise<void> {
		const roomInvitationLinks = await this.getCollection('room-invitation-links').updateMany(
			{
				isOnlyForTeachers: { $exists: true },
			},
			[
				{
					$set: {
						isUsableByStudents: { $not: '$isOnlyForTeachers' },
					},
				},
				{
					$unset: 'isOnlyForTeachers',
				},
			]
		);
		console.info(
			"Updated property 'isOnlyForTeachers' in 'room-invitation-links' to 'isUsableByStudents' with inverted value: ",
			roomInvitationLinks.modifiedCount
		);
	}

	public async down(): Promise<void> {
		const roomInvitationLinks = await this.getCollection('room-invitation-links').updateMany(
			{
				isUsableByStudents: {
					$exists: true,
				},
			},
			[
				{
					$set: {
						isOnlyForTeachers: { $not: '$isUsableByStudents' },
					},
				},
				{
					$unset: 'isUsableByStudents',
				},
			]
		);

		console.info("Revert setting 'isUsableByStudents' in 'room-invitation-links': ", roomInvitationLinks.modifiedCount);
	}
}
