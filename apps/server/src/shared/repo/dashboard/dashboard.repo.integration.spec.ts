import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement, DashboardGridElementModel } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { courseFactory, userFactory } from '@shared/testing';
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
		const dashboard = new DashboardEntity(new ObjectId().toString(), { grid: [], userId: new ObjectId().toString() });
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard).toEqual(result);
		expect(dashboard.id).toEqual(result.id);
	});

	it('should persist dashboard with gridElements', async () => {
		const user = userFactory.build();
		const course = courseFactory.build({ students: [user] });
		await em.persistAndFlush([course]);
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), course),
				},
			],
			userId: user.id,
		});
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard.id).toEqual(result.id);
		expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
	});

	it('should persist dashboard with gridElement group', async () => {
		const user = userFactory.build();
		const courses = courseFactory.buildList(2, { students: [user] });
		await em.persistAndFlush([user, ...courses]);
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'testgroup', courses),
				},
			],
			userId: user.id,
		});
		await repo.persist(dashboard);
		await em.flush();
		const result = await repo.getDashboardById(dashboard.id);
		expect(dashboard.id).toEqual(result.id);
		const elementContent = dashboard.getGrid()[0].gridElement.getContent();
		expect(elementContent.group).toBeDefined();
		// if check for typescript only. has been asserted before
		if (elementContent.group) {
			expect(elementContent.group[0].title).toEqual(courses[0].name);
			expect(elementContent.group[1].title).toEqual(courses[1].name);
		}
		expect(elementContent.title).toEqual('testgroup');
		expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
	});

	it('should persist changes', async () => {
		const user = userFactory.build();
		const courses = courseFactory.buildList(2, { students: [user] });
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), courses[0]),
				},
				{
					pos: { x: 1, y: 4 },
					gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), courses[1]),
				},
			],
			userId: new ObjectId().toString(),
		});
		await repo.persistAndFlush(dashboard);
		dashboard.moveElement({ x: 1, y: 3 }, { x: 1, y: 4 });
		await repo.persistAndFlush(dashboard);
		const result = await repo.getDashboardById(dashboard.id);
		expect(result.getGrid().length).toEqual(1);
		expect(result.getGrid()[0].gridElement.getReferences().length).toEqual(2);
	});

	it('should remove orphaned gridelements', async () => {
		const user = userFactory.build();
		const courses = courseFactory.buildList(2, { students: [user] });
		const dashboard = new DashboardEntity(new ObjectId().toString(), {
			grid: [
				{
					pos: { x: 1, y: 3 },
					gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), courses[0]),
				},
				{
					pos: { x: 1, y: 4 },
					gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), courses[1]),
				},
			],
			userId: new ObjectId().toString(),
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
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], name: 'Mathe' });
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), course),
					},
				],
				userId: new ObjectId().toString(),
			});
			await repo.persistAndFlush(dashboard);
			em.clear();
			const result = await repo.getDashboardById(dashboard.id);
			expect(dashboard.id).toEqual(result.id);
			expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
			const grid = result.getGrid();
			const firstElement = grid[0].gridElement.getContent();
			expect(firstElement.title).toEqual('Mathe');
		});

		it('should be idempotent', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], name: 'Mathe' });
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), course),
					},
				],
				userId: new ObjectId().toString(),
			});
			await repo.persistAndFlush(dashboard);
			await repo.persistAndFlush(dashboard);

			const result = await repo.getDashboardById(dashboard.id);
			expect(dashboard.id).toEqual(result.id);
			expect(JSON.stringify(dashboard)).toEqual(JSON.stringify(result));
		});

		it('should persist dashboard with element without id', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], name: 'Mathe' });
			await em.persistAndFlush([user, course]);
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromSingleReference(course),
					},
				],
				userId: user.id,
			});
			await repo.persistAndFlush(dashboard);

			const result = await repo.getDashboardById(dashboard.id);
			expect(result.id).toEqual(result.id);
			expect(typeof result.getGrid()[0].gridElement.getId()).toEqual('string');
		});
	});

	describe('getUsersDashboard', () => {
		describe('when user has no dashboard yet', () => {
			it('generates an empty dashboard ', async () => {
				const result = await repo.getUsersDashboard(new ObjectId().toString());
				expect(result instanceof DashboardEntity).toEqual(true);
				expect(result.getGrid().length).toEqual(0);
			});
		});

		describe('when user has a dashboard already', () => {
			it('should return the existing dashboard', async () => {
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user], name: 'Mathe' });
				await em.persistAndFlush([user, course]);
				const dashboard = new DashboardEntity(new ObjectId().toString(), {
					grid: [
						{
							pos: { x: 1, y: 3 },
							gridElement: GridElement.FromSingleReference(course),
						},
					],
					userId: user.id,
				});
				await repo.persistAndFlush(dashboard);

				const result = await repo.getUsersDashboard(user.id);
				expect(result.id).toEqual(dashboard.id);
			});

			it('always returns different dashboard for different users', async () => {
				const firstUserId = new ObjectId().toString();
				const secondUserId = new ObjectId().toString();

				const firstDashboard = await repo.getUsersDashboard(firstUserId);
				const secondDashboard = await repo.getUsersDashboard(secondUserId);

				expect(firstDashboard.id).not.toEqual(secondDashboard.id);
			});
		});
	});
});
