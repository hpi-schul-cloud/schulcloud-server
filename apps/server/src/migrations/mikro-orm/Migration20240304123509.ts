/* istanbul ignore file */
import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240304123509 extends Migration {
	async up(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'column-board' },
			{ $set: { isVisible: true } }
		);

		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);

		const boardElemensView = [
			{
				$match: {
					boardElementType: 'columnboard',
				},
			},
			{
				$lookup: {
					from: 'column-board-target',
					localField: 'target',
					foreignField: '_id',
					as: 'result',
				},
			},
		];
		const columBoardElements = await this.driver.aggregate('board-element', boardElemensView);
		let affectedRows = 0;
		for (const columnboard of columBoardElements) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (columnboard.result.length) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
				const targetBoard = columnboard.result[0].columnBoard;
				if (targetBoard) {
					// eslint-disable-next-line no-await-in-loop
					const updatedBoard = await this.driver.nativeUpdate(
						'board-element',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
						{ _id: columnboard._id },
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						{ $set: { target: targetBoard } }
					);
					affectedRows += updatedBoard.affectedRows;
				}
			}
		}
		console.info(`Updated ${affectedRows} records in column-element`);

		// TODO remove this collection at a later time. We keep it for now in case is needed to restore
		// await this.getCollection('column-board-target').drop();

		// console.info(`Collection colum-board-target was NOT removed`);
	}

	async down(): Promise<void> {
		const columBoardResponse = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'column-board' },
			{ $unset: { isVisible: false } }
		);

		console.info(`Updated ${columBoardResponse.affectedRows} records in boardnodes`);

		console.error(`column-element cannot be rolled-back. It must be restored from backup!`);
		console.error(`column-board-target cannot be rolled-back. It must be restored from backup!`);
	}
}
