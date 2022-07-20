/* istanbul ignore file */
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Lesson, FileRecordParentType, File } from '@shared/domain';
import { SyncFileItemMapper } from '../mapper';
import { LessonMapper } from '../mapper/lesson-mapper';
import { SyncFileItem } from '../types';

export const fileUrlRegex = '"(https?://[^"]*)?/files/file\\?file=';
const lessonsQuery = [
	{
		$match: {
			'contents.component': {
				$eq: 'text',
			},
		},
	},
	{
		$match: {
			'contents.content.text': {
				$regex: new RegExp(`src=${fileUrlRegex}`),
				$options: 'i',
			},
		},
	},
];

const filesQuery = (fileIds: ObjectId[], lessonId: ObjectId) => [
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
					cond: { $eq: ['$$filerecords_match.parent', lessonId] },
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
			_id: lessonId,
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

	async findEmbeddedFilesForLessons(): Promise<Lesson[]> {
		const results = await this._em.aggregate(Lesson, lessonsQuery);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const lessons = results.map((result) => LessonMapper.mapToLesson(result));

		return lessons;
	}

	async findFiles(fileIds: ObjectId[], lessonId: ObjectId): Promise<SyncFileItem[]> {
		const query = filesQuery(fileIds, lessonId);
		const result = await this._em.aggregate(File, query);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const items = SyncFileItemMapper.mapResults(result, FileRecordParentType.Lesson);

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
		const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

		await this._em.aggregate(Lesson, [{ $match: {} }, { $out: `lessons_backup_${date}` }]);
	}
}
