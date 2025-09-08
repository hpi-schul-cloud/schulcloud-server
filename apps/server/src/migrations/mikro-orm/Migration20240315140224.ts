import { Migration } from '@mikro-orm/migrations-mongodb';

enum FileRecordParentType {
	'Submission' = 'submissions',
	'Grading' = 'gradings',
}

enum RoleName {
	TEACHER = 'teacher',
}

export class Migration20240315140224 extends Migration {
	public async up(): Promise<void> {
		console.log('Start updating parentType of fileRecords if creator is teacher.');

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const teacherRole = (await this.driver.findOne('roles', { name: RoleName.TEACHER })) as any;
		const teachers = await this.driver.aggregate('users', [
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			{ $match: { roles: teacherRole._id } },
			{ $project: { _id: 1 } },
		]);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
		const teacherIds = teachers.map((teacher: any) => teacher._id);

		console.log(`Found ${teacherIds.length} teachers.`);

		// Teachers can make submissions themselves and they sometimes misuse that for planning stuff or so.
		// Thus the filter by creator of the filerecord is not enough to identify a grading and we exclude these submissions by teachers below.
		const submissionsByTeachers = await this.driver.aggregate('submissions', [
			{ $match: { studentId: { $in: teacherIds } } },
			{ $project: { _id: 1 } },
		]);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
		const submissionsByTeachersIds = submissionsByTeachers.map((submission: any) => submission._id);

		console.log(
			`Found ${submissionsByTeachersIds.length} submissions by teachers, which will be excluded from update.`
		);

		const result = await this.driver.nativeUpdate(
			'filerecords',
			{
				parentType: FileRecordParentType.Submission,
				creator: { $in: teacherIds },
				parent: { $nin: submissionsByTeachersIds },
			},
			{ $set: { parentType: FileRecordParentType.Grading } }
		);

		console.log(`Updated ${result.affectedRows} filerecords.`);
	}

	public async down(): Promise<void> {
		console.log('Resetting parentType "gradings" of fileRecords to "submissions".');

		const result = await this.driver.nativeUpdate(
			'filerecords',
			{ parentType: FileRecordParentType.Grading },
			{ $set: { parentType: FileRecordParentType.Submission } }
		);

		console.log(`Updated ${result.affectedRows} filerecords.`);
	}
}
