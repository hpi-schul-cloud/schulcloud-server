import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup, DashboardGridElementModel, DashboardModelEntity, User } from '@shared/domain/entity';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { userFactory } from '@testing/factory/user.factory';
import { DashboardElementRepo } from './dashboard-element.repo';

describe(DashboardElementRepo.name, () => {
	let repo: DashboardElementRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DashboardGridElementModel, DashboardModelEntity, Course, User, CourseGroup],
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
			expect(repo.entityName).toBe(DashboardGridElementModel);
		});
	});

	describe('deleteByDasboardId', () => {
		const setup = async () => {
			const user1 = userFactory.build();
			const user2 = userFactory.build();
			const course = courseFactory.build({ students: [user1], name: 'Mathe' });
			await em.persistAndFlush([user1, course]);

			const dashboard = new DashboardModelEntity({ id: new ObjectId().toString(), user: user1 });
			const dashboardWithoutDashboardElement = new DashboardModelEntity({ id: new ObjectId().toString(), user: user2 });

			const element = new DashboardGridElementModel({
				id: new ObjectId().toString(),
				xPos: 1,
				yPos: 2,
				references: [course],
				dashboard,
			});

			dashboard.gridElements.add(element);

			await em.persistAndFlush([dashboard, dashboardWithoutDashboardElement]);
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

				const result2 = await em.findOne(DashboardGridElementModel, {
					dashboard: dashboard.id,
				});
				expect(result2).toEqual(null);
			});
		});
	});
});
