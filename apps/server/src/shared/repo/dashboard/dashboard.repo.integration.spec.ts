import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement, DefaultGridReference, DashboardGridElementModel } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { DashboardRepo } from './dashboard.repo';
import { DashboardModelMapper } from './dashboard.model.mapper';

describe('dashboard repo', () => {
	let repo: DashboardRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [DashboardRepo, DashboardModelMapper],
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
		expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
	});

	it('should persist dashboard with gridElement group', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'testgroup', [
						new DefaultGridReference(new ObjectId().toString(), 'German'),
						new DefaultGridReference(new ObjectId().toString(), 'Mathe'),
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
			expect(elementContent.group[0].title).toEqual('German');
			expect(elementContent.group[1].title).toEqual('Mathe');
		}
		expect(elementContent.title).toEqual('testgroup');
		expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
	});

	it('should persist changes', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(
						new ObjectId().toString(),
						new DefaultGridReference(new ObjectId().toString(), 'Math')
					),
				},
				{
					pos: { x: 1, y: 4 },
					gridElement: GridElement.FromPersistedReference(
						new ObjectId().toString(),
						new DefaultGridReference(new ObjectId().toString(), 'German')
					),
				},
			],
		});
		await repo.persistAndFlush(dashboard);
		dashboard.moveElement({ x: 1, y: 3 }, { x: 1, y: 4 });
		await repo.persistAndFlush(dashboard);
		const result = await repo.getDashboardById(dashboard.id);
		expect(result.getGrid().length).toEqual(1);
		expect(result.getGrid()[0].gridElement.getReferences().length).toEqual(2);
	});

	it('should remove orphaned gridelements', async () => {
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(
						new ObjectId().toString(),
						new DefaultGridReference(new ObjectId().toString(), 'Math')
					),
				},
				{
					pos: { x: 1, y: 4 },
					gridElement: GridElement.FromPersistedReference(
						new ObjectId().toString(),
						new DefaultGridReference(new ObjectId().toString(), 'German')
					),
				},
			],
		});
		const element = dashboard.getElement({ x: 1, y: 3 });
		await repo.persistAndFlush(dashboard);
		dashboard.moveElement({ x: 1, y: 3 }, { x: 1, y: 4 });
		await repo.persistAndFlush(dashboard);

		const findOrphan = () => em.findOneOrFail(DashboardGridElementModel, element.getId());

		await expect(findOrphan).rejects.toThrow();
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
			expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
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
			expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
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
			expect(JSON.stringify(firstDashboard)).toEqual(JSON.stringify(secondDashboard));
		});
	});
});
