/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-await-in-loop */
import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240315140224 extends Migration {
	private numberOfUpdatedFileRecords = 0;

	async up(): Promise<void> {
		const teacherRole = await this.driver.findOne('roles', { name: 'teacher' });

		const batchSize = 10000;
		let batchCounter = 0;
		let numberOfFoundFileRecordsInBatch = 0;

		do {
			const fileRecords = await this.driver.find(
				'filerecords',
				{ parentType: 'submissions' },
				{ limit: batchSize, offset: batchCounter * batchSize, orderBy: [{ _id: 1 }] }
			);

			numberOfFoundFileRecordsInBatch = fileRecords.length;
			console.log(`${numberOfFoundFileRecordsInBatch} fileRecords found in batch ${batchCounter + 1}`);

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

		if (creator?.roles.includes(teacherRole._id)) {
			const updatedFileRecord = await this.driver.nativeUpdate(
				'filerecords',
				{ _id: fileRecord._id },
				{ $set: { parentType: 'grading' } }
			);

			this.numberOfUpdatedFileRecords += 1;
			console.log(updatedFileRecord);
		}
	}
}
