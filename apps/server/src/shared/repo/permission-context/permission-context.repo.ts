import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, PermissionContextEntity } from '@shared/domain';
import { BaseRepo } from '../base.repo';

// TODO: add test
@Injectable()
export class PermissionContextRepo extends BaseRepo<PermissionContextEntity> {
	get entityName() {
		return PermissionContextEntity;
	}

	findByContextReference(contextReference: EntityId): Promise<PermissionContextEntity> {
		return this._em.findOneOrFail(PermissionContextEntity, { contextReference: new ObjectId(contextReference) });
	}
}
