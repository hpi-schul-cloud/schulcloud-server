import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type MediaSourceEntity = {
	sourceId: string;
};

type MediaEntity = {
	mediaSource?: ObjectId;
};

type AggregateReturnType = {
	count: number;

	docs: ObjectId[];
};

export class Migration20250219161047 extends Migration {
	public async up(): Promise<void> {
		const aggregationCursor = this.getCollection<MediaSourceEntity>('media-sources').aggregate([
			{
				$group: {
					_id: { sourceId: '$sourceId' },
					count: { $sum: 1 },
					docs: { $push: '$_id' },
				},
			},
			{
				$match: {
					count: { $gt: 1 },
				},
			},
		]);

		const documents: AggregateReturnType[] = (await aggregationCursor.toArray()) as AggregateReturnType[];

		console.info('Duplicate media sources found: ', documents.length);

		for await (const document of documents) {
			const [keep, ...remove] = document.docs;

			console.info(`Processing media source ${keep.toHexString()} - removing: ${remove.toString()}`);

			const userLicenses = await this.getCollection<MediaEntity>('user-licenses').updateMany(
				{
					mediaSource: { $in: remove },
				},
				{
					$set: {
						mediaSource: keep,
					},
				}
			);

			console.info('Updated user licenses: ', userLicenses.modifiedCount);

			const schoolLicenses = await this.getCollection<MediaEntity>('school-licenses').updateMany(
				{
					mediaSource: { $in: remove },
				},
				{
					$set: {
						mediaSource: keep,
					},
				}
			);

			console.info('Updated school licenses: ', schoolLicenses.modifiedCount);

			await this.getCollection<MediaSourceEntity>('media-sources').deleteMany({ _id: { $in: remove } });

			console.info('Deleted media sources: ', remove.length);
		}

		console.info('Dropping existing non-unique index for media sources');

		await this.getCollection<MediaSourceEntity>('media-sources').dropIndex('sourceId_1');

		console.info('Creating unique index for media sources');

		await this.getCollection<MediaSourceEntity>('media-sources').createIndex(
			{
				sourceId: 1,
			},
			{
				unique: true,
			}
		);

		console.info('Unique index for media sources created');
	}

	// eslint-disable-next-line require-await,@typescript-eslint/require-await
	public async down(): Promise<void> {
		console.error('Migration down not implemented. You might need to restore database from backup!');
	}
}
