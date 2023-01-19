/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FileRecord, FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { FileRecordMapper } from '../mapper/filerecord-mapper';

const orphanedFilesQuery = (collectionName: string) => [
	{ $lookup: { from: collectionName, localField: 'fileId', foreignField: 'fileIds', as: 'entity' } },
	{ $unwind: { path: '$entity', preserveNullAndEmptyArrays: true } },
	{ $lookup: { from: 'filerecords', localField: 'filerecordId', foreignField: '_id', as: 'filerecord' } },
	{ $unwind: { path: '$filerecord' } },
	{ $match: { entity: { $exists: false } } },
];

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Injectable()
export class OrphanedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findDuplicatedFileRecords(parentType: FileRecordParentType) {
		const fileRecords: FileRecord[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let results: any[] = [];
		if (parentType === FileRecordParentType.Lesson) {
			const query = [
				{
					$group: {
						_id: '$fileId',
						filerecordIds: { $push: '$filerecordId' },
					},
				},
				{
					$project: { numberOfFilerecordIds: { $size: '$filerecordIds' }, filerecordIds: '$filerecordIds' },
				},
				{ $match: { numberOfFilerecordIds: { $gt: 1 } } },
				{
					$lookup: {
						from: 'filerecords',
						localField: 'filerecordIds',
						foreignField: '_id',
						as: 'fileRecords',
					},
				},
			];

			results = await this._em.aggregate('files_filerecords', query);
		} else {
			throw new Error('wrong parent type');
		}

		results.forEach((entity) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			entity.fileRecords.forEach((fileRecord) => {
				fileRecords.push(FileRecordMapper.mapToFileRecord(fileRecord));
			});
		});

		return fileRecords;
	}

	async findLessonsByFileRecordId(fileRecordId: EntityId) {
		const a = await this._em.aggregate('lessons', [{ $match: { 'contents.content.text': RegExp(fileRecordId) } }]);
		return a.length !== 0;
	}

	async findOrphanedFileRecords(parentType: FileRecordParentType): Promise<FileRecord[]> {
		let query;

		if (parentType === FileRecordParentType.Task) {
			query = orphanedFilesQuery('homeworks');
		}

		if (parentType === FileRecordParentType.Submission) {
			query = orphanedFilesQuery('submissions');
		}

		const result = await this._em.aggregate('files_filerecords', query);

		const fileRecords = result.map((item) => FileRecordMapper.mapToFileRecord(item.filerecord));

		return fileRecords;
	}

	async deleteFileRecord(fileRecord: FileRecord) {
		await this._em.nativeDelete(FileRecord, fileRecord._id);
	}

	async deleteFileFileRecord(fileRecord: FileRecord) {
		await this._em.getConnection().deleteMany('files_filerecords', { filerecordId: fileRecord._id });
	}
}
