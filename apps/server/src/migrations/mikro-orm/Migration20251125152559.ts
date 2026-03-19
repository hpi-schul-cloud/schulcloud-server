import { Migration } from '@mikro-orm/migrations-mongodb';

const OLD_EXPERT_SCHOOL = 'expert';
const NEW_EXTERNALPERSON_SCHOOL = 'external_person_school';

export class Migration20251125152559 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('schools').updateOne(
			{ purpose: OLD_EXPERT_SCHOOL },
			{ $set: { purpose: NEW_EXTERNALPERSON_SCHOOL } }
		);
	}

	public async down(): Promise<void> {
		await this.getCollection('schools').updateOne(
			{ purpose: NEW_EXTERNALPERSON_SCHOOL },
			{ $set: { purpose: OLD_EXPERT_SCHOOL } }
		);
	}
}
