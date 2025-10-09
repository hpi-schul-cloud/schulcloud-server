import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type SchoolExternalToolEntity = {
	_id: ObjectId;
	tool: ObjectId;
	school: ObjectId;
};

type ContextExternalToolEntity = {
	schoolTool: ObjectId;
};

type AggregateReturnType = {
	count: number;

	docs: ObjectId[];
};

export class Migration20250220084015 extends Migration {
	public async up(): Promise<void> {
		const aggregationCursor = this.getCollection<SchoolExternalToolEntity>('school-external-tools').aggregate([
			{
				$group: {
					_id: { tool: '$tool', school: '$school' },
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

		console.info('Duplicate school external tools found: ', documents.length);

		for await (const document of documents) {
			const [keep, ...remove] = document.docs;

			console.info(`Processing school external tool ${keep.toHexString()} - removing: ${remove.toString()}`);

			const contextExternalTool = await this.getCollection<ContextExternalToolEntity>(
				'context-external-tools'
			).updateMany(
				{
					schoolTool: { $in: remove },
				},
				{
					$set: {
						schoolTool: keep,
					},
				}
			);

			console.info('Updated context external tools: ', contextExternalTool.modifiedCount);

			await this.getCollection<SchoolExternalToolEntity>('school-external-tools').deleteMany({ _id: { $in: remove } });

			console.info('Deleted school external tools: ', remove.length);
		}

		console.info('Creating unique index for school external tools');

		await this.getCollection<SchoolExternalToolEntity>('school-external-tools').createIndex(
			{
				tool: 1,
				school: 1,
			},
			{
				unique: true,
			}
		);

		console.info('Unique index for school external tools created');
	}

	// eslint-disable-next-line require-await,@typescript-eslint/require-await
	public async down(): Promise<void> {
		console.error('Migration down not implemented. You might need to restore database from backup!');
	}
}
