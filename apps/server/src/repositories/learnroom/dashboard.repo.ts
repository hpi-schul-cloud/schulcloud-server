import { Injectable } from '@nestjs/common';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { DashboardModelEntity, mapToModel, mapToEntity } from './dashboard.model.entity';
import {
	DashboardEntity,
	DashboardProps,
	DefaultGridReference,
	GridElement,
} from '../../entities/learnroom/dashboard.entity';

export interface IDashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	constructor(protected readonly em: EntityManager) {}

	create(dashboardProps: DashboardProps): DashboardEntity {
		// todo: implementation, testing, etc
		// this should create a modelentity and get an id from mongo
		return new DashboardEntity('thisisalsofake', dashboardProps);
	}

	// ToDo: refactor this to be in an abstract class (see baseRepo)
	persist(entity: DashboardEntity): DashboardEntity {
		const modelEntity = mapToModel(entity);
		this.em.persist(modelEntity);
		return entity;
	}

	async getDashboardById(id: EntityId): Promise<DashboardEntity> {
		const dashboardModel = await this.em.findOneOrFail(DashboardModelEntity, id);
		const dashboard = mapToEntity(dashboardModel);
		return dashboard;
	}

	async getUsersDashboard(): Promise<DashboardEntity> {
		const hardcodedTestDashboardId = '0000d213816abba584714c0a';
		const dashboardModel = await this.em.findOne(DashboardModelEntity, hardcodedTestDashboardId);
		if (dashboardModel) {
			return mapToEntity(dashboardModel);
		}
		const gridArray: GridElement[] = [];
		const diagonalSize = 5;
		const elementReference = new DefaultGridReference('exampletitle');
		for (let i = 0; i < diagonalSize; i += 1) {
			gridArray.push(
				new GridElement(new ObjectId().toString(), Math.floor(Math.random() * 6 + 1), i + 1, elementReference)
			);
		}
		const dashboard = new DashboardEntity(hardcodedTestDashboardId, { grid: gridArray });
		this.persist(dashboard);
		await this.em.flush();

		return dashboard;
	}
}
