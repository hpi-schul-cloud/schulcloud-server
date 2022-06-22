/* istanbul ignore file */

import { Connection, EntityName } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecordParentType, Task } from '@shared/domain';
import { FileFilerecord } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Injectable()
export class DeleteOrphanedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findTasks(): Promise<Task[]> {
		const entities = await this._em.find(Task, { files: { $ne: null } }, { fields: ['id', 'files'] });

		return entities;
	}

	async findAllFilesFilerecords(): Promise<FileFilerecord[]> {
		const fileFilerecords = await this._em.getConnection().find('files_filerecords', {});

		return fileFilerecords as FileFilerecord[];
	}
}
