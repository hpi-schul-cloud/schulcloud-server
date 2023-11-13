import { Injectable } from '@nestjs/common';
import { User, Permission } from '@shared/domain';
import { UserRepo, PermissionContextRepo } from '@shared/repo';
import { ObjectId } from 'bson';

@Injectable()
export class PermissionContextService {
	constructor(private readonly userRepo: UserRepo, private readonly permissionContextRepo: PermissionContextRepo) {}

	public async resolvePermissions(user: User, contextReference: ObjectId): Promise<Permission[]> {
		// NOTE: the contextReference is the _id to a collection that needs authorization
		const permissionCtxEntities = await this.permissionContextRepo.findByContextReference(contextReference);

		const permissions = permissionCtxEntities.resolvedPermissions(user);

		return permissions;
	}
}
