import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement, DefaultGridReference } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { DashboardRepo } from './dashboard.repo';

describe('dashboard repo', () => {
	let repo: DashboardRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [DashboardRepo],
		}).compile();

		repo = module.get(DashboardRepo);
		em = module.get(EntityManager);
	});

	it('should persist a plain dashboard', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), { grid: [] });
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard).toEqual(result);
		expect(dashboard.id).toEqual(result.id);
	});

	it('should persist dashboard with gridElements', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(
						new ObjectId().toString(),
						new DefaultGridReference(new ObjectId().toString(), 'Mathe')
					),
				},
			],
		});
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard.id).toEqual(result.id);
		expect(dashboard).toEqual(result);
	});

	it('should persist dashboard with gridElement group', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), [
						new DefaultGridReference(new ObjectId().toString(), 'Mathe'),
						new DefaultGridReference(new ObjectId().toString(), 'German'),
					]),
				},
			],
		});
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard.id).toEqual(result.id);
		const elementContent = dashboard.getGrid()[0].gridElement.getContent();
		expect(elementContent.group).toBeDefined();
		// if check for typescript only. has been asserted before
		if (elementContent.group) {
			expect(elementContent.group[0].title).toEqual('Mathe');
			expect(elementContent.group[1].title).toEqual('German');
		}
		expect(dashboard).toEqual(result);
	});

	describe('persistAndFlush', () => {
		it('should persist dashboard with gridElements', async () => {
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Mathe')
						),
					},
				],
			});
			await repo.persistAndFlush(dashboard);
			const result = await repo.getDashboardById(dashboard.id);
			expect(dashboard.id).toEqual(result.id);
			expect(dashboard).toEqual(result);
		});

		it('should be idempotent', async () => {
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Mathe')
						),
					},
				],
			});
			await repo.persistAndFlush(dashboard);
			await repo.persistAndFlush(dashboard);

			const result = await repo.getDashboardById(dashboard.id);
			expect(dashboard.id).toEqual(result.id);
			expect(dashboard).toEqual(result);
		});

		it('should persist dashboard with element without id', async () => {
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromSingleReference(new DefaultGridReference(new ObjectId().toString(), 'Mathe')),
					},
				],
			});
			await repo.persistAndFlush(dashboard);

			const result = await repo.getDashboardById(dashboard.id);
			expect(result.id).toEqual(result.id);
			expect(typeof result.getGrid()[0].gridElement.getId()).toEqual('string');
		});
	});

	describe('temporary getUsersDashboard fake implementation', () => {
		it('returns a dashboard', async () => {
			const result = await repo.getUsersDashboard();
			expect(result instanceof DashboardEntity).toEqual(true);
			expect(result.getGrid().length).toBeGreaterThan(0);
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
