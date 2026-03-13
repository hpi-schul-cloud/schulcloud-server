import { Migration } from '@mikro-orm/migrations-mongodb';

const OLD_EXPERT_SCHOOL_NAME = 'Expertenschule';
const NEW_EXTERNALPERSON_SCHOOL_NAME = 'Externe-Personen-Schule';

export class Migration20251126090707 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('schools').updateOne(
			{ name: OLD_EXPERT_SCHOOL_NAME },
			{ $set: { name: NEW_EXTERNALPERSON_SCHOOL_NAME } }
		);
	}

	public async down(): Promise<void> {
		await this.getCollection('schools').updateOne(
			{ name: NEW_EXTERNALPERSON_SCHOOL_NAME },
			{ $set: { name: OLD_EXPERT_SCHOOL_NAME } }
		);
	}
}
