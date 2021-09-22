import { DashboardEntity } from './dashboard.entity';

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const gridElement = {
				getPosition: () => ({
					x: 1,
					y: 1,
				}),
				getMetadata: () => ({
					id: 'someId',
					title: 'Mathe 3d',
					shortTitle: 'Ma',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', { grid: [gridElement] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});

		it('should create dashboard when passing empty grid', () => {
			const dashboard = new DashboardEntity('someid', { grid: [] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('grid', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new DashboardEntity('someid', { grid: [] });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const gridElement = {
				getPosition: () => ({
					x: 1,
					y: 2,
				}),
				getMetadata: () => ({
					id: 'someId',
					title: 'Calendar-Dashboard',
					shortTitle: 'CAL',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', { grid: [gridElement] });
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].getPosition().x).toEqual(1);
			expect(testGrid[0].getPosition().y).toEqual(2);
			expect(testGrid[0].getMetadata().id).toEqual('someId');
			expect(testGrid[0].getMetadata().title).toEqual('Calendar-Dashboard');
			expect(testGrid[0].getMetadata().shortTitle).toEqual('CAL');
			expect(testGrid[0].getMetadata().displayColor).toEqual('#FFFFFF');
		});
	});
});
