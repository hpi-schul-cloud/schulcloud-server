import { Logger } from '@core/logger';
import {
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
	AuthorizationContextParams,
	AuthorizationContextParamsRequiredPermissions,
} from '@infra/authorization-client';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { StorageLocationParamsDto } from '../controller/dto';
import { StorageLocation } from '../interface';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service';

@Injectable()
export class FilesStorageAdminUC {
	constructor(
		private readonly filesStorageAdminService: FilesStorageService,
		private readonly logger: Logger,
		private readonly authorizationClientAdapter: AuthorizationClientAdapter
	) {
		this.logger.setContext(FilesStorageAdminUC.name);
	}

	public async deleteByStorageLocation(params: StorageLocationParamsDto): Promise<number> {
		const context = AuthorizationContextBuilder.write([
			AuthorizationContextParamsRequiredPermissions.INSTANCE_VIEW,
			AuthorizationContextParamsRequiredPermissions.FILESTORAGE_REMOVE,
		]);

		await this.checkPermission(params.storageLocation, params.storageLocationId, context);
		const result = await this.filesStorageAdminService.markForDeleteByStorageLocation(params);

		return result;
	}

	private async checkPermission(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		context: AuthorizationContextParams
	): Promise<void> {
		const referenceType = FilesStorageMapper.mapToAllowedStorageLocationType(storageLocation);

		await this.authorizationClientAdapter.checkPermissionsByReference(referenceType, storageLocationId, context);
	}
}
