import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, EntityId, GridPosition, GridElement, DefaultGridReference } from '@shared/domain';
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
						getUsersDashboard() {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
						moveElementOnDashboard(dashboardId: EntityId, from: GridPosition, to: GridPosition) {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
					},
				},
			],
		}).compile();

		uc = module.get<DashboardUc>(DashboardUc);
		controller = module.get<DashboardController>(DashboardController);
	});

	describe('getUsersDashboard', () => {
		it('should return a dashboard', async () => {
			jest.spyOn(uc, 'getUsersDashboard').mockImplementation(() => {
				const dashboard = new DashboardEntity('someid', { grid: [] });
				return Promise.resolve(dashboard);
			});
			const response = await controller.findForUser();

			expect(response instanceof DashboardResponse).toEqual(true);
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
								gridElement: new GridElement('elementId', new DefaultGridReference('referenceId', 'Mathe')),
							},
						],
					});
					return Promise.resolve(dashboard);
				});
			await controller.moveElement('dashboardId', { from: { x: 1, y: 2 }, to: { x: 2, y: 1 } });
			expect(spy).toHaveBeenCalledWith('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 });
		});

		it('should return a dashboard', async () => {
			jest
				.spyOn(uc, 'moveElementOnDashboard')
				.mockImplementation((dashboardId: EntityId, from: GridPosition, to: GridPosition) => {
					const dashboard = new DashboardEntity(dashboardId, {
						grid: [
							{
								pos: to,
								gridElement: new GridElement('elementId', new DefaultGridReference('referenceId', 'Mathe')),
							},
						],
					});
					return Promise.resolve(dashboard);
				});
			const response = await controller.moveElement('dashboardId', { from: { x: 1, y: 2 }, to: { x: 2, y: 1 } });
			expect(response instanceof DashboardResponse).toEqual(true);
		});
	});
});
