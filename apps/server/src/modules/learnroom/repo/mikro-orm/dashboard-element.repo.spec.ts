import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { DashboardElementRepo } from './dashboard-element.repo';
import { DashboardEntity, DashboardGridElementEntity } from './dashboard.entity';

describe(DashboardElementRepo.name, () => {
	let repo: DashboardElementRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DashboardGridElementEntity, DashboardEntity, CourseEntity, User, CourseGroupEntity],
				}),
			],
			providers: [DashboardElementRepo],
		}).compile();

		repo = module.get(DashboardElementRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
			expect(typeof repo.deleteByDashboardId).toEqual('function');
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(DashboardGridElementEntity);
		});
	});

	describe('deleteByDasboardId', () => {
		const setup = async () => {
			const user1 = userFactory.build();
			const user2 = userFactory.build();
			const course = courseEntityFactory.build({ students: [user1], name: 'Mathe' });
			await em.persist([user1, course]).flush();

			const dashboard = new DashboardEntity({ id: new ObjectId().toString(), user: user1 });
			const dashboardWithoutDashboardElement = new DashboardEntity({ id: new ObjectId().toString(), user: user2 });

			const element = new DashboardGridElementEntity({
				id: new ObjectId().toString(),
				xPos: 1,
				yPos: 2,
				references: [course],
				dashboard,
			});

			dashboard.gridElements.add(element);

			await em.persist([dashboard, dashboardWithoutDashboardElement]).flush();
			em.clear();

			return { dashboard, dashboardWithoutDashboardElement };
		};

		describe('when user has no dashboardElement ', () => {
			it('should return 0', async () => {
				const { dashboardWithoutDashboardElement } = await setup();

				const result = await repo.deleteByDashboardId(dashboardWithoutDashboardElement.id);
				expect(result).toEqual(0);
			});
		});

		describe('when user has some dashboardElement on dashboard ', () => {
			it('should return 1', async () => {
				const { dashboard } = await setup();

				const result1 = await repo.deleteByDashboardId(dashboard.id);
				expect(result1).toEqual(1);

				const result2 = await em.findOne(DashboardGridElementEntity, {
					dashboard: dashboard.id,
				});
				expect(result2).toEqual(null);
			});
		});
	});
});
