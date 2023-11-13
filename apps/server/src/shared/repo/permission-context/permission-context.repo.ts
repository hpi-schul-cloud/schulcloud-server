import { ObjectId } from 'bson';
import { Injectable } from '@nestjs/common';
import { PermissionContextEntity } from '@shared/domain';
import { BaseRepo } from '../base.repo';

// TODO: add test
@Injectable()
export class PermissionContextRepo extends BaseRepo<PermissionContextEntity> {
	get entityName() {
		return PermissionContextEntity;
	}

	findByContextReference(contextReference: ObjectId): Promise<PermissionContextEntity[]> {
		return this._em.find(PermissionContextEntity, { contextReference });
	}
}
