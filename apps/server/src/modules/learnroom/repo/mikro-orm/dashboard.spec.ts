import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { Dashboard, GridElement } from '../../domain/do/dashboard';

describe('dashboard entity', () => {
	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	describe('constructor', () => {
		it('should create dashboard with prefilled Grid', () => {
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'title', [
							courseEntityFactory.buildWithId({ name: 'Mathe' }),
						]),
					},
				],
				userId: 'userId',
			});

			expect(dashboard instanceof Dashboard).toEqual(true);
		});

		it('should create dashboard when passing empty grid', () => {
			const dashboard = new Dashboard('someid', { grid: [], userId: 'userId' });

			expect(dashboard instanceof Dashboard).toEqual(true);
		});
	});

	describe('getUserId', () => {
		it('should return the owners userId', () => {
			const userId = 'userId';
			const dashboard = new Dashboard('someid', { grid: [], userId });
			const result = dashboard.getUserId();
			expect(result).toEqual(userId);
		});
	});

	describe('getGrid', () => {
		it('getGrid should return correct value', () => {
			const dashboard = new Dashboard('someid', { grid: [], userId: 'userId' });
			const testGrid = dashboard.getGrid();
			expect(Array.isArray(testGrid)).toEqual(true);
		});

		it('when testGrid contains element, getGrid should return that element', () => {
			const mock = courseEntityFactory.buildWithId({ name: 'Mathe' });
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', mock),
					},
				],
				userId: 'userId',
			});
			const testGrid = dashboard.getGrid();

			expect(testGrid[0].gridElement.getContent().referencedId).toEqual(mock.getMetadata().id);
			expect(testGrid[0].gridElement.getContent().title).toEqual(mock.getMetadata().title);
			expect(testGrid[0].gridElement.getContent().shortTitle).toEqual(mock.getMetadata().shortTitle);
			expect(testGrid[0].gridElement.getContent().displayColor).toEqual(mock.getMetadata().displayColor);
		});
	});

	describe('moveElement', () => {
		it('should move existing element to a new position', () => {
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							'elementId',
							courseEntityFactory.buildWithId({ name: 'Mathe' })
						),
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
			const dashboard = new Dashboard('someid', { grid: [], userId: 'userId' });
			const callMove = () => dashboard.moveElement({ x: 4, y: 2 }, { x: 3, y: 2 });
			expect(callMove).toThrow(NotFoundException);
		});

		it('when the new position is taken, it should merge the elements into a group', () => {
			const movedElement = GridElement.FromPersistedReference(
				'tomove',
				courseEntityFactory.buildWithId({ name: 'Mathe' })
			);
			const targetElement = GridElement.FromPersistedReference(
				'target',
				courseEntityFactory.buildWithId({ name: 'Mathe' })
			);
			const dashboard = new Dashboard('someid', {
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
				courseEntityFactory.buildWithId({ name: 'Mathe' }),
				courseEntityFactory.buildWithId({ name: 'Mathe1' }),
				courseEntityFactory.buildWithId({ name: 'Mathe2' }),
			]);
			const dashboard = new Dashboard('someid', {
				grid: [{ pos: { x: 1, y: 2 }, gridElement: element }],
				userId: 'userId',
			});
			const spy = jest.spyOn(element, 'removeReferenceByIndex');
			dashboard.moveElement({ x: 1, y: 2, groupIndex: 1 }, { x: 3, y: 3 });
			expect(spy).toHaveBeenCalledWith(1);
			expect(dashboard.getGrid().length).toEqual(2);
		});

		it('when the new position is out of bounds, it should throw badrequest', () => {
			const dashboard = new Dashboard('someid', {
				colums: 3,
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'title', [
							courseEntityFactory.buildWithId({ name: 'Mathe' }),
						]),
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
			const mock = courseEntityFactory.buildWithId({ name: 'Mathe' });
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', mock),
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
			expect(result.referencedId).toEqual(mock.getMetadata().id);
			expect(result.title).toEqual(mock.getMetadata().title);
			expect(result.shortTitle).toEqual(mock.getMetadata().shortTitle);
			expect(result.displayColor).toEqual(mock.getMetadata().displayColor);
		});

		it('when no element at request position, it should throw notFound', () => {
			const dashboard = new Dashboard('someid', { grid: [], userId: 'userId' });
			const callGetElement = () => dashboard.getElement({ x: 0, y: 2 });
			expect(callGetElement).toThrow(NotFoundException);
		});
	});

	describe('setLearnrooms', () => {
		it('should add any passed rooms that are not on the dashboard yet', () => {
			const dashboard = new Dashboard('someid', {
				grid: [],
				userId: 'userId',
			});

			dashboard.setLearnRooms([
				courseEntityFactory.buildWithId({ name: 'Mathe' }),
				courseEntityFactory.buildWithId({ name: 'Mathe1' }),
			]);

			expect(dashboard.getGrid().length).toEqual(2);
		});

		it('should put new elements into first available positions', () => {
			const existingRoom = courseEntityFactory.buildWithId({ name: 'Mathe' });
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 0, y: 0 },
						gridElement: GridElement.FromPersistedGroup('elementId', 'Mathe 3d', [existingRoom]),
					},
				],
				userId: 'userId',
			});

			dashboard.setLearnRooms([courseEntityFactory.buildWithId(), existingRoom]);

			expect(dashboard.getGrid().length).toEqual(2);
			expect(dashboard.getGrid()[1].pos).toEqual({ x: 1, y: 0 });
		});

		it('should not change any received rooms that are already on the board', () => {
			const id = new ObjectId();
			const room = courseEntityFactory.buildWithId({ name: 'Mathe' }, id.toHexString());
			const dashboard = new Dashboard('someid', {
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
			expect(dashboard.getGrid()[0].gridElement.getReferences()[0].getMetadata().id).toEqual(id.toHexString());
			expect(dashboard.getGrid()[0].pos).toEqual({ x: 0, y: 2 });
		});

		it('should remove any rooms that are on the dashboard, but not in the received list', () => {
			const room = courseEntityFactory.buildWithId({ name: 'Mathe' });
			const dashboard = new Dashboard('someid', {
				grid: [
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedGroup('groupId', 'grouptitle', [
							room,
							courseEntityFactory.buildWithId({ name: 'Mathe' }),
						]),
					},
					{
						pos: { x: 0, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							'singleElement',
							courseEntityFactory.buildWithId({ name: 'Mathe' })
						),
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
