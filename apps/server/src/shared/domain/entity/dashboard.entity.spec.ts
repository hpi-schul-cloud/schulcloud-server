import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LearnroomTypes } from '@shared/domain/types';
import { Learnroom } from '../interface';
import { DashboardEntity, GridElement } from './dashboard.entity';

const getLearnroomMock = (id: string): Learnroom => {
	return {
		getMetadata: () => {
			return {
				id,
				type: LearnroomTypes.Course,
				title: 'Reference',
				shortTitle: 'Re',
				displayColor: '#FFFFFF',
				isSynchronized: false,
			};
		},
	};
};

describe('dashboard entity', () => {
	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'title', [getLearnroomMock('referenceId')]),
					},
				],
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
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', getLearnroomMock('referenceId')),
					},
				],
				userId: 'userId',
			});
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getContent().referencedId).toEqual('referenceId');
			expect(testGrid[0].gridElement.getContent().title).toEqual('Reference');
			expect(testGrid[0].gridElement.getContent().shortTitle).toEqual('Re');
			expect(testGrid[0].gridElement.getContent().displayColor).toEqual('#FFFFFF');
		});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', getLearnroomMock('referenceId')),
					},
				],
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
			const movedElement = GridElement.FromPersistedReference('tomove', getLearnroomMock('ref02'));
			const targetElement = GridElement.FromPersistedReference('target', getLearnroomMock('ref01'));
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
			const element = GridElement.FromPersistedGroup('target', 'grouptitle', [
				getLearnroomMock('ref01'),
				getLearnroomMock('ref02'),
				getLearnroomMock('ref03'),
			]);
			const dashboard = new DashboardEntity('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: element }],
				userId: 'userId',
			});
			const spy = jest.spyOn(element, 'removeReferenceByIndex');
			dashboard.moveElement({ x: 1, y: 2, groupIndex: 1 }, { x: 3, y: 3 });
			expect(spy).toHaveBeenCalledWith(1);
			expect(dashboard.getGrid().length).toEqual(2);
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const dashboard = new DashboardEntity('someid', {
				colums: 3,
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'title', [getLearnroomMock('referenceId')]),
					},
				],
				userId: 'userId',
			});
			const callMove = () => dashboard.moveElement({ x: 0, y: 2 }, { x: 4, y: 3 });
			expect(callMove).toThrow(BadRequestException);
		});
	});

	describe('getElement', () => {
		it('getElement should return correct value', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', getLearnroomMock('referenceId')),
					},
				],
				userId: 'userId',
			});
			const testElement = dashboard.getElement({ x: 0, y: 2 });
			const result = testElement.getContent();
			expect(testElement).toHaveProperty('getId');
			expect(testElement).toHaveProperty('getContent');
			expect(testElement).toHaveProperty('isGroup');
			expect(testElement).toHaveProperty('getReferences');
			expect(testElement).toHaveProperty('addReferences');
			expect(testElement).toHaveProperty('setGroupName');
			expect(result.referencedId).toEqual('referenceId');
			expect(result.title).toEqual('Reference');
			expect(result.shortTitle).toEqual('Re');
			expect(result.displayColor).toEqual('#FFFFFF');
		});

		it('when no element at request position, it should throw notFound', () => {
			const dashboard = new DashboardEntity('someid', { grid: [], userId: 'userId' });
			const callGetElement = () => dashboard.getElement({ x: 0, y: 2 });
			expect(callGetElement).toThrow(NotFoundException);
		});
	});

	describe('setLearnrooms', () => {
		it('should add any passed rooms that are not on the dashboard yet', () => {
			const dashboard = new DashboardEntity('someid', {
				grid: [],
				userId: 'userId',
			});

			dashboard.setLearnRooms([getLearnroomMock('first'), getLearnroomMock('second')]);

			expect(dashboard.getGrid().length).toEqual(2);
		});

		it('should put new elements into first available positions', () => {
			const existingRoom = getLearnroomMock('referenceId');
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 0, y: 0 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'Mathe 3d', [existingRoom]),
					},
				],
				userId: 'userId',
			});

			dashboard.setLearnRooms([getLearnroomMock('first'), existingRoom]);

			expect(dashboard.getGrid().length).toEqual(2);
			expect(dashboard.getGrid()[1].pos).toEqual({ x: 1, y: 0 });
		});

		it('should not change any received rooms that are already on the board', () => {
			const room = getLearnroomMock('referenceId');
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'Mathe 3d', [room]),
					},
				],
				userId: 'userId',
			});

			dashboard.setLearnRooms([room]);

			expect(dashboard.getGrid().length).toEqual(1);
			expect(dashboard.getGrid()[0].gridElement.getReferences()[0].getMetadata().id).toEqual('referenceId');
			expect(dashboard.getGrid()[0].pos).toEqual({ x: 0, y: 2 });
		});

		it('should remove any rooms that are on the dashboard, but not in the received list', () => {
			const room = getLearnroomMock('referenceId');
			const dashboard = new DashboardEntity('someid', {
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedGroup('groupId', 'grouptitle', [
							room,
							getLearnroomMock('toBeRemoved'),
						]),
					},
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedReference('singleElement', getLearnroomMock('alsoToBeRemoved')),
					},
				],
				userId: 'userId',
			});

			dashboard.setLearnRooms([room]);

			expect(dashboard.getGrid().length).toEqual(1);
			expect(dashboard.getGrid()[0].gridElement.getReferences().length).toEqual(1);
		});
	});
});
