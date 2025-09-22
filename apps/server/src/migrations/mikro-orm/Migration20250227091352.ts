import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type FileRecord = {
	_id: ObjectId;
	name: string;
};

type ExternalToolWithThumbnail = {
	thumbnail: {
		uploadUrl: string;
		fileRecord: ObjectId;
		fileName: string;
	};
};

export class Migration20250227091352 extends Migration {
	public async up(): Promise<void> {
		const externalToolCursor = this.getCollection<ExternalToolWithThumbnail>('external-tools').find({
			thumbnail: { $exists: true },
		});

		let updateCount = 0;
		for await (const toolDoc of externalToolCursor) {
			const thumbnailFileRecord = await this.getCollection<FileRecord>('filerecords').findOne({
				_id: toolDoc.thumbnail.fileRecord,
			});

			if (!thumbnailFileRecord) {
				console.warn(
					`Failed to find file record (${toolDoc.thumbnail.fileRecord.toHexString()}) for external tool thumbnail (${toolDoc._id.toHexString()})`
				);
				// eslint-disable-next-line no-continue
				continue;
			}

			await this.getCollection<ExternalToolWithThumbnail>('external-tools').updateOne(
				{
					_id: toolDoc._id,
				},
				{
					$set: {
						'thumbnail.fileName': thumbnailFileRecord.name,
					},
				}
			);

			updateCount += 1;
		}

		console.info('Updated file record references in external tools: ', updateCount);
	}

	public async down(): Promise<void> {
		const externalTool = await this.getCollection<ExternalToolWithThumbnail>('external-tools').updateMany(
			{
				thumbnail: { $exists: true },
			},
			{
				$unset: {
					'thumbnail.fileName': '',
				},
			}
		);

		console.info('Rollback of file record references in external tools:', externalTool.modifiedCount);
	}
}
