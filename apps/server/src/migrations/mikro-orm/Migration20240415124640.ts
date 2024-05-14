import { Migration } from '@mikro-orm/migrations-mongodb';
import { BoardLayout, BoardNodeType } from '@modules/board';

export class Migration20240415124640 extends Migration {
	async up(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate<{ type: BoardNodeType; layout: BoardLayout }>(
			'boardnodes',
			{ $and: [{ type: 'column-board' }, { layout: { $exists: false } }] },
			{ layout: BoardLayout.COLUMNS }
		);
		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		console.error(`boardnodes cannot be rolled-back. It must be restored from backup!`);
	}
}
