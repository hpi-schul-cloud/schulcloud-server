import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Lesson, FileRecordParentType, File } from '@shared/domain';
import { SyncFileItemMapper } from '../mapper';
import { ExtendedLessonMapper } from '../mapper/extended-lesson-mapper';
import { SyncFileItem, ExtendedLesson } from '../types';

const lessonsQuery = [
	{
		$unwind: '$contents',
	},
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
				$regex: /src="(https?:\/\/[^"]*)?\/files\/file\?/,
				$options: 'i',
			},
		},
	},
	{
		$set: {
			course: { $arrayElemAt: ['$courses', 0] },
		},
	},
	{
		$set: {
			schoolId: '$course.schoolId',
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
	// {
	// 	$unwind: {
	// 		path: '$files',
	// 	},
	// },
	{
		$lookup: {
			from: 'files_filerecords',
			localField: '_id',
			foreignField: 'fileId',
			as: 'file_filerecords',
		},
	},
	{
		$unwind: {
			path: '$file_filerecords',
			preserveNullAndEmptyArrays: true,
		},
	},
	{
		$match: {
			'file_filerecords.error': null,
		},
	},
	{
		$lookup: {
			from: 'filerecords',
			localField: 'file_filerecords.filerecordId',
			foreignField: '_id',
			as: 'filerecord',
		},
	},
	{
		$set: {
			filerecord: { $arrayElemAt: ['$filerecords', 0] },
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

	async findEmbeddedFilesForLessons(): Promise<ExtendedLesson[]> {
		const results = await this._em.aggregate(Lesson, lessonsQuery);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const extendedLessons = results.map((result) => ExtendedLessonMapper.mapToExtendedLesson(result));

		return extendedLessons;
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
}
