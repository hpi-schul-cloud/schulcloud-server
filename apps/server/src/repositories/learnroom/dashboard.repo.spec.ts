import { DashboardRepo } from './dashboard.repo';
import { DashboardEntity } from '../../entities/learnroom/dashboard.entity';

describe('dashboard repo', () => {
	describe('getters', () => {
		it('getUsersDashboard should return a usable DashboardEntity', async () => {
			const dashboardRepo = new DashboardRepo();
			const dashboard = await dashboardRepo.getUsersDashboard();
			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});
});
