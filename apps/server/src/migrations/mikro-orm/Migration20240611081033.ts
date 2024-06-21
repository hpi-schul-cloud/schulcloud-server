import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type MediaSourceEntityProps = {
	name?: string;

	sourceId: string;
};

export class Migration20240611081033 extends Migration {
	async up(): Promise<void> {
		const uniqueSourceIds: unknown[] = await this.getCollection('user-licenses').distinct('mediaSourceId');

		const validSourceIds: string[] = uniqueSourceIds.filter(
			(sourceId): sourceId is string => !!sourceId && typeof sourceId === 'string'
		);

		if (!validSourceIds.length) {
			console.info(`no media sources for migration found`);
			return;
		}

		const sourceObjects: MediaSourceEntityProps[] = validSourceIds.map((sourceId: string): MediaSourceEntityProps => {
			return {
				sourceId,
			};
		});

		const mediaSourcesInsertResult = await this.driver.nativeInsertMany('media-sources', sourceObjects);

		console.info(`${mediaSourcesInsertResult.affectedRows} media sources were added`);

		const mediaSources = await this.driver.find<{ _id: ObjectId } & MediaSourceEntityProps>('media-sources', {});

		let total = 0;
		for await (const mediaSource of mediaSources) {
			const userLicenses = await this.driver.nativeUpdate(
				'user-licenses',
				{
					mediaSourceId: mediaSource.sourceId,
				},
				{
					mediaSourceId: mediaSource._id,
				}
			);

			total += userLicenses.affectedRows;
			console.info(
				`${userLicenses.affectedRows} user-licenses are now referenced to ${mediaSource.sourceId ?? 'unknown'}`
			);
		}
		console.info(`${total} user-licenses are now referenced to media-sources`);

		const userLicensesNameChange = await this.driver.nativeUpdate(
			'user-licenses',
			{
				mediaSourceId: { $exists: true },
			},
			{
				$rename: { mediaSourceId: 'mediaSource' },
			}
		);
		console.info(`mediaSourceId was renamed to mediaSource in ${userLicensesNameChange.affectedRows} user licenses`);
	}

	async down(): Promise<void> {
		await this.driver.aggregate('user-licenses', [
			{ $match: { mediaSource: { $ne: null } } },
			{ $lookup: { from: 'media-sources', localField: 'mediaSource', foreignField: '_id', as: 'mediaSourceId' } }, // Joins media-sources as array in mediaSourceId
			{ $unwind: { path: '$mediaSourceId', preserveNullAndEmptyArrays: true } }, // Transforms mediaSourceId array to individual documents with the object
			{ $set: { mediaSourceId: '$mediaSourceId.sourceId' } }, // Replaces the mediaSourceId object with the contained mediaSourceId
			{ $unset: 'mediaSource' },
			{ $merge: { into: 'user-licenses', on: '_id', whenMatched: 'replace', whenNotMatched: 'fail' } },
		]);

		await this.getCollection('media-sources').drop();
		console.info(`media-sources was dropped`);
	}
}
