import { DashboardEntity } from './dashboard.entity';

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard when passing empty grid', () => {
			const dashboard = new DashboardEntity({ grid: [[]] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('getter', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new DashboardEntity({ grid: [[]] });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const dashboard = new DashboardEntity({ grid: [[{ getName: () => 'example String' }]] });
			const testGrid = dashboard.getGrid();
			expect(testGrid[0][0].getName()).toEqual('example String');
		});
	});
});
