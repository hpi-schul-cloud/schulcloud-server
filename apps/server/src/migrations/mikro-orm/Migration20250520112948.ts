import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250520112948 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('systems').updateOne({ alias: 'SANIS' }, { $set: { alias: 'moin.schule' } });
		console.log('The alias of the SANIS system has been renamed to moin.schule.');
	}

	public async down(): Promise<void> {
		await this.getCollection('systems').updateOne({ alias: 'moin.schule' }, { $set: { alias: 'SANIS' } });
		console.log('The alias of the moin.schule system has been renamed to SANIS.');
	}
}
