import { Test, TestingModule } from '@nestjs/testing';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';
import { DashboardEntity } from '@src/entities/learnroom/dashboard.entity';
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
				const dashboard = new DashboardEntity({ grid: [] });
				return Promise.resolve(dashboard);
			});
			const dashboard = await service.getUsersDashboard();

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});
});
