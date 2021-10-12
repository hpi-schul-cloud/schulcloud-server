import { DashboardEntity, GridElement, GridElementWithPosition, DefaultGridReference } from '@shared/domain';
import { DashboardMapper } from './dashboard.mapper';
import { DashboardResponse } from '../controller/dto';

describe('dashboard mapper', () => {
	it('should map the required properties correctly', () => {
		const gridArray: GridElementWithPosition[] = [
			{
				pos: { x: 1, y: 3 },
				gridElement: new GridElement('elementId', new DefaultGridReference('referenceId', 'Mathe')),
			},
		];
		const entity = new DashboardEntity('someid', { grid: gridArray });
		const result = DashboardMapper.mapToResponse(entity);
		expect(result instanceof DashboardResponse).toEqual(true);
		expect(result.gridElements[0].xPosition).toEqual(1);
		expect(result.gridElements[0].yPosition).toEqual(3);
		expect(result.gridElements[0].title).toEqual('Mathe');
		expect(result.gridElements[0].shortTitle).toEqual('Ma');
	});
});
