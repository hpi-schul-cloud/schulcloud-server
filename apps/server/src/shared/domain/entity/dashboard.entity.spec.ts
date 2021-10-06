import { DashboardEntity } from './dashboard.entity';

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const gridElement = {
				getId: () => 'gridelementid',
				getMetadata: () => ({
					id: 'someId',
					title: 'Mathe 3d',
					shortTitle: 'Ma',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', { grid: [{ pos: { x: 1, y: 2 }, gridElement }] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});

		it('should create dashboard when passing empty grid', () => {
			const dashboard = new DashboardEntity('someid', { grid: [] });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('getGrid', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new DashboardEntity('someid', { grid: [] });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const gridElement = {
				getId: () => 'gridelementid',
				getMetadata: () => ({
					id: 'someId',
					title: 'Calendar-Dashboard',
					shortTitle: 'CAL',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', { grid: [{ pos: { x: 1, y: 2 }, gridElement }] });
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getMetadata().id).toEqual('someId');
			expect(testGrid[0].gridElement.getMetadata().title).toEqual('Calendar-Dashboard');
			expect(testGrid[0].gridElement.getMetadata().shortTitle).toEqual('CAL');
			expect(testGrid[0].gridElement.getMetadata().displayColor).toEqual('#FFFFFF');
		});

		it.todo('when elements are returned, they should include positions');
	});

	/* describe('moveElement', () => {
		it('when the new position is taken, it should return an error', () => {});
	}); */
});
