import { DashboardEntity } from './dashboard.entity';

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard when passing empty grid', () => {
			const dashboard = new DashboardEntity({ grid: [[]] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});
});
