import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardEntity, IGridElementReference } from './dashboard.entity';

const getReferenceMock = (id: string) => ({
	getMetadata: () => ({
		id,
		title: 'Reference',
		shortTitle: 'Re',
		displayColor: '#FFFFFF',
	}),
});

const getElementMock = (mockId: string, referenceIds: string[]) => {
	let references = referenceIds.map((id) => getReferenceMock(id));
	return {
		hasId: () => true,
		getId: () => mockId,
		getContent: () => ({
			referencedId: referenceIds[0],
			title: 'Reference',
			shortTitle: 'Re',
			displayColor: '#FFFFFF',
		}),
		isGroup: () => false,
		getReferences: () => references,
		addReferences: (newreferences: IGridElementReference[]) => {
			references = references.concat(newreferences);
		},
	};
};

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', ['referenceId']) }],
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
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', ['referenceId']) }],
			});
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getContent().referencedId).toEqual('referenceId');
			expect(testGrid[0].gridElement.getContent().title).toEqual('Reference');
			expect(testGrid[0].gridElement.getContent().shortTitle).toEqual('Re');
			expect(testGrid[0].gridElement.getContent().displayColor).toEqual('#FFFFFF');
		});

		// it.todo('when elements are returned, they should include positions', () => {});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', ['referenceId']) }],
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

		it('when the new position is taken, it should merge the elements into a group', () => {
			const movedElement = getElementMock('tomove', ['ref02']);
			const targetElement = getElementMock('target', ['ref01']);
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{ pos: { x: 1, y: 2 }, gridElement: movedElement },
					{ pos: { x: 3, y: 3 }, gridElement: targetElement },
				],
			});
			const spy = jest.spyOn(targetElement, 'addReferences');
			const returnValue = dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(spy).toHaveBeenLastCalledWith(movedElement.getReferences());
			expect(returnValue.pos).toEqual({ x: 3, y: 3 });
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const dashboard = new DashboardEntity('someid', {
				colums: 3,
				rows: 3,
				grid: [{ pos: { x: 0, y: 2 }, gridElement: getElementMock('elementId', ['referenceId']) }],
			});
			const callMove = () => dashboard.moveElement({ x: 0, y: 2 }, { x: 4, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});
	});
});
