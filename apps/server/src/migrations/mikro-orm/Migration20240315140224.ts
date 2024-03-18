/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-await-in-loop */
import { Migration } from '@mikro-orm/migrations-mongodb';
import { FileRecordParentType } from '@src/modules/files-storage/entity';

export class Migration20240315140224 extends Migration {
	private numberOfUpdatedFileRecords = 0;

	async up(): Promise<void> {
		const batchSize = 10000;
		console.log(
			`Start updating parentType of fileRecords if creator is teacher. Working with batches of ${batchSize}.`
		);

		let batchCounter = 0;
		let numberOfFoundFileRecordsInBatch = 0;

		const teacherRole = await this.driver.findOne('roles', { name: 'teacher' });

		do {
			const fileRecords = await this.driver.find(
				'filerecords',
				{ parentType: FileRecordParentType.Submission },
				{ limit: batchSize, offset: batchCounter * batchSize, orderBy: [{ _id: 1 }] }
			);

			numberOfFoundFileRecordsInBatch = fileRecords.length;
			console.log(
				`${numberOfFoundFileRecordsInBatch} fileRecords with parentType ${
					FileRecordParentType.Submission
				} found in batch ${batchCounter + 1}`
			);

			const promises = fileRecords.map((fileRecord) =>
				this.updateParentTypeIfCreatorIsTeacher(fileRecord, teacherRole)
			);
			await Promise.all(promises);

			batchCounter += 1;
		} while (numberOfFoundFileRecordsInBatch > 0);

		console.log(`Updated ${this.numberOfUpdatedFileRecords} fileRecords in ${batchCounter - 1} batches`);
	}

	private async updateParentTypeIfCreatorIsTeacher(fileRecord, teacherRole): Promise<void> {
		const creator = (await this.driver.findOne('users', { _id: fileRecord.creator })) as any;

		if (!creator) {
			console.log(`Creator not found for fileRecord ${fileRecord._id.toString()}`);
		}

		const isCreatorTeacher = !!creator?.roles.find((role) => role.toString() === teacherRole._id.toString());

		if (isCreatorTeacher) {
			await this.driver.nativeUpdate(
				'filerecords',
				{ _id: fileRecord._id },
				{ $set: { parentType: FileRecordParentType.Grading } }
			);

			this.numberOfUpdatedFileRecords += 1;
		}
	}
}
