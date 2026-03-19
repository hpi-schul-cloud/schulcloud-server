import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260317132520 extends Migration {
	public async up(): Promise<void> {
		console.log('Dropping Rocketchat Collections. WARNING: this can not be rolled back!');

		try {
			await this.getCollection('rocketchatusers').drop();
		} catch (error: any) {
			// Ignore "NamespaceNotFound" (collection does not exist) to keep migration idempotent
			if (
				error?.code !== 26 &&
				error?.codeName !== 'NamespaceNotFound' &&
				!String(error?.message || '').includes('NamespaceNotFound')
			) {
				throw error;
			}
		}

		try {
			await this.getCollection('rocketchatchannels').drop();
		} catch (error: any) {
			// Ignore "NamespaceNotFound" (collection does not exist) to keep migration idempotent
			if (
				error?.code !== 26 &&
				error?.codeName !== 'NamespaceNotFound' &&
				!String(error?.message || '').includes('NamespaceNotFound')
			) {
				throw error;
			}
		}

		console.log('Finished dropping Rocketchat Collections');
	}

	public async down(): Promise<void> {
		console.log('Rocketchat Collections can not be restored. If necessary, restore from backup.');

		return Promise.resolve();
	}
}
