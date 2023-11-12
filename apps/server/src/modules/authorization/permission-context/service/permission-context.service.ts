import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { BaseDO, EntityId, User, PermissionContextEntity } from '@shared/domain';
import { UserRepo, PermissionContextRepo } from '@shared/repo';
import { ObjectId } from 'bson';

@Injectable()
export class PermissionContextService {
	constructor(private readonly userRepo: UserRepo, private readonly permissionContextRepo: PermissionContextRepo) {}

	public async resolvePermissions(user: User, contextReference: ObjectId): Promise<string[]> {
		// NOTE: the contextReference is the _id to a collection that needs authorization
		const permissionCtxEntity = await this.permissionContextRepo.findByContextReference(contextReference);
		if (!permissionCtxEntity) throw new NotFoundException();

		throw 'Not implemented';
	}
}
