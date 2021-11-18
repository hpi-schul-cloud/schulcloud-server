import { Injectable } from '@nestjs/common';
import {
	EntityId,
	DashboardEntity,
	DefaultGridReference,
	GridElement,
	GridElementWithPosition,
	DashboardModelEntity,
} from '@shared/domain';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { DashboardModelMapper } from './dashboard.model.mapper';

const generateHardcodedTestDashboard = (userId: EntityId) => {
	const gridArray: GridElementWithPosition[] = [];

	gridArray.push({
		pos: { x: 1, y: 3 },
		gridElement: GridElement.FromPersistedReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'Math')
		),
	});
	gridArray.push({
		pos: { x: 1, y: 4 },
		gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'Science', [
			new DefaultGridReference(new ObjectId().toString(), 'Physics'),
			new DefaultGridReference(new ObjectId().toString(), 'Biology'),
			new DefaultGridReference(new ObjectId().toString(), 'Chemistry'),
		]),
	});
	gridArray.push({
		pos: { x: 2, y: 1 },
		gridElement: GridElement.FromPersistedReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'English')
		),
	});
	gridArray.push({
		pos: { x: 3, y: 1 },
		gridElement: GridElement.FromPersistedReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'German')
		),
	});
	gridArray.push({
		pos: { x: 4, y: 1 },
		gridElement: GridElement.FromPersistedReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'Greek')
		),
	});

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

		const dashboard = generateHardcodedTestDashboard(userId);
		await this.persistAndFlush(dashboard);

		return dashboard;
	}
}
