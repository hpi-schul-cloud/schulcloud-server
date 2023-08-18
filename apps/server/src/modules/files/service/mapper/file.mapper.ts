import { EntityId } from '@shared/domain';

import { File } from '../../domain';
import { FileEntity } from '../../entity';
import { FileSecurityCheckMapper } from './file-security-check.mapper';
import { FilePermissionMapper } from './file-permission.mapper';

export class FileMapper {
	private static mapToDO(entity: FileEntity): File {
		let storageProviderId: EntityId | undefined;

		if (entity.storageProvider !== undefined) {
			storageProviderId = entity.storageProvider.id;
		}

		return new File({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			deleted: entity.deleted,
			isDirectory: entity.isDirectory,
			name: entity.name,
			size: entity.size,
			type: entity.type,
			storageFileName: entity.storageFileName,
			bucket: entity.bucket,
			storageProviderId,
			thumbnail: entity.thumbnail,
			thumbnailRequestToken: entity.thumbnailRequestToken,
			securityCheck: FileSecurityCheckMapper.mapToDO(entity.securityCheck),
			shareTokens: entity.shareTokens,
			parentId: entity.parentId,
			ownerId: entity.ownerId,
			ownerModel: entity.refOwnerModel,
			creatorId: entity.creatorId,
			permissions: FilePermissionMapper.mapToDOs(entity.permissions),
			lockId: entity.lockId,
		});
	}

	static mapToDOs(entities: FileEntity[]): File[] {
		return entities.map((entity) => this.mapToDO(entity));
	}
}
