import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241127195120 extends Migration {
	async up(): Promise<void> {
		const db = this.driver.getConnection().getDb();
		await db.renameCollection('room-members', 'room-memberships');
		console.info('Collection renamed from room-members to room-memberships');
	}

	async down(): Promise<void> {
		const db = this.driver.getConnection().getDb();
		await db.renameCollection('room-memberships', 'room-members');
		console.info('Collection renamed from room-memberships to room-members');
	}
}
