import { DashboardEntity, GridElement, GridElementWithPosition } from '@shared/domain/entity';
import { LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { DashboardResponse } from '../controller/dto';
import { DashboardMapper } from './dashboard.mapper';

const learnroomMock = (id: string, name: string) => {
	const mock = {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
				isSynchronized: false,
			};
		},
	};
	return mock;
};

describe('dashboard mapper', () => {
	it('should map the required properties correctly', () => {
		const gridArray: GridElementWithPosition[] = [
			{
				pos: { x: 1, y: 3 },
				gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
			},
			{
				pos: { x: 2, y: 3 },
				gridElement: GridElement.FromPersistedGroup('groupId', 'groupTitle', [
					learnroomMock('anotherReferenceId', 'Englisch'),
					learnroomMock('additionalReferenceId', 'Deutsch'),
				]),
			},
		];
		const entity = new DashboardEntity('someid', { grid: gridArray, userId: 'userId' });
		const result = DashboardMapper.mapToResponse(entity);
		expect(result instanceof DashboardResponse).toEqual(true);
		expect(result.gridElements[0].id).toEqual('referenceId');
		expect(result.gridElements[0].xPosition).toEqual(1);
		expect(result.gridElements[0].yPosition).toEqual(3);
		expect(result.gridElements[0].title).toEqual('Mathe');
		expect(result.gridElements[0].shortTitle).toEqual('Ma');
		expect(result.gridElements[1].groupId).toEqual('groupId');
		expect(result.gridElements[1].title).toEqual('groupTitle');
	});
});
