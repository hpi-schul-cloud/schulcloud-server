/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* istanbul ignore file */
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecord } from '@shared/domain';
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
export class DeleteOrphanedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findOrphanedFileRecords(): Promise<FileRecord[]> {
		const result = await this._em.aggregate(FileRecord, tasksQuery);

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
