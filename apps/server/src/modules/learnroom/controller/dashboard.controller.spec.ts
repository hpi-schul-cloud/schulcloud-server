import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity } from '../../../shared/domain/entity/dashboard.entity';
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
				const dashboard = new DashboardEntity({ grid: [] });
				return Promise.resolve(dashboard);
			});
			const response = await controller.findForUser();

			expect(response instanceof DashboardResponse).toEqual(true);
		});
	});
});
