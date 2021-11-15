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

const getElementMock = (mockId: string, title: string, referenceIds: string[]) => {
	let references = referenceIds.map((id) => getReferenceMock(id));
	return {
		hasId: () => true,
		getId: () => mockId,
		getContent: () => ({
			referencedId: referenceIds[0],
			title,
			shortTitle: title.substr(0, 2),
			displayColor: '#FFFFFF',
		}),
		isGroup: () => false,
		removeReference: () => {},
		getReferences: () => references,
		addReferences: (newreferences: IGridElementReference[]) => {
			references = references.concat(newreferences);
		},
		getGroupName: () => '',
		setGroupName: (newGroupName: string) => {
			title = newGroupName;
		},
	};
};

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', 'title', ['referenceId']) }],
				userId: 'userId',
			});

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});

		it('should create dashboard when passing empty grid', () => {
			const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });

			expect(dashboard instanceof DashboardEntity).toEqual(true);
		});
	});

	describe('getUserId', () => {
		it('should return the owners userId', () => {
			const userId = 'userId';
			const dashboard = new DashboardEntity('someid', { grid: [], userId });
			const result = dashboard.getUserId();
			expect(result).toEqual(userId);
		});
	});

	describe('getGrid', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', 'title', ['referenceId']) }],
				userId: 'userId',
			});
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getContent().referencedId).toEqual('referenceId');
			expect(testGrid[0].gridElement.getContent().title).toEqual('title');
			expect(testGrid[0].gridElement.getContent().shortTitle).toEqual('ti');
			expect(testGrid[0].gridElement.getContent().displayColor).toEqual('#FFFFFF');
		});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: getElementMock('elementId', 'title', ['referenceId']) }],
				userId: 'userId',
			});
			const returnValue = dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(returnValue.pos).toEqual({ x: 3, y: 3 });
			const grid = dashboard.getGrid();
			expect(grid[0].pos).toEqual({ x: 3, y: 3 });
		});

		it('when no element at origin position, it should throw notFound', () => {
			const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
			const callMove = () => dashboard.moveElement({ x: 4, y: 2 }, { x: 3, y: 2 });
			expect(callMove).toThrow(NotFoundException);
		});

		it('when the new position is taken, it should merge the elements into a group', () => {
			const movedElement = getElementMock('tomove', 'title1', ['ref02']);
			const targetElement = getElementMock('target', 'title2', ['ref01']);
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{ pos: { x: 1, y: 2 }, gridElement: movedElement },
					{ pos: { x: 3, y: 3 }, gridElement: targetElement },
				],
				userId: 'userId',
			});
			const spy = jest.spyOn(targetElement, 'addReferences');
			const returnValue = dashboard.moveElement({ x: 1, y: 2 }, { x: 3, y: 3 });
			expect(spy).toHaveBeenLastCalledWith(movedElement.getReferences());
			expect(returnValue.pos).toEqual({ x: 3, y: 3 });
		});

		it('should ungroup a reference from a group', () => {
			const element = getElementMock('element', 'title', ['ref01', 'ref02', 'ref03']);
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: element }],
				userId: 'userId',
			});
			const spy = jest.spyOn(element, 'removeReference');
			dashboard.moveElement({ x: 1, y: 2, groupIndex: 1 }, { x: 3, y: 3 });
			expect(spy).toHaveBeenCalledWith(1);
			expect(dashboard.getGrid().length).toEqual(2);
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const dashboard = new DashboardEntity('someid', {
				colums: 3,
				rows: 3,
				grid: [{ pos: { x: 0, y: 2 }, gridElement: getElementMock('elementId', 'title', ['referenceId']) }],
				userId: 'userId',
			});
			const callMove = () => dashboard.moveElement({ x: 0, y: 2 }, { x: 4, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});
	});

	describe('getElement', () => {
		it('getElement should return correct value', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 0, y: 2 }, gridElement: getElementMock('elementId', 'Mathe 3d', ['referenceId']) }],
				userId: 'userId',
			});
			const testElement = dashboard.getElement({ x: 0, y: 2 });
			const result = testElement.getContent();
			expect(testElement).toHaveProperty('getId');
			expect(testElement).toHaveProperty('getContent');
			expect(testElement).toHaveProperty('isGroup');
			expect(testElement).toHaveProperty('getReferences');
			expect(testElement).toHaveProperty('addReferences');
			expect(testElement).toHaveProperty('getGroupName');
			expect(testElement).toHaveProperty('setGroupName');
			expect(result.referencedId).toEqual('referenceId');
			expect(result.title).toEqual('Mathe 3d');
			expect(result.shortTitle).toEqual('Ma');
			expect(result.displayColor).toEqual('#FFFFFF');
		});

		it('when no element at request position, it should throw notFound', () => {
			const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
			const callGetElement = () => dashboard.getElement({ x: 0, y: 2 });
			expect(callGetElement).toThrow(NotFoundException);
		});
	});
});
