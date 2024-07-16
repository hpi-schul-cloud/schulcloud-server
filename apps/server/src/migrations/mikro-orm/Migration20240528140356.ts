import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240528140356 extends Migration {
	async up(): Promise<void> {
		const mediaBoards = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-board' },
			{
				$rename: { mediaAvailableLineBackgroundColor: 'backgroundColor', mediaAvailableLineCollapsed: 'collapsed' },
			}
		);

		if (mediaBoards.affectedRows > 0) {
			console.info(`Additional attributes added to ${mediaBoards.affectedRows} Media boards`);
		}
	}

	async down(): Promise<void> {
		const mediaBoards = await this.driver.nativeUpdate(
			'boardnodes',
			{ type: 'media-board' },
			{
				$rename: { backgroundColor: 'mediaAvailableLineBackgroundColor', collapsed: 'mediaAvailableLineCollapsed' },
			}
		);

		if (mediaBoards.affectedRows > 0) {
			console.info(`Additional attributes removed from ${mediaBoards.affectedRows} Media boards`);
		}
	}
}
