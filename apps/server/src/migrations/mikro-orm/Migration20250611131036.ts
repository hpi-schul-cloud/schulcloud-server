import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectID } from 'bson';
type SchoolYear = {
	_id: ObjectID;
	name: string;
	startDate: Date;
	endDate: Date;
	courseCreationInNextYear: boolean;
};
export class Migration20250611131036 extends Migration {
	public async up(): Promise<void> {
		const years = await this.getCollection<SchoolYear>('years').updateMany(
			{},
			{
				$set: {
					courseCreationInNextYear: false,
				},
			}
		);

		console.info("Added property 'courseCreationInNextYear' in 'years': ", years.modifiedCount);
	}

	public async down(): Promise<void> {
		const years = await this.getCollection<SchoolYear>('years').updateMany(
			{},
			{
				$unset: {
					courseCreationInNextYear: true,
				},
			}
		);

		console.info("Removed property 'courseCreationInNextYear' in 'years': ", years.modifiedCount);
	}
}
