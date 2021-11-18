import { Test, TestingModule } from '@nestjs/testing';
import { IDashboardRepo } from '@shared/repo';
import { DashboardEntity, GridElement, DefaultGridReference, EntityId } from '@shared/domain';
import { NotFound } from '@feathersjs/errors';
import { DashboardUc } from './dashboard.uc';

describe('dashboard uc', () => {
	let service: DashboardUc;
	let repo: IDashboardRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				DashboardUc,
				{
					provide: 'DASHBOARD_REPO',
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getUsersDashboard(userId: EntityId) {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getDashboardById(id: EntityId) {
							throw new Error('Please write a mock for DashboardRepo.getDashboardById.');
						},
						persistAndFlush(entity: DashboardEntity) {
							return Promise.resolve(entity);
						},
					},
				},
			],
		}).compile();

		service = module.get(DashboardUc);
		repo = module.get('DASHBOARD_REPO');
	});

	describe('getUsersDashboard', () => {
		it('should return a dashboard', async () => {
			const spy = jest.spyOn(repo, 'getUsersDashboard').mockImplementation((userId: EntityId) => {
				const dashboard = new DashboardEntity('someid', { grid: [], userId });
				return Promise.resolve(dashboard);
			});
			const dashboard = await service.getUsersDashboard('userId');

			expect(dashboard instanceof DashboardEntity).toEqual(true);
			expect(spy).toHaveBeenCalledWith('userId');
		});
	});

	describe('moveElementOnDashboard', () => {
		it('should update position of existing element', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				const dashboard = new DashboardEntity(id, {
					grid: [
						{
							pos: { x: 1, y: 2 },
							gridElement: GridElement.FromPersistedReference(
								'elementId',
								new DefaultGridReference('referenceId', 'Mathe')
							),
						},
					],
					userId: 'userId',
				});
				return Promise.resolve(dashboard);
			});
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			const resultGrid = result.getGrid();
			expect(resultGrid[0].pos).toEqual({ x: 2, y: 1 });
		});

		it('should persist the change', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				if (id === 'dashboardId')
					return Promise.resolve(
						new DashboardEntity(id, {
							grid: [
								{
									pos: { x: 1, y: 2 },
									gridElement: GridElement.FromPersistedReference(
										'elementId',
										new DefaultGridReference('referenceId', 'Mathe')
									),
								},
							],
							userId: 'userId',
						})
					);
				throw new Error('not found');
			});
			const spy = jest.spyOn(repo, 'persistAndFlush');
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			expect(spy).toHaveBeenCalledWith(result);
		});

		it('should throw if userIds dont match', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				return Promise.resolve(
					new DashboardEntity(id, {
						grid: [
							{
								pos: { x: 1, y: 2 },
								gridElement: GridElement.FromPersistedReference(
									'elementId',
									new DefaultGridReference('referenceId', 'Mathe')
								),
							},
						],
						userId: 'differentId',
					})
				);
			});

			const callFut = () => service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, 'userId');
			await expect(callFut).rejects.toThrow(NotFound);
		});
	});

	describe('renameGroupOnDashboard', () => {
		it('should update title of existing element', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				const dashboard = new DashboardEntity(id, {
					grid: [
						{
							pos: { x: 3, y: 4 },
							gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
								new DefaultGridReference('referenceId1', 'Math'),
								new DefaultGridReference('referenceId2', 'German'),
							]),
						},
					],
					userId: 'userId',
				});
				return Promise.resolve(dashboard);
			});
			const result = await service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			const gridElement = result.getElement({ x: 3, y: 4 });
			const resultTitle = gridElement.getContent().title;
			expect(resultTitle).toEqual('groupTitle');
		});

		it('should persist the change', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				if (id === 'dashboardId')
					return Promise.resolve(
						new DashboardEntity(id, {
							grid: [
								{
									pos: { x: 3, y: 4 },
									gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
										new DefaultGridReference('referenceId1', 'Math'),
										new DefaultGridReference('referenceId2', 'German'),
									]),
								},
							],
							userId: 'userId',
						})
					);
				throw new Error('not found');
			});
			const spy = jest.spyOn(repo, 'persistAndFlush');
			const result = await service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			expect(spy).toHaveBeenCalledWith(result);
		});

		it('should throw if userIds dont match', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				return Promise.resolve(
					new DashboardEntity(id, {
						grid: [
							{
								pos: { x: 3, y: 4 },
								gridElement: GridElement.FromPersistedGroup('elementId', 'originalTitle', [
									new DefaultGridReference('referenceId1', 'Math'),
									new DefaultGridReference('referenceId2', 'German'),
								]),
							},
						],
						userId: 'differentUserId',
					})
				);
			});

			const callFut = () => service.renameGroupOnDashboard('dashboardId', { x: 3, y: 4 }, 'groupTitle', 'userId');
			await expect(callFut).rejects.toThrow(NotFound);
		});
	});
});
