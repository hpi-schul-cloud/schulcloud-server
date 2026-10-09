import { Migration } from '@mikro-orm/migrations-mongodb';

const previousMediaSourceId = 'urn:bilo:catalog';
const mediaSourceId = 'urn:bilo:medium';

export class Migration20261007120000 extends Migration {
	public async up(): Promise<void> {
		const mediaSourceResult = await this.getCollection('media-sources').updateOne(
			{ sourceId: previousMediaSourceId },
			{ $set: { sourceId: mediaSourceId } }
		);

		const externalToolResult = await this.getCollection('external-tools').updateMany(
			{ 'medium.mediaSourceId': previousMediaSourceId },
			{ $set: { 'medium.mediaSourceId': mediaSourceId } }
		);

		console.info(
			`Updated ${mediaSourceResult.modifiedCount} Bildungslogin media source and ${externalToolResult.modifiedCount} external tools to ${mediaSourceId}.`
		);
	}
}
