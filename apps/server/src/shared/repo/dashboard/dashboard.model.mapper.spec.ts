import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Course,
	DashboardEntity,
	DashboardGridElementModel,
	DashboardModelEntity,
	GridElement,
} from '@shared/domain/entity';
import { LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { courseFactory, userFactory } from '@shared/testing/factory';
import { DashboardModelMapper } from './dashboard.model.mapper';

describe('dashboard model mapper', () => {
	let mapper: DashboardModelMapper;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [DashboardModelMapper],
		}).compile();

		mapper = module.get(DashboardModelMapper);
		em = module.get(EntityManager);
	});

	describe('mapDashboardToEntity', () => {
		it('should map dashboard with elements and groups to entity', async () => {
			const dashboard = new DashboardModelEntity({ id: new ObjectId().toString(), user: userFactory.build() });
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user], name: 'German' });

			const element = new DashboardGridElementModel({
				id: new ObjectId().toString(),
				xPos: 1,
				yPos: 2,
				references: [course],
				dashboard,
			});

			dashboard.gridElements.add(element);

			await em.persistAndFlush(dashboard);
			em.clear();

			const persisted = await em.findOneOrFail(DashboardModelEntity, dashboard.id);

			const result = await mapper.mapDashboardToEntity(persisted);

			expect(result.getId()).toEqual(dashboard.id);
			const resultElement = result.getElement({ x: 1, y: 2 });
			expect(resultElement.getContent().title).toEqual('German');
		});
	});

	describe('mapDashboardToModel', () => {
		it('should map dashboard with elements and groups to model', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'languages', [
							courseFactory.build({ students: [user], name: 'English' }),
							courseFactory.build({ students: [user], name: 'German' }),
						]),
					},
					{
						pos: { x: 1, y: 4 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'Math' })
						),
					},
				],
				userId: user.id,
			});

			const mapped = await mapper.mapDashboardToModel(dashboard);

			expect(mapped instanceof DashboardModelEntity).toEqual(true);
			expect(mapped.gridElements.length).toEqual(2);
			expect(mapped.user.id).toEqual(dashboard.userId);
			const element = mapped.gridElements[0];
			expect(element instanceof DashboardGridElementModel);
			expect(element.references.length).toBeGreaterThan(0);
			expect(element.references[0] instanceof Course).toEqual(true);
			const reference = element.references[0];
			expect(['English', 'German', 'Math'].includes(reference.name)).toEqual(true);
		});

		it('should detect changes to gridElement Collection', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);
			const dashboardId = new ObjectId().toString();
			const elementId = new ObjectId().toString();
			const oldElementId = new ObjectId().toString();
			const newElementId = new ObjectId().toString();
			// TODO: use builder
			const originalDashboard = new DashboardModelEntity({ id: dashboardId, user });
			originalDashboard.gridElements.add(
				new DashboardGridElementModel({
					id: oldElementId,
					xPos: 1,
					yPos: 1,
					references: [courseFactory.build({ students: [user] })],
					dashboard: originalDashboard,
				})
			);
			originalDashboard.gridElements.add(
				new DashboardGridElementModel({
					id: elementId,
					xPos: 1,
					yPos: 2,
					references: [courseFactory.build({ students: [user] })],
					dashboard: originalDashboard,
				})
			);
			await em.persistAndFlush(originalDashboard);

			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 2, y: 1 },
						gridElement: GridElement.FromPersistedReference(elementId, courseFactory.build({ students: [user] })),
					},
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(newElementId, courseFactory.build({ students: [user] })),
					},
				],
				userId: user.id,
			});

			const mapped = await mapper.mapDashboardToModel(dashboard);
			expect(mapped.gridElements.length).toEqual(2);
			const containsElement = Array.from(mapped.gridElements).some((el) => el.id === elementId);
			expect(containsElement).toEqual(true);
			const containsNewElement = Array.from(mapped.gridElements).some((el) => el.id === newElementId);
			expect(containsNewElement).toEqual(true);
			const containsOldElement = Array.from(mapped.gridElements).some((el) => el.id === oldElementId);
			expect(containsOldElement).toEqual(false);
		});

		it('should not accept unknown types of learnrooms', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 4 },
						gridElement: GridElement.FromPersistedReference(new ObjectId().toString(), {
							getMetadata: () =>
								({
									id: new ObjectId().toString(),
									title: 'Wohnzimmer',
									type: 'livingroom' as LearnroomTypes,
									shortTitle: 'Wo',
									displayColor: '#FFFFFF',
								} as LearnroomMetadata),
						}),
					},
				],
				userId: user.id,
			});

			const callfunction = () => mapper.mapDashboardToModel(dashboard);
			await expect(callfunction).rejects.toThrow(InternalServerErrorException);
		});
	});
});
