import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Action, AuthorizationService } from '@src/modules';
import { HttpService } from '@nestjs/axios';
import { FilesStorageService } from '@src/modules/files-storage/service/files-storage.service';
import { PreviewService } from '@src/modules/files-storage/service/preview.service';
import { EntityId } from '@shared/domain';

@Injectable()
export class TldrawUC {
	// constructor(private logger: LegacyLogger) {
	// 	this.logger.setContext(TldrawUC.name);
	// }
	//
	// async delete(userId: EntityId, elementId: EntityId): Promise<void> {
	// 	this.logger.debug({ action: 'deleteElement', userId, elementId });
	//
	// 	const element = await this.elementService.findById(elementId);
	// 	await this.checkPermission(userId, element, Action.write);
	//
	// 	await this.elementService.delete(element);
	// }
}
