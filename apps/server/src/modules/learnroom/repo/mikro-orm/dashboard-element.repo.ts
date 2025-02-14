import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { DashboardGridElementModel } from './dashboard.model.entity';

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
