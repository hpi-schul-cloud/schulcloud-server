import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { setupEntities } from '@testing/database';
import { DashboardResponse } from '../controller/dto';
import { Dashboard, GridElement, GridElementWithPosition } from '../domain/do/dashboard';
import { DashboardMapper } from './dashboard.mapper';

describe('dashboard mapper', () => {
	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	it('should map the required properties correctly', () => {
		const mock = courseEntityFactory.buildWithId({ name: 'Mathe' });
		const gridArray: GridElementWithPosition[] = [
			{
				pos: { x: 1, y: 3 },
				gridElement: GridElement.FromPersistedReference('elementId', mock),
			},
			{
				pos: { x: 2, y: 3 },
				gridElement: GridElement.FromPersistedGroup('groupId', 'groupTitle', [
					courseEntityFactory.buildWithId({ name: 'English' }),
					courseEntityFactory.buildWithId({ name: 'Deutsch' }),
				]),
			},
		];
		const entity = new Dashboard('someid', { grid: gridArray, userId: 'userId' });
		const result = DashboardMapper.mapToResponse(entity);
		expect(result instanceof DashboardResponse).toEqual(true);
		expect(result.gridElements[0].id).toEqual(mock.getMetadata().id);
		expect(result.gridElements[0].xPosition).toEqual(1);
		expect(result.gridElements[0].yPosition).toEqual(3);
		expect(result.gridElements[0].title).toEqual(mock.getMetadata().title);
		expect(result.gridElements[0].shortTitle).toEqual(mock.getMetadata().shortTitle);
		expect(result.gridElements[1].groupId).toEqual('groupId');
		expect(result.gridElements[1].title).toEqual('groupTitle');
	});
});
