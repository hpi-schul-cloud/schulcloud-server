/* istanbul ignore file */
import { FilterQuery } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted, File, FileRecordParentType, Lesson, Task } from '@shared/domain';
import { SyncFileItemMapper } from '../mapper';
import { AvailableSyncEntityType, AvailableSyncParentType, SyncFileItem } from '../types';

export const fileUrlRegex = '"(https?://[^"]*)?/files/file\\?file=';
export const fileIdRegex = '(0x|0h)?[0-9A-F]{24}';
const tasksQuery = (excludeIds: ObjectId[]) => {
	return {
		_id: { $nin: excludeIds },
		description: new RegExp(`src=${fileUrlRegex}${fileIdRegex}`, 'i'),
	};
};

const lessonsQuery = (excludeIds: ObjectId[]) => {
	return {
		_id: { $nin: excludeIds },
		courseId: { $exists: true },
		'contents.component': { $eq: 'text' },
		'contents.content.text': { $regex: new RegExp(`src=${fileUrlRegex}${fileIdRegex}`, 'i') },
	} as FilterQuery<Lesson>;
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

	async findElementsToSyncFiles(
		type: AvailableSyncParentType,
		limit: number,
		excludeIds: ObjectId[]
	): Promise<Counted<Task[] | Lesson[]>> {
		let results: Counted<Task[] | Lesson[]> = [[], 0];

		if (type === FileRecordParentType.Task) {
			results = await this._em.findAndCount(Task, tasksQuery(excludeIds), { limit });
		} else if (type === FileRecordParentType.Lesson) {
			results = await this._em.findAndCount(Lesson, lessonsQuery(excludeIds), { limit });
		}
		return results;
	}

	async findFiles(fileIds: ObjectId[], parentId: ObjectId, parentType: FileRecordParentType): Promise<SyncFileItem[]> {
		const query = filesQuery(fileIds, parentId);
		const result = await this._em.aggregate(File, query);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const items = SyncFileItemMapper.mapResults(result, parentType);

		return items;
	}

	async updateEntity(entity: AvailableSyncEntityType) {
		await this._em.persistAndFlush(entity);
	}

	async createBackUpCollection(type: AvailableSyncParentType) {
		const date = new Date();

		if (type === FileRecordParentType.Task) {
			await this._em.aggregate(Task, [{ $match: {} }, { $out: `homeworks_backup_${date.getTime()}` }]);
		} else if (type === FileRecordParentType.Lesson) {
			await this._em.aggregate(Lesson, [{ $match: {} }, { $out: `lessons_backup_${date.getTime()}` }]);
		}
	}
}
