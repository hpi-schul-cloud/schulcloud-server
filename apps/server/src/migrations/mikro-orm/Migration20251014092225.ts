import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20251014092225 extends Migration {
	public async up(): Promise<void> {
		// Add GUESTEXTERNALPERSON role
		await this.getCollection('roles').insertOne({
			name: 'guestExternalPerson',
			permissions: [],
		});
		console.info('Added GUESTEXTERNALPERSON role');
	}

	public async down(): Promise<void> {
		// Remove GUESTEXTERNALPERSON role
		await this.getCollection('roles').deleteOne({ name: 'guestExternalPerson' });
		console.info('Rollback: Removed GUESTEXTERNALPERSON role');
	}
}
