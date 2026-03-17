import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260317132520 extends Migration {
	public async up(): Promise<void> {
		console.log('Dropping Rocketchat Collections. WARNING: this can not be rolled back!');

		await this.getCollection('rocketchatusers').drop();
		await this.getCollection('rocketchatchannels').drop();

		console.log('Finished dropping Rocketchat Collections');
	}

	public async down(): Promise<void> {
		console.log('Rocketchat Collections can not be restored. If necessary, restore from backup.');

		return Promise.resolve();
	}
}
