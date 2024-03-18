/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Migration } from '@mikro-orm/migrations-mongodb';
import { RoleName } from '@shared/domain/interface';
import { FileRecordParentType } from '@src/modules/files-storage/entity';

export class Migration20240315140224 extends Migration {
	async up(): Promise<void> {
		console.log('Start updating parentType of fileRecords if creator is teacher.');

		const teacherRole = (await this.driver.findOne('roles', { name: RoleName.TEACHER })) as any;
		const teachers = await this.driver.aggregate('users', [
			{ $match: { roles: teacherRole._id } },
			{ $project: { _id: 1 } },
		]);
		const teacherIds = teachers.map((teacher: any) => teacher._id);

		console.log(`Found ${teacherIds.length} teachers.`);

		const result = await this.driver.nativeUpdate(
			'filerecords',
			{ parentType: FileRecordParentType.Submission, creator: { $in: teacherIds } },
			{ $set: { parentType: FileRecordParentType.Grading } }
		);

		console.log(`Updated ${result.affectedRows} filerecords.`);
	}
}
