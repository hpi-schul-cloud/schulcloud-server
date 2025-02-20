import { EntityManager, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DashboardGridElementEntity } from './dashboard.entity';

@Injectable()
export class DashboardElementRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<DashboardGridElementEntity> {
		return DashboardGridElementEntity;
	}

	public deleteByDashboardId(id: EntityId): Promise<number> {
		const promise = this.em.nativeDelete(DashboardGridElementEntity, {
			dashboard: new ObjectId(id),
		});

		return promise;
	}
}
