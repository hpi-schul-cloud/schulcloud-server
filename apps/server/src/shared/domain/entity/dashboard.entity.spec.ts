import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardEntity } from './dashboard.entity';

const gridElementMock = {
	getId: () => 'gridelementid',
	getContent: () => ({
		referencedId: 'referenceId',
		title: 'Mathe 3d',
		shortTitle: 'Ma',
		displayColor: '#FFFFFF',
	}),
	isGroup: () => false,
	getReferences: () => [],
};

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: gridElementMock }],
			});

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
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: gridElementMock }],
			});
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getContent().referencedId).toEqual('referenceId');
			expect(testGrid[0].gridElement.getContent().title).toEqual('Mathe 3d');
			expect(testGrid[0].gridElement.getContent().shortTitle).toEqual('Ma');
			expect(testGrid[0].gridElement.getContent().displayColor).toEqual('#FFFFFF');
		});

		// it.todo('when elements are returned, they should include positions', () => {});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: gridElementMock }],
			});
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
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{ pos: { x: 1, y: 2 }, gridElement: gridElementMock },
					{ pos: { x: 3, y: 3 }, gridElement: gridElementMock },
				],
			});
			const callMove = () => dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const dashboard = new DashboardEntity('someid', {
				colums: 3,
				rows: 3,
				grid: [{ pos: { x: 0, y: 2 }, gridElement: gridElementMock }],
			});
			const callMove = () => dashboard.moveElement({ x: 0, y: 2 }, { x: 4, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});
	});
});
