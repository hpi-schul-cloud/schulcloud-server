import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';

// todo define response type
@Injectable()
export class FileStorageClientRepo {
	async copyFilesOfParent(userId: EntityId, schoolId: EntityId, parentId: EntityId): Promise<[]> {
		return Promise.resolve([]);
	}

	async listFilesOfParent(userId: EntityId, schoolId: EntityId, parentId: EntityId): Promise<[]> {
		return Promise.resolve([]);
	}
}
