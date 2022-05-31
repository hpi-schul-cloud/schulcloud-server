import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain';
import { BaseRepo } from '@shared/repo';
import { FileFilerecord } from './file_filerecord.entity';

// This repo is used for syncing the new filerecords collection with the old files collection.
// It can be removed after transitioning file-handling to the new files-storage-microservice is completed.
@Injectable()
export class SyncTaskRepo extends BaseRepo<FileFilerecord> {
	get entityName() {
		return FileFilerecord;
	}

	async getTasksToSync(batchSize = 50) {
		const tasksToSync = await this._em.aggregate(Task, [
			{
				$match: { fileIds: { $exists: true, $ne: [] } },
			},
			{
				$lookup: {
					from: 'files',
					localField: 'fileIds',
					foreignField: '_id',
					as: 'files',
				},
			},
			{
				$unwind: {
					path: '$files',
				},
			},
			{
				$lookup: {
					from: 'files_filerecords',
					localField: 'files._id',
					foreignField: 'fileId',
					as: 'file_filerecords',
				},
			},
			{
				$lookup: {
					from: 'filerecords',
					localField: 'file_filerecords.filerecordId',
					foreignField: '_id',
					as: 'filerecords',
				},
			},
			{
				$set: {
					filerecord: { $arrayElemAt: ['$filerecords', 0] },
				},
			},
			{
				$match: {
					$or: [
						{ filerecord: { $exists: false } },
						{
							$expr: {
								$gt: ['$files.updatedAt', '$filerecord.updatedAt'],
							},
						},
					],
				},
			},
			{
				$project: {
					schoolId: '$schoolId',
					file: '$files',
					filerecord: '$filerecord',
				},
			},
			{
				$sort: {
					'file.updatedAt': 1,
					'file._id': 1,
				},
			},
			{
				$limit: batchSize,
			},
		]);

		return tasksToSync;
	}
}
