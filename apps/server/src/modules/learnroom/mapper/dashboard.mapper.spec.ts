import { DashboardEntity, GridElement, DefaultGridReference } from '@shared/domain';
import { DashboardMapper } from './dashboard.mapper';
import { DashboardResponse } from '../controller/dto';

describe('dashboard mapper', () => {
	it('should map the required properties correctly', () => {
		const gridArray: GridElement[] = [
			new GridElement('id', 1, 2, new DefaultGridReference('referenceid', 'exampletitle')),
		];
		const entity = new DashboardEntity('someid', { grid: gridArray });
		const result = DashboardMapper.mapToResponse(entity);
		expect(result instanceof DashboardResponse).toEqual(true);
		expect(result.gridElements[0].xPosition).toEqual(1);
		expect(result.gridElements[0].yPosition).toEqual(2);
		expect(result.gridElements[0].title).toEqual('exampletitle');
		expect(result.gridElements[0].shortTitle).toEqual('ex');
	});
});
