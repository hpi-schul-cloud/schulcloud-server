import { Injectable } from '@nestjs/common';

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { DashboardEntity, GridElementWithPosition } from '@shared/domain/entity/dashboard.entity';
import { DashboardModelEntity } from '@shared/domain/entity/dashboard.model.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { DashboardModelMapper } from './dashboard.model.mapper';

const generateEmptyDashboard = (userId: EntityId) => {
	const gridArray: GridElementWithPosition[] = [];

	const dashboard = new DashboardEntity(new ObjectId().toString(), { grid: gridArray, userId });
	return dashboard;
};

export interface IDashboardRepo {
	getUsersDashboard(userId: EntityId): Promise<DashboardEntity>;
	getDashboardById(id: EntityId): Promise<DashboardEntity>;
	persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	constructor(protected readonly em: EntityManager, protected readonly mapper: DashboardModelMapper) {}

	// ToDo: refactor this to be in an abstract class (see baseRepo)
	async persist(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		this.em.persist(modelEntity);
		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	async persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		await this.em.persistAndFlush(modelEntity);
		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	async getDashboardById(id: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOneOrFail(DashboardModelEntity, id);
		const dashboard = await this.mapper.mapDashboardToEntity(dashboardModel);
		return dashboard;
	}

	async getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOne(DashboardModelEntity, { user: userId });
		if (dashboardModel) {
			return this.mapper.mapDashboardToEntity(dashboardModel);
		}

		const dashboard = generateEmptyDashboard(userId);
		await this.persistAndFlush(dashboard);

		return dashboard;
	}
}
