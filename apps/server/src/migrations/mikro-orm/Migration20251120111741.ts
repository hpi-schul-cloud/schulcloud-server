import { Migration } from '@mikro-orm/migrations-mongodb';

const ROLE_EXPERT_OLD = 'expert';
const ROLE_EXTERNALPERSON_NEW = 'externalPerson';

export class Migration20251120111741 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('roles').updateOne({ name: ROLE_EXPERT_OLD }, { $set: { name: ROLE_EXTERNALPERSON_NEW } });
	}

	public async down(): Promise<void> {
		await this.getCollection('roles').updateOne({ name: ROLE_EXTERNALPERSON_NEW }, { $set: { name: ROLE_EXPERT_OLD } });
	}
}
