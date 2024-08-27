import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240827145403 extends Migration {
	async up(): Promise<void> {
		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_VIEW', 'ROOM_EDIT'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_VIEW and ROOM_EDIT was added to teacher role.');
		}

		const studentRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'student' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_VIEW'],
					},
				},
			}
		);

		if (studentRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_VIEW was added to student role.');
		}
	}

	async down(): Promise<void> {
		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_VIEW', 'ROOM_EDIT'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_VIEW and ROOM_EDIT was removed from teacher role.');
		}

		const studentRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'student' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_VIEW'],
					},
				},
			}
		);

		if (studentRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_VIEW was removed from student role.');
		}
	}
}
