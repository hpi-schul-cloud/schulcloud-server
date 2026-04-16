import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260217135451 extends Migration {
	public async up(): Promise<void> {
		const fieldsToUpdate = [
			['courses', 'userIds'],
			['courses', 'teacherIds'],
			['courses', 'substitutionIds'],
			['courses', 'classIds'],
			['courses', 'groupIds'],
			['coursegroups', 'userIds'],
			['dashboardelement', 'referenceIds'],
			['board', 'referenceIds'],
			['lessons', 'materialIds'],
			['roles', 'roles'],
			['schools', 'systems'],
			['submissions', 'teamMembers'],
			['homeworks', 'archived'],
			['users', 'roles'],
		];

		for (const [collectionName, fieldName] of fieldsToUpdate) {
			await this.addDefaultEmptyArray(collectionName, fieldName);
		}
	}

	public async down(): Promise<void> {
		// no possibility to revert
	}

	private async addDefaultEmptyArray(collectionName: string, fieldName: string): Promise<void> {
		const result = await this.getCollection(collectionName).updateMany(
			{ $or: [{ [fieldName]: { $exists: false } }, { [fieldName]: null }] },
			{ $set: { [fieldName]: [] } }
		);

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		console.info(
			`Added ${result.modifiedCount} of ${result.matchedCount} default empty arrays for ${fieldName} in ${collectionName}`
		);
	}
}
