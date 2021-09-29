import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardRepo } from './dashboard.repo';
import { DashboardEntity, GridElement, DefaultGridReference } from '../../entities/learnroom/dashboard.entity';
import { DashboardModelEntity, DashboardGridElementModel, DefaultGridReferenceModel } from './dashboard.model.entity';
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
					entities: [DashboardModelEntity, DashboardGridElementModel, DefaultGridReferenceModel, Course],
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
		expect(dashboard.id).toEqual(result.id);
	});

	it('should persist dashboard with gridElements', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				new GridElement(new ObjectId().toString(), 1, 2, new DefaultGridReference(new ObjectId().toString(), 'Mathe')),
			],
		});
		repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard.id).toEqual(result.id);
		expect(dashboard).toEqual(result);
	});

	describe('temporary getUsersDashboard fake implementation', () => {
		it('returns a dashboard', async () => {
			const result = await repo.getUsersDashboard();
			expect(result instanceof DashboardEntity).toEqual(true);
			expect(result.grid.length).toBeGreaterThan(0);
		});

		it('always returns the same dashboard', async () => {
			const firstDashboard = await repo.getUsersDashboard();
			// cant manipulate the dashboard, because the entity doesnt support changes yet
			const secondDashboard = await repo.getUsersDashboard();
			expect(firstDashboard.id).toEqual(secondDashboard.id);
			expect(firstDashboard).toEqual(secondDashboard);
		});
	});
});
