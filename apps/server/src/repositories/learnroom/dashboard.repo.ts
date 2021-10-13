import { Injectable } from '@nestjs/common';
import { EntityId, DashboardEntity, DefaultGridReference, GridElement, GridElementWithPosition } from '@shared/domain';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { DashboardModelEntity } from './dashboard.model.entity';
import { DashboardModelMapper } from './dashboard.model.mapper';

export interface IDashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity>;
	getDashboardById(id: EntityId): Promise<DashboardEntity>;
	persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	constructor(protected readonly em: EntityManager) {}

	// ToDo: refactor this to be in an abstract class (see baseRepo)
	async persist(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await DashboardModelMapper.mapToModel(entity, this.em);
		this.em.persist(modelEntity);
		return entity;
	}

	async persistAndFlush(entity: DashboardEntity): Promise<DashboardEntity> {
		const modelEntity = await DashboardModelMapper.mapToModel(entity, this.em);
		await this.em.persistAndFlush(modelEntity);
		return entity;
	}

	async getDashboardById(id: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOneOrFail(DashboardModelEntity, id);
		const dashboard = await DashboardModelMapper.mapToEntity(dashboardModel);
		return dashboard;
	}

	async getUsersDashboard(): Promise<DashboardEntity> {
		const hardcodedTestDashboardId = '0000d213816abba584714c0a';
		const dashboardModel = await this.em.findOne(DashboardModelEntity, hardcodedTestDashboardId);
		if (dashboardModel) {
			return DashboardModelMapper.mapToEntity(dashboardModel);
		}
		const gridArray: GridElementWithPosition[] = [];
		const diagonalSize = 4;
		for (let i = 0; i < diagonalSize; i += 1) {
			const elementReference = new DefaultGridReference(new ObjectId().toString(), 'exampletitle');
			gridArray.push({
				pos: { x: Math.floor(Math.random() * 4 + 1), y: i + 1 },
				gridElement: new GridElement(new ObjectId().toString(), elementReference),
			});
		}
		const dashboard = new DashboardEntity(hardcodedTestDashboardId, { grid: gridArray });
		await this.persistAndFlush(dashboard);

		return dashboard;
	}
}
