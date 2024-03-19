import { ICurrentUser } from '@modules/authentication';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement, GridPosition } from '@shared/domain/entity';
import { EntityId, LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { DashboardUc } from '../uc/dashboard.uc';
import { DashboardController } from './dashboard.controller';
import { DashboardResponse } from './dto';

const learnroomMock = (id: string, name: string) => {
	return {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
				isSynchronized: false,
			};
		},
	};
};

describe('dashboard uc', () => {
	let uc: DashboardUc;
	let controller: DashboardController;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				DashboardController,
				{
					provide: DashboardUc,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						moveElementOnDashboard(dashboardId: EntityId, from: GridPosition, to: GridPosition) {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

		it('should return a dashboard for teacher', async () => {
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
								learnroomMock('firstId', 'Math'),
								learnroomMock('secondId', 'German'),
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
								gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
							},
						],
						userId: 'userId',
					});
					return Promise.resolve(dashboard);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.moveElement(
				{ dashboardId: 'dashboardId' },
				{ from: { x: 1, y: 2 }, to: { x: 2, y: 1 } },
				currentUser
			);
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
								gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
							},
						],
						userId: 'userId',
					});
					return Promise.resolve(dashboard);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const response = await controller.moveElement(
				{ dashboardId: 'dashboardId' },
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
								gridElement: GridElement.FromPersistedGroup('elementId', title, [
									learnroomMock('referenceId1', 'Math'),
									learnroomMock('referenceId2', 'German'),
								]),
							},
						],
						userId: 'userId',
					});
					return Promise.resolve(dashboard);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.patchGroup({ dashboardId: 'dashboardId' }, 3, 4, { title: 'groupTitle' }, currentUser);
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
								gridElement: GridElement.FromPersistedGroup('elementId', title, [
									learnroomMock('referenceId1', 'Math'),
									learnroomMock('referenceId2', 'German'),
								]),
							},
						],
						userId: 'userId',
					});
					return Promise.resolve(dashboard);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const response = await controller.patchGroup(
				{ dashboardId: 'dashboardId' },
				3,
				4,
				{ title: 'groupTitle' },
				currentUser
			);
			expect(response instanceof DashboardResponse).toEqual(true);
		});
	});
});
