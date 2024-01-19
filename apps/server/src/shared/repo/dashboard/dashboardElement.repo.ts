import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { DashboardGridElementModel } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';

@Injectable()
export class DashboardElementRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return DashboardGridElementModel;
	}

	async deleteByDashboardId(id: EntityId): Promise<number> {
		const promise = this.em.nativeDelete(DashboardGridElementModel, {
			dashboard: new ObjectId(id),
		});

		return promise;
	}
}
