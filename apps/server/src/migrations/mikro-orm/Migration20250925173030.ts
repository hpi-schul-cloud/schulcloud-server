import { Migration } from '@mikro-orm/migrations-mongodb';
import { AnyBulkWriteOperation, BulkWriteResult } from 'mongodb';
import { ObjectId } from 'bson';

export class Migration20250925173030 extends Migration {
	public async up(): Promise<void> {
		const courseCollection = this.getCollection('courses');
		const classCollection = this.getCollection('classes');
		const userCollection = this.getCollection('users');
		const batchSize = 1000;
		let courseBatch: AnyBulkWriteOperation[] = [];
		let classBatch: AnyBulkWriteOperation[] = [];
		let processedUsers = 0;
		const cursor = userCollection.find({}, { projection: { _id: 1, schoolId: 1 } });

		while (await cursor.hasNext()) {
			const user = await cursor.next();
			if (!user || !user.schoolId) continue;
			const userId = user._id;
			const userSchoolId = user.schoolId as ObjectId;
			const courseOp = this.buildCourseUpdateOp(userId, userSchoolId);
			const classOp = this.buildClassUpdateOp(userId, userSchoolId);
			if (courseOp) courseBatch.push(courseOp);
			if (classOp) classBatch.push(classOp);
			if (courseBatch.length === batchSize || classBatch.length === batchSize) {
				if (courseBatch.length > 0) {
					// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
					const result = (await courseCollection.bulkWrite(courseBatch)) as BulkWriteResult;
					console.log(
						`Processed course batch of ${courseBatch.length} users. Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`
					);
					processedUsers += courseBatch.length;
					courseBatch = [];
				}
				if (classBatch.length > 0) {
					// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
					const result = (await classCollection.bulkWrite(classBatch)) as BulkWriteResult;
					console.log(
						`Processed class batch of ${classBatch.length} users. Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`
					);
					processedUsers += classBatch.length;
					classBatch = [];
				}
				console.log(`Processed ${processedUsers} users so far.`);
			}
		}
		// Flush remaining
		if (courseBatch.length > 0) {
			// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
			const courseResult = (await courseCollection.bulkWrite(courseBatch)) as BulkWriteResult;
			console.log(
				`Processed last course batch of ${courseBatch.length} users. Modified: ${courseResult.modifiedCount}, Matched: ${courseResult.matchedCount}`
			);
			processedUsers += courseBatch.length;
		}
		if (classBatch.length > 0) {
			// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
			const classResult = (await classCollection.bulkWrite(classBatch)) as BulkWriteResult;
			console.log(
				`Processed last class batch of ${classBatch.length} users. Modified: ${classResult.modifiedCount}, Matched: ${classResult.matchedCount}`
			);
			processedUsers += classBatch.length;
		}
		console.log(`Migration complete. Total users processed: ${processedUsers}`);
	}

	private buildCourseUpdateOp(userId: ObjectId, userSchoolId: ObjectId): AnyBulkWriteOperation {
		return {
			updateMany: {
				filter: {
					$and: [
						{ schoolId: { $ne: userSchoolId } },
						{
							$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
						},
					],
				},
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				update: {
					$pull: {
						userIds: userId,
						teacherIds: userId,
						substitutionIds: userId,
					},
				} as any,
				upsert: false,
			},
		};
	}

	private buildClassUpdateOp(userId: ObjectId, userSchoolId: ObjectId): AnyBulkWriteOperation {
		return {
			updateMany: {
				filter: {
					$and: [
						{ schoolId: { $ne: userSchoolId } },
						{
							$or: [{ userIds: userId }, { teacherIds: userId }],
						},
					],
				},
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				update: {
					$pull: {
						userIds: userId,
						teacherIds: userId,
					},
				} as any,
				upsert: false,
			},
		};
	}
}
