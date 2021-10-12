import { Test, TestingModule } from '@nestjs/testing';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';
import { DashboardEntity, GridElement, DefaultGridReference, EntityId } from '@shared/domain';
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
						getUsersDashboard() {
							throw new Error('Please write a mock for DashboardRepo.getUsersDashboard.');
						},
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

		service = module.get<DashboardUc>(DashboardUc);
		repo = module.get<IDashboardRepo>('DASHBOARD_REPO');
	});

	describe('getUsersDashboard', () => {
		it('should return a dashboard', async () => {
			jest.spyOn(repo, 'getUsersDashboard').mockImplementation(() => {
				const dashboard = new DashboardEntity('someid', { grid: [] });
				return Promise.resolve(dashboard);
			});
			const dashboard = await service.getUsersDashboard();

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('moveElementOnDashboard', () => {
		it('should update position of existing element', async () => {
			jest.spyOn(repo, 'getDashboardById').mockImplementation((id: EntityId) => {
				const dashboard = new DashboardEntity(id, {
					grid: [
						{
							pos: { x: 1, y: 2 },
							gridElement: new GridElement('elementId', new DefaultGridReference('referenceId', 'Mathe')),
						},
					],
				});
				return Promise.resolve(dashboard);
			});
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 });
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
									gridElement: new GridElement('elementId', new DefaultGridReference('referenceId', 'Mathe')),
								},
							],
						})
					);
				throw new Error('not found');
			});
			const spy = jest.spyOn(repo, 'persistAndFlush');
			const result = await service.moveElementOnDashboard('dashboardId', { x: 1, y: 2 }, { x: 2, y: 1 });
			expect(spy).toHaveBeenCalledWith(result);
		});
	});
});
