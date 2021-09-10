import { DashboardEntity } from './dashboard.entity';

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard when passing empty grid', () => {
			const gridElement = { xPos: 1, yPos: 2, getName: () => 'test element' };
			const dashboard = new DashboardEntity({ grid: [gridElement] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});

		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new DashboardEntity({ grid: [] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('grid', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new DashboardEntity({ grid: [] });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const gridElement = { xPos: 1, yPos: 2, getName: () => 'test element' };
			const dashboard = new DashboardEntity({ grid: [gridElement] });
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].getName()).toEqual('test element');
		});
	});
});
