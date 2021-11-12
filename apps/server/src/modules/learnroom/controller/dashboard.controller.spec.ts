import { Test, TestingModule } from '@nestjs/testing';
import {
	DashboardEntity,
	EntityId,
	GridPosition,
	GridElement,
	DefaultGridReference,
	ICurrentUser,
} from '@shared/domain';
import { DashboardUc } from '../uc/dashboard.uc';
import { DashboardController } from './dashboard.controller';
import { DashboardResponse } from './dto';

describe('dashboard uc', () => {
	let uc: DashboardUc;
	let controller: DashboardController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				DashboardController,
				{
					provide: DashboardUc,
					useValue: {
						getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						moveElementOnDashboard(dashboardId: EntityId, from: GridPosition, to: GridPosition) {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						renameGroupOnDashboard(dashboardId: EntityId, position: GridPosition, title: string) {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
					},
				},
			],
		}).compile();

		uc = module.get(DashboardUc);
		controller = module.get(DashboardController);
	});

	describe('getUsersDashboard', () => {
		it('should return a dashboard', async () => {
			jest.spyOn(uc, 'getUsersDashboard').mockImplementation(() => {
				const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
				return Promise.resolve(dashboard);
			});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const response = await controller.findForUser(currentUser);

			expect(response instanceof DashboardResponse).toEqual(true);
		});

		it('should return a dashboard with a group', async () => {
			jest.spyOn(uc, 'getUsersDashboard').mockImplementation(() => {
				const dashboard = new DashboardEntity('someid', {
					grid: [
						{
							pos: { x: 1, y: 3 },
							gridElement: GridElement.FromPersistedGroup('elementId', 'groupTitle', [
								new DefaultGridReference('firstId', 'Math'),
								new DefaultGridReference('secondId', 'German'),
							]),
						},
					],
					userId: 'userId',
				});
				return Promise.resolve(dashboard);
			});
			const currentUser = { userId: 'userId' } as ICurrentUser;

			const response = await controller.findForUser(currentUser);
			expect(response instanceof DashboardResponse).toEqual(true);
			expect(response.gridElements[0]).toHaveProperty('groupElements');
		});

		it('should call uc', async () => {
			const spy = jest.spyOn(uc, 'getUsersDashboard').mockImplementation(() => {
				const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
				return Promise.resolve(dashboard);
			});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.findForUser(currentUser);

			expect(spy).toHaveBeenCalledWith('userId');
		});
	});

	describe('moveElement', () => {
		it('should call uc', async () => {
			const spy = jest
				.spyOn(uc, 'moveElementOnDashboard')
				.mockImplementation((dashboardId: EntityId, from: GridPosition, to: GridPosition) => {
					const dashboard = new DashboardEntity(dashboardId, {
						grid: [
							{
								pos: to,
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
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.moveElement('dashboardId', { from: { x: 1, y: 2 }, to: { x: 2, y: 1 } }, currentUser);
			expect(spy).toHaveBeenCalledWith('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 }, currentUser.userId);
		});

		it('should return a dashboard', async () => {
			jest
				.spyOn(uc, 'moveElementOnDashboard')
				.mockImplementation((dashboardId: EntityId, from: GridPosition, to: GridPosition) => {
					const dashboard = new DashboardEntity(dashboardId, {
						grid: [
							{
								pos: to,
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
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const response = await controller.moveElement(
				'dashboardId',
				{
					from: { x: 1, y: 2 },
					to: { x: 2, y: 1 },
				},
				currentUser
			);
			expect(response instanceof DashboardResponse).toEqual(true);
		});
	});

	describe('patchGroup', () => {
		it('should call uc', async () => {
			const spy = jest
				.spyOn(uc, 'renameGroupOnDashboard')
				.mockImplementation((dashboardId: EntityId, position: GridPosition, title: string) => {
					const dashboard = new DashboardEntity(dashboardId, {
						grid: [
							{
								pos: position,
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
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.patchGroup('dashboardId', 3, 4, { title: 'groupTitle' }, currentUser);
			expect(spy).toHaveBeenCalledWith('dashboardId', { x: 3, y: 4 }, 'groupTitle', currentUser.userId);
		});

		it('should return a dashboard', async () => {
			jest
				.spyOn(uc, 'renameGroupOnDashboard')
				.mockImplementation((dashboardId: EntityId, position: GridPosition, title: string) => {
					const dashboard = new DashboardEntity(dashboardId, {
						grid: [
							{
								pos: position,
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
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const response = await controller.patchGroup('dashboardId', 3, 4, { title: 'groupTitle' }, currentUser);
			expect(response instanceof DashboardResponse).toEqual(true);
		});
	});
});
