import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { DashboardGridElementModel } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class DashboardElementRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): typeof DashboardGridElementModel {
		return DashboardGridElementModel;
	}

	public deleteByDashboardId(id: EntityId): Promise<number> {
		const promise = this.em.nativeDelete(DashboardGridElementModel, {
			dashboard: new ObjectId(id),
		});

		return promise;
	}
}
