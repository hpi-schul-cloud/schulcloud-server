import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260303090629 extends Migration {
	public async up(): Promise<void> {
		/* remove student permission from schools
		"permissions": {
			"student": {
				"LERNSTORE_VIEW": true
			},
			"teacher": {
				"STUDENT_LIST": true
			}
		},
		*/
		const results = await this.getCollection('schools').updateMany(
			{ $or: [{'permissions.student.LERNSTORE_VIEW': { $exists: true } }, {'permissions.student': { $eq: {} } } ] },
			{ $unset: { 'permissions.student': '' } }
		);

		console.log(`Removed student student.LERNSTORE_VIEW permissions ${results.modifiedCount} from schools`);
	}
}
