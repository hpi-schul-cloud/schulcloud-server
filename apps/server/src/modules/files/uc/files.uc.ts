import { Injectable } from '@nestjs/common';

import { EntityId } from '@shared/domain';

import { FilesService } from '../service/files.service';

@Injectable()
export class FilesUC {
	constructor(private readonly service: FilesService) {}

	async deleteUserData(userId: EntityId): Promise<void> {
		await this.service.removeUserPermissionsToAnyFiles(userId);
		await this.service.markFilesOwnedByUserForDeletion(userId);
	}
}
