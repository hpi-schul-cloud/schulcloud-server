/* istanbul ignore file */

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, FileRecord, FileRecordParentType, Task } from '@shared/domain';
import { SyncFileItemMapper } from '../mapper';
import { SyncFileItem, SyncFileItemData } from '../types';

const query = (batchSize: number) => [
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
		$match: {
			'files.storageProviderId': { $exists: true },
			'files.size': { $ne: 0 },
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
		$unwind: {
			path: '$file_filerecords',
			preserveNullAndEmptyArrays: true,
		},
	},
	{
		$match: {
			$or: [{ 'file_filerecords.error': { $exists: false } }, { 'file_filerecords.error': { $eq: null } }],
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
];
// This repo is used for syncing the new filerecords collection with the old files collection.
// It can be removed after transitioning file-handling to the new files-storage-microservice is completed.
@Injectable()
export class SyncFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findFilesToSync(parentType: FileRecordParentType, batchSize = 50): Promise<SyncFileItem[]> {
		let itemDataList: SyncFileItemData[] = [];

		if (parentType === FileRecordParentType.Task) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			itemDataList = await this._em.aggregate(Task, query(batchSize));
		}
		const items = this.mapResults(itemDataList, parentType);

		return items;
	}

	private mapResults(itemDataList: SyncFileItemData[], parentType: FileRecordParentType): SyncFileItem[] {
		const items = itemDataList.map((itemData) => SyncFileItemMapper.mapToDomain(itemData, parentType));

		return items;
	}

	async saveAssociation(sourceId: EntityId, targetId?: EntityId, error?: string): Promise<void> {
		const filerecordId = targetId ? new ObjectId(targetId) : undefined;
		await this._em
			.getConnection()
			.insertOne('files_filerecords', { fileId: new ObjectId(sourceId), filerecordId, error });
	}

	async insertFileRecord(entity: FileRecord): Promise<void> {
		await this._em.nativeInsert(entity);
	}

	async updateFileRecord(entity: FileRecord): Promise<void> {
		await this._em.nativeUpdate(FileRecord, { _id: entity._id }, entity);
	}
}
