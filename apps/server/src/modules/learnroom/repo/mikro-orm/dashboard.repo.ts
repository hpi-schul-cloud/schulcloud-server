import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Dashboard, GridElementWithPosition } from '../../domain/do/dashboard';
import { DashboardEntity } from './dashboard.entity';
import { DashboardModelMapper } from './mapper/dashboard.entity.mapper';

export const DASHBOARD_REPO = 'DASHBOARD_REPO';

const generateEmptyDashboard = (userId: EntityId): Dashboard => {
	const gridArray: GridElementWithPosition[] = [];

	const dashboard = new Dashboard(new ObjectId().toString(), { grid: gridArray, userId });
	return dashboard;
};

export interface IDashboardRepo {
	getUsersDashboard(userId: EntityId): Promise<Dashboard>;
	getUsersDashboardIfExist(userId: EntityId): Promise<Dashboard | null>;
	getDashboardById(id: EntityId): Promise<Dashboard>;
	persistAndFlush(entity: Dashboard): Promise<Dashboard>;
	deleteDashboardByUserId(userId: EntityId): Promise<number>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	constructor(protected readonly em: EntityManager, protected readonly mapper: DashboardModelMapper) {}

	// ToDo: refactor this to be in an abstract class (see baseRepo)
	public async persist(entity: Dashboard): Promise<Dashboard> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		this.em.persist(modelEntity);

		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	public async persistAndFlush(entity: Dashboard): Promise<Dashboard> {
		const modelEntity = await this.mapper.mapDashboardToModel(entity);
		await this.em.persistAndFlush(modelEntity);

		return this.mapper.mapDashboardToEntity(modelEntity);
	}

	public async getDashboardById(id: EntityId): Promise<Dashboard> {
		const dashboardModel = await this.em.findOneOrFail(DashboardEntity, id);
		const dashboard = await this.mapper.mapDashboardToEntity(dashboardModel);

		return dashboard;
	}

	public async getUsersDashboard(userId: EntityId): Promise<Dashboard> {
		const dashboardModel = await this.em.findOne(DashboardEntity, { user: userId });
		if (dashboardModel) {
			return this.mapper.mapDashboardToEntity(dashboardModel);
		}

		const dashboard = generateEmptyDashboard(userId);
		await this.persistAndFlush(dashboard);

		return dashboard;
	}

	public async getUsersDashboardIfExist(userId: EntityId): Promise<Dashboard | null> {
		const dashboardModel = await this.em.findOne(DashboardEntity, { user: userId });
		if (dashboardModel) {
			return this.mapper.mapDashboardToEntity(dashboardModel);
		}

		return dashboardModel;
	}

	public async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		const promise = await this.em.nativeDelete(DashboardEntity, { user: userId });

		return promise;
	}
}
