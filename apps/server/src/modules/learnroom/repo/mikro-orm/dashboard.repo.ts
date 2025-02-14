import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { DashboardEntity, GridElementWithPosition } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { DashboardModelEntity } from './dashboard.model.entity';
import { DashboardModelMapper } from './mapper/dashboard.model.mapper';

const generateEmptyDashboard = (userId: EntityId): DashboardEntity => {
	const gridArray: GridElementWithPosition[] = [];

	const dashboard = new DashboardEntity(new ObjectId().toString(), { grid: gridArray, userId });
	return dashboard;
};

export interface IDashboardRepo {
	getUsersDashboard(userId: EntityId): Promise<DashboardEntity>;
	getUsersDashboardIfExist(userId: EntityId): Promise<DashboardEntity | null>;
	getDashboardById(id: EntityId): Promise<DashboardEntity>;
	persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity>;
	deleteDashboardByUserId(userId: EntityId): Promise<number>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	constructor(protected readonly em: EntityManager, protected readonly mapper: DashboardModelMapper) {}

	// ToDo: refactor this to be in an abstract class (see baseRepo)
	public async persist(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		this.em.persist(modelEntity);
		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	public async persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		await this.em.persistAndFlush(modelEntity);
		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	public async getDashboardById(id: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOneOrFail(DashboardModelEntity, id);
		const dashboard = await this.mapper.mapDashboardToEntity(dashboardModel);
		return dashboard;
	}

	public async getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOne(DashboardModelEntity, { user: userId });
		if (dashboardModel) {
			return this.mapper.mapDashboardToEntity(dashboardModel);
		}

		const dashboard = generateEmptyDashboard(userId);
		await this.persistAndFlush(dashboard);

		return dashboard;
	}

	public async getUsersDashboardIfExist(userId: EntityId): Promise<DashboardEntity | null> {
		const dashboardModel = await this.em.findOne(DashboardModelEntity, { user: userId });
		if (dashboardModel) {
			return this.mapper.mapDashboardToEntity(dashboardModel);
		}

		return dashboardModel;
	}

	public async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		const promise = await this.em.nativeDelete(DashboardModelEntity, { user: userId });

		return promise;
	}
}
