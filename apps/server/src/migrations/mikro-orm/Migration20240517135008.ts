import { Migration } from '@mikro-orm/migrations-mongodb';
import { MediaBoardColors, BoardLayout } from '@modules/board';

export class Migration20240517135008 extends Migration {
	public async up(): Promise<void> {
		const mediaBoards = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-board' },
			{
				layout: BoardLayout.LIST,
				mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
				mediaAvailableLineCollapsed: false,
			}
		);
		const mediaLines = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-line' },
			{
				backgroundColor: MediaBoardColors.TRANSPARENT,
				collapsed: false,
			}
		);

		if (mediaBoards.affectedRows > 0) {
			console.info(`Additional attributes added to ${mediaBoards.affectedRows} Media boards`);
		}

		if (mediaLines.affectedRows > 0) {
			console.info(`Additional attributes added to ${mediaLines.affectedRows} Media lines`);
		}
	}

	public async down(): Promise<void> {
		const mediaBoards = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-board' },
			{
				$unset: {
					layout: '',
					mediaAvailableLineBackgroundColor: '',
					mediaAvailableLineCollapsed: '',
				},
			}
		);
		const mediaLines = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-line' },
			{
				$unset: {
					backgroundColor: '',
					collapsed: '',
				},
			}
		);

		if (mediaBoards.affectedRows > 0) {
			console.info(`Additional attributes removed from ${mediaBoards.affectedRows} Media boards`);
		}

		if (mediaLines.affectedRows > 0) {
			console.info(`Additional attributes removed from ${mediaLines.affectedRows} Media lines`);
		}
	}
}
