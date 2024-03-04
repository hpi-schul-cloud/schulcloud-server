import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240304123509 extends Migration {
	async up(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'column-board' },
			{ $set: { isVisible: true } }
		);

		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);
	}

	async down(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'column-board' },
			{ $unset: { isVisible: false } }
		);

		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);
	}
}
