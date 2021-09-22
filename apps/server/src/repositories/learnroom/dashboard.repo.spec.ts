import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { wrap } from '@mikro-orm/core';
import { DashboardRepo } from './dashboard.repo';
import { DashboardEntity } from '../../entities/learnroom/dashboard.entity';
import { DashboardModelEntity, DashboardGridElementModel, mapToEntity } from './dashboard.model.entity';
import { Course } from '../../entities';
import { MongoMemoryDatabaseModule } from '../../modules/database';

describe('dashboard repo', () => {
	let repo: DashboardRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DashboardModelEntity, DashboardGridElementModel, Course],
				}),
			],
			providers: [DashboardRepo],
		}).compile();

		repo = module.get(DashboardRepo);
		em = module.get(EntityManager);
	});

	it('should persist a plain dashboard', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), { grid: [] });
		repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard).toEqual(result);
	});

	it.todo('should persist dashboard with gridElements');
});

/* describe('dashboard repo', () => {
	let repo: DashboardRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DashboardModelEntity, DashboardGridElementModel, Course],
				}),
			],
			providers: [DashboardRepo],
		}).compile();

		repo = module.get(DashboardRepo);
		em = module.get(EntityManager);
	});

	it('would work with a modelEntity', async () => {
		const dashboard = new DashboardModelEntity();
		const course = new Course({ name: 'software engineering', schoolId: new ObjectId() });
		const gridElement = new DashboardGridElementModel();
		gridElement.dashboard = wrap(dashboard).toReference();
		gridElement.reference = course;
		gridElement.xPos = 2;
		gridElement.yPos = 4;
		em.persist([dashboard, course, gridElement]);
		await em.flush();
		const dashboards = await em.findOneOrFail(DashboardModelEntity, dashboard.id);

		const mapped = mapToEntity(dashboards);
		expect(mapped instanceof DashboardEntity).toEqual(true);
		const grid = mapped.getGrid();
		expect(grid[0].getMetadata().title).toEqual('software engineering');
	});
}); */
