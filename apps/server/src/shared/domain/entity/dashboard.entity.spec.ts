import { NotFoundException, BadRequestException } from '@nestjs/common';
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

		// it.todo('when elements are returned, they should include positions', () => {});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
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
			const returnValue = dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(returnValue.pos).toEqual({ x: 3, y: 3 });
			const grid = dashboard.getGrid();
			expect(grid[0].pos).toEqual({ x: 3, y: 3 });
		});

		it('when no element at origin position, it should throw notFound', () => {
			const dashboard = new DashboardEntity('someid', { grid: [] });
			const callMove = () => dashboard.moveElement({ x: 4, y: 2 }, { x: 3, y: 2 });
			expect(callMove).toThrow(NotFoundException);
		});

		it('when the new position is taken, it should throw badrequest', () => {
			const gridElement = {
				getId: () => 'gridelementid',
				getMetadata: () => ({
					id: 'someId',
					title: 'Calendar-Dashboard',
					shortTitle: 'CAL',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{ pos: { x: 1, y: 2 }, gridElement },
					{ pos: { x: 3, y: 3 }, gridElement },
				],
			});
			const callMove = () => dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const gridElement = {
				getId: () => 'gridelementid',
				getMetadata: () => ({
					id: 'someId',
					title: 'Calendar-Dashboard',
					shortTitle: 'CAL',
					displayColor: '#FFFFFF',
				}),
			};
			const dashboard = new DashboardEntity('someid', {
				colums: 3,
				rows: 3,
				grid: [{ pos: { x: 0, y: 2 }, gridElement }],
			});
			const callMove = () => dashboard.moveElement({ x: 0, y: 2 }, { x: 4, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});
	});
});
