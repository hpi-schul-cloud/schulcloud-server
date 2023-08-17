import { FilePermissionEntity } from '@shared/domain';

import { FilePermission } from '../../domain';

export class FilePermissionMapper {
	private static mapToDO(entity: FilePermissionEntity): FilePermission {
		return new FilePermission({
			referenceId: entity.refId.toHexString(),
			referenceModel: entity.refPermModel,
			readPermission: entity.read,
			writePermission: entity.write,
			createPermission: entity.create,
			deletePermission: entity.delete,
		});
	}

	static mapToDOs(entities: FilePermissionEntity[]): FilePermission[] {
		return entities.map((entity) => this.mapToDO(entity));
	}
}
