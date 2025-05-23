import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectID } from 'bson';

type SchoolYear = {
	_id: ObjectID;
	name: string;
	startDate: Date;
	endDate: Date;
};
export class Migration20250523101214 extends Migration {
	private schoolYears: SchoolYear[] = [
		{
			_id: new ObjectID('682f14e4e7599e58d4563079'),
			name: '2026/27',
			startDate: new Date('2026-08-01T00:00:00.000+0000'),
			endDate: new Date('2027-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305db893d7c8363e421d3b'),
			name: '2027/28',
			startDate: new Date('2027-08-01T00:00:00.000+0000'),
			endDate: new Date('2028-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305df493d7c8363e421d3c'),
			name: '2028/29',
			startDate: new Date('2028-08-01T00:00:00.000+0000'),
			endDate: new Date('2029-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305e5e93d7c8363e421d3d'),
			name: '2029/30',
			startDate: new Date('2029-08-01T00:00:00.000+0000'),
			endDate: new Date('2030-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305ea093d7c8363e421d3e'),
			name: '2030/31',
			startDate: new Date('2030-08-01T00:00:00.000+0000'),
			endDate: new Date('2031-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305ed293d7c8363e421d3f'),
			name: '2031/32',
			startDate: new Date('2031-08-01T00:00:00.000+0000'),
			endDate: new Date('2032-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305f0d93d7c8363e421d40'),
			name: '2032/33',
			startDate: new Date('2032-08-01T00:00:00.000+0000'),
			endDate: new Date('2033-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('68305f6c93d7c8363e421d41'),
			name: '2033/34',
			startDate: new Date('2033-08-01T00:00:00.000+0000'),
			endDate: new Date('2034-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('6830602893d7c8363e421d42'),
			name: '2034/35',
			startDate: new Date('2034-08-01T00:00:00.000+0000'),
			endDate: new Date('2035-07-31T00:00:00.000+0000'),
		},
		{
			_id: new ObjectID('6830605f93d7c8363e421d43'),
			name: '2035/36',
			startDate: new Date('2035-08-01T00:00:00.000+0000'),
			endDate: new Date('2036-07-31T00:00:00.000+0000'),
		},
	];

	private async addSchoolYear(schoolYear: SchoolYear): Promise<void> {
		await this.getCollection('years').insertOne(schoolYear);

		console.info(`School year ${schoolYear.name} inserted.`);
	}

	private async removeSchoolYear(id: ObjectID, name: string): Promise<void> {
		await this.getCollection('years').deleteOne({ _id: id });

		console.info(`School year ${name} removed.`);
	}

	public async up(): Promise<void> {
		const promises = this.schoolYears.map((year) => {
			return this.addSchoolYear(year);
		});
		await Promise.all(promises);
	}

	public async down(): Promise<void> {
		const promises = this.schoolYears.map((year) => {
			return this.removeSchoolYear(year._id, year.name);
		});
		await Promise.all(promises);
	}
}
