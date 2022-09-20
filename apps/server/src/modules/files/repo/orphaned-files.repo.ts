/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* istanbul ignore file */
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecord, FileRecordParentType } from '@shared/domain';
import { FileRecordMapper } from '../mapper/filerecord-mapper';

const tasksQuery = [
	{
		$lookup: {
			from: 'homeworks',
			localField: 'parent',
			foreignField: '_id',
			as: 'homeworks',
		},
	},
	{
		$set: {
			homework: { $arrayElemAt: ['$homeworks', 0] },
		},
	},
	{
		$lookup: {
			from: 'files_filerecords',
			localField: '_id',
			foreignField: 'filerecordId',
			as: 'files_filerecords',
		},
	},
	{
		$set: {
			file_filerecord: { $arrayElemAt: ['$files_filerecords', 0] },
		},
	},
	{
		$match: {
			$or: [
				{ homework: null },
				{
					$expr: {
						$not: {
							$in: ['$file_filerecord.fileId', '$homework.fileIds'],
						},
					},
				},
			],
		},
	},
];

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Injectable()
export class OrphanedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findDuplicatedFileRecords(parentType: FileRecordParentType) {
		const fileRecords: FileRecord[] = [];
		const query = [
			{ $group: { _id: '$fileId', count: { $sum: 1 } } },
			{ $match: { _id: { $ne: null }, count: { $gt: 1 } } },
			{ $sort: { count: -1 } },
		];
		//	const connection = this._em.getConnection();
		const result = await this._em.aggregate('files_filerecords', query);

		await Promise.all(
			result.map(async (entity) => {
				const r = await this._em.aggregate('files_filerecords', [{ $match: { fileId: entity._id } }]);
				return Promise.all(
					r.map(async (el: any) => {
						const a = await this._em.aggregate('lessons', [
							{ $match: { 'contents.content.text': RegExp(el.filerecordId) } },
						]);
						if (a.length === 0) {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
							const fileRecord = await this._em.findOne(FileRecord, { _id: el.filerecordId });
							if (fileRecord) {
								fileRecords.push(fileRecord);
							}
						}
					})
				);
			})
		);

		return fileRecords;
	}

	async findOrphanedFileRecords(parentType: FileRecordParentType): Promise<FileRecord[]> {
		let query;

		if (parentType === FileRecordParentType.Task) {
			query = tasksQuery;
		}

		const result = await this._em.aggregate(FileRecord, query);

		const fileRecords = result.map((item) => FileRecordMapper.mapToFileRecord(item));

		return fileRecords;
	}

	async deleteFileRecord(fileRecord: FileRecord) {
		await this._em.nativeDelete(FileRecord, fileRecord._id);
	}

	async deleteFileFileRecord(fileRecord: FileRecord) {
		await this._em.getConnection().deleteMany('files_filerecords', { filerecordId: fileRecord._id });
	}
}
