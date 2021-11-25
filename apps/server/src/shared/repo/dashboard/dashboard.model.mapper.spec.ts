import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	DashboardEntity,
	GridElement,
	DefaultGridReference,
	DashboardGridElementModel,
	DashboardModelEntity,
	DefaultGridReferenceModel,
} from '@shared/domain';
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
			const dashboard = new DashboardModelEntity({ id: new ObjectId().toString(), user: new ObjectId().toString() });
			const element = new DashboardGridElementModel(new ObjectId().toString());
			element.xPos = 1;
			element.yPos = 2;
			const reference = new DefaultGridReferenceModel(new ObjectId().toString());
			reference.title = 'German';

			element.references.add(reference);
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
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'languages', [
							new DefaultGridReference(new ObjectId().toString(), 'English'),
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
				userId: new ObjectId().toString(),
			});

			const mapped = await mapper.mapDashboardToModel(dashboard);

			expect(mapped instanceof DashboardModelEntity).toEqual(true);
			expect(mapped.gridElements.length).toEqual(2);
			expect(mapped.user).toEqual(dashboard.userId);
			const element = mapped.gridElements[0];
			expect(element instanceof DashboardGridElementModel);
			expect(element.references.length).toBeGreaterThan(0);
			expect(element.references[0] instanceof DefaultGridReferenceModel).toEqual(true);
			const reference = element.references[0];
			expect(reference.title).toEqual('English');
		});

		it('should detect changes to gridElement Collection', async () => {
			const dashboardId = new ObjectId().toString();
			const elementId = new ObjectId().toString();
			const oldElementId = new ObjectId().toString();
			const newElementId = new ObjectId().toString();
			const originalDashboard = new DashboardModelEntity({ id: dashboardId, user: new ObjectId().toString() });
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
				userId: new ObjectId().toString(),
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
