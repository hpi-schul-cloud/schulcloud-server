/* istanbul ignore file */
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecord, FileRecordParentType, Task } from '@shared/domain';
import { FileFileRecord } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Injectable()
export class DeleteOrphanedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findTasks(): Promise<Task[]> {
		const entities = await this._em.find(Task, { files: { $ne: null } }, { fields: ['id', 'files'] });

		return entities;
	}

	async findAllFilesFilerecords(): Promise<FileFileRecord[]> {
		const fileFilerecords = await this._em.getConnection().find('files_filerecords', {});

		return fileFilerecords as FileFileRecord[];
	}

	async findFilerecords(parentType: FileRecordParentType): Promise<FileRecord[]> {
		const fileRecords = await this._em.find(
			FileRecord,
			{
				parentType,
			},
			{ fields: ['id', '_parentId', '_schoolId'] }
		);

		return fileRecords;
	}

	async deleteFileFileRecords(fileRecords: FileRecord[]) {
		const fileRecordIds = fileRecords.map((fileRecord) => fileRecord._id);
		await this._em.getConnection().deleteMany('files_filerecords', { filerecordId: { $in: fileRecordIds } });
	}
}
