import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { DashboardEntity, GridElement, DefaultGridReference } from '@shared/domain';
import { DashboardModelMapper } from './dashboard.model.mapper';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

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

	describe('mapDashboardToModel', () => {
		it('should map dashboard with elements and groups to model', async () => {
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'languages', [
							new DefaultGridReference(new ObjectId().toString(), 'Mathe'),
							new DefaultGridReference(new ObjectId().toString(), 'German'),
						]),
					},
					{
						pos: { x: 1, y: 4 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Math')
						),
					},
				],
			});

			const mapped = await mapper.mapDashboardToModel(dashboard);

			expect(mapped instanceof DashboardModelEntity).toEqual(true);
			expect(mapped.gridElements.length).toEqual(2);
			const element = mapped.gridElements[0];
			expect(element instanceof DashboardGridElementModel);
			expect(element.references.length).toBeGreaterThan(0);
			expect(element.references[0] instanceof DefaultGridReferenceModel).toEqual(true);
		});

		it('should detect changes to gridElement Collection', async () => {
			const dashboardId = new ObjectId().toString();
			const elementId = new ObjectId().toString();
			const oldElementId = new ObjectId().toString();
			const newElementId = new ObjectId().toString();
			const originalDashboard = new DashboardModelEntity(dashboardId);
			originalDashboard.gridElements.add(new DashboardGridElementModel(oldElementId));
			originalDashboard.gridElements.add(new DashboardGridElementModel(new ObjectId().toString()));
			await em.persistAndFlush(originalDashboard);

			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference(elementId, new DefaultGridReference(elementId, 'Mathe')),
					},
					{
						pos: { x: 1, y: 4 },
						gridElement: GridElement.FromPersistedReference(
							newElementId,
							new DefaultGridReference(new ObjectId().toString(), 'Math')
						),
					},
				],
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
	});
});
