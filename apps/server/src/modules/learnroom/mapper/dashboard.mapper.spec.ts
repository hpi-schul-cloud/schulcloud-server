import {
	DashboardEntity,
	GridElement,
	GridElementWithPosition,
	LearnroomMetadata,
	LearnroomTypes,
} from '@shared/domain';
import { DashboardMapper } from './dashboard.mapper';
import { DashboardResponse } from '../controller/dto';

const learnroomMock = (id: string, name: string) => {
	return {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
			};
		},
	};
};

describe('dashboard mapper', () => {
	it('should map the required properties correctly', () => {
		const gridArray: GridElementWithPosition[] = [
			{
				pos: { x: 1, y: 3 },
				gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
			},
		];
		const entity = new DashboardEntity('someid', { grid: gridArray, userId: 'userId' });
		const result = DashboardMapper.mapToResponse(entity);
		expect(result instanceof DashboardResponse).toEqual(true);
		expect(result.gridElements[0].id).toEqual('elementId');
		expect(result.gridElements[0].xPosition).toEqual(1);
		expect(result.gridElements[0].yPosition).toEqual(3);
		expect(result.gridElements[0].title).toEqual('Mathe');
		expect(result.gridElements[0].shortTitle).toEqual('Ma');
	});
});
