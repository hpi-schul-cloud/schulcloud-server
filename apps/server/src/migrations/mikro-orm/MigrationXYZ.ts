import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectID } from 'bson';

export class MigrationXYZ extends Migration {
	private schoolYears = [
		{
			id: new ObjectID('PLACEHOLDER_ID_1'),
			name: '2026/27',
			startDate: new Date('2026-08-01T00:00:00.000+0000'),
			endDate: new Date('2027-07-31T00:00:00.000+0000'),
		},
		{
			id: new ObjectID('PLACEHOLDER_ID_2'),
			name: '2027/28',
			startDate: new Date('2027-08-01T00:00:00.000+0000'),
			endDate: new Date('2028-07-31T00:00:00.000+0000'),
		},
		{
			id: new ObjectID('PLACEHOLDER_ID_3'),
			name: '2028/29',
			startDate: new Date('2028-08-01T00:00:00.000+0000'),
			endDate: new Date('2029-07-31T00:00:00.000+0000'),
		},
	];

	private async addSchoolYear(id: ObjectID, name: string, startDate: Date, endDate: Date): Promise<void> {
		await this.getCollection('years').insertOne({
			_id: id,
			name,
			startDate,
			endDate,
		});

		console.info(`School year ${name} inserted.`);
	}

	private async removeSchoolYear(id: ObjectID, name: string): Promise<void> {
		await this.getCollection('years').deleteOne({ _id: id });

		console.info(`School year ${name} removed.`);
	}

	public async up(): Promise<void> {
		this.schoolYears.forEach(async (year) => {
			await this.addSchoolYear(year.id, year.name, year.startDate, year.endDate);
		});
	}

	public async down(): Promise<void> {
		this.schoolYears.forEach(async (year) => {
			await this.removeSchoolYear(year.id, year.name);
		});
	}
}
