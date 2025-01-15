import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240320122229 extends Migration {
	public async up(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate(
			'boardnodes',
			{ $and: [{ type: 'column-board' }, { title: '' }] },
			{ title: 'Kurs-Board' }
		);
		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.error(`boardnodes cannot be rolled-back. It must be restored from backup!`);
	}
}
