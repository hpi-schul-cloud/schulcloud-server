import { Injectable } from '@nestjs/common';
import { User, EntityId, PermissionCrud } from '@shared/domain';
import { UserRepo, PermissionContextRepo } from '@shared/repo';

@Injectable()
export class PermissionContextService {
	constructor(private readonly userRepo: UserRepo, private readonly permissionContextRepo: PermissionContextRepo) {}

	public async resolvePermissions(userId: User['id'], contextReference: EntityId): Promise<PermissionCrud[]> {
		// NOTE: the contextReference is the _id to a collection that needs authorization
		const permissionCtxEntity = await this.permissionContextRepo.findByContextReference(contextReference);
		const permissions = await permissionCtxEntity.resolvedPermissions(userId);

		return permissions;
	}
}
