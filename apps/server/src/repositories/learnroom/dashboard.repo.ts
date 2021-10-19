import { Injectable } from '@nestjs/common';
import { EntityId, DashboardEntity, DefaultGridReference, GridElement, GridElementWithPosition } from '@shared/domain';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { DashboardModelEntity } from './dashboard.model.entity';
import { DashboardModelMapper } from './dashboard.model.mapper';

const hardcodedTestDashboardId = '0000d213816abba584714c0a';
const generateHardcodedTestDashboard = () => {
	const gridArray: GridElementWithPosition[] = [];

	gridArray.push({
		pos: { x: 1, y: 3 },
		gridElement: GridElement.FromSingleReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'Math')
		),
	});
	gridArray.push({
		pos: { x: 1, y: 4 },
		gridElement: GridElement.FromReferenceGroup(new ObjectId().toString(), [
			new DefaultGridReference(new ObjectId().toString(), 'Physics'),
			new DefaultGridReference(new ObjectId().toString(), 'Biology'),
			new DefaultGridReference(new ObjectId().toString(), 'Chemistry'),
		]),
	});
	gridArray.push({
		pos: { x: 2, y: 1 },
		gridElement: GridElement.FromSingleReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'English')
		),
	});
	gridArray.push({
		pos: { x: 3, y: 1 },
		gridElement: GridElement.FromSingleReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'German')
		),
	});
	gridArray.push({
		pos: { x: 4, y: 1 },
		gridElement: GridElement.FromSingleReference(
			new ObjectId().toString(),
			new DefaultGridReference(new ObjectId().toString(), 'Greek')
		),
	});

	const dashboard = new DashboardEntity(hardcodedTestDashboardId, { grid: gridArray });
	return dashboard;
};

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
		const dashboardModel = await this.em.findOne(DashboardModelEntity, hardcodedTestDashboardId);
		if (dashboardModel) {
			return DashboardModelMapper.mapToEntity(dashboardModel);
		}

		const dashboard = generateHardcodedTestDashboard();
		await this.persistAndFlush(dashboard);

		return dashboard;
	}
}
