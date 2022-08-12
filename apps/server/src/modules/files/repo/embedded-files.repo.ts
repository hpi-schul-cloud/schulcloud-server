/* istanbul ignore file */
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { File, FileRecordParentType, Lesson, Task } from '@shared/domain';
import { SyncFileItemMapper } from '../mapper';
import { SyncFileItem } from '../types';

export const fileUrlRegex = '"(https?://[^"]*)?/files/file\\?file=';
const tasksQuery = {
	description: new RegExp(`src=${fileUrlRegex}`, 'i'),
};

const lessonsQuery = {
	contents: {
		component: {
			$eq: 'text',
		},
		text: {
			$regex: new RegExp(`src=${fileUrlRegex}`, 'i'),
		},
	},
};
const filesQuery = (fileIds: ObjectId[], parentId: ObjectId) => [
	{
		$match: {
			_id: { $in: fileIds },
			storageProviderId: { $exists: true },
			size: { $ne: 0 },
			deleted: { $ne: true },
			deletedAt: null,
		},
	},
	{
		$lookup: {
			from: 'files_filerecords',
			localField: '_id',
			foreignField: 'fileId',
			as: 'file_filerecords',
		},
	},
	{
		$set: {
			file_filerecords: {
				$filter: {
					input: '$file_filerecords',
					as: 'file_filerecords',
					cond: { $eq: ['$$file_filerecords.error', null] },
				},
			},
		},
	},
	{
		$lookup: {
			from: 'filerecords',
			localField: 'file_filerecords.filerecordId',
			foreignField: '_id',
			as: 'filerecords_match',
		},
	},
	{
		$set: {
			filerecord: {
				$filter: {
					input: '$filerecords_match',
					as: 'filerecords_match',
					cond: { $eq: ['$$filerecords_match.parent', parentId] },
				},
			},
		},
	},
	{
		$set: {
			filerecord: { $arrayElemAt: ['$filerecord', 0] },
		},
	},
	{
		$lookup: {
			from: 'users',
			localField: 'creator',
			foreignField: '_id',
			as: 'creator1',
		},
	},
	{ $unwind: '$creator1' },
	{
		$project: {
			schoolId: '$creator1.schoolId',
			file: '$$ROOT',
			filerecord: '$filerecord',
			_id: parentId,
		},
	},
	{
		$sort: {
			'file.updatedAt': 1,
			'file._id': 1,
		},
	},
];

@Injectable()
export class EmbeddedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findEmbeddedFilesForTasks(): Promise<Task[]> {
		const results = await this._em.find(Task, tasksQuery);
		return results;
	}

	async findEmbeddedFilesForLessons(): Promise<Lesson[]> {
		const results = await this._em.find(Lesson, lessonsQuery);
		return results;
	}

	async findFiles(fileIds: ObjectId[], parentId: ObjectId, parentType: FileRecordParentType): Promise<SyncFileItem[]> {
		const query = filesQuery(fileIds, parentId);
		const result = await this._em.aggregate(File, query);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const items = SyncFileItemMapper.mapResults(result, parentType);

		return items;
	}

	async findLesson(_id: ObjectId) {
		const result = await this._em.findOne(Lesson, { _id });

		return result;
	}

	async updateLesson(lesson: Lesson) {
		await this._em.persistAndFlush(lesson);
	}

	async createLessonBackUpCollection() {
		const date = new Date();

		await this._em.aggregate(Lesson, [{ $match: {} }, { $out: `lessons_backup_${date.getTime()}` }]);
	}

	async findTask(_id: ObjectId) {
		const result = await this._em.findOne(Task, { _id });

		return result;
	}

	async updateTask(task: Task) {
		await this._em.persistAndFlush(task);
	}

	async createTaskBackUpCollection() {
		const date = new Date();

		await this._em.aggregate(Task, [{ $match: {} }, { $out: `homeworks_backup_${date.getTime()}` }]);
	}
}
