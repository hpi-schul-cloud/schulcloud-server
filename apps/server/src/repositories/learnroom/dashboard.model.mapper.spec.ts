import { ObjectId } from '@mikro-orm/mongodb';
import { DashboardEntity } from '@shared/domain';
import { DashboardModelEntity } from './dashboard.model.entity';
import { DashboardModelMapper } from './dashboard.model.mapper';

describe('Dashboard Model Entity Mapper', () => {
	describe('mapToModel', () => {
		it('transforms plain entity into modelEntity', () => {
			const id = new ObjectId();
			const entity = new DashboardEntity(id.toString(), { grid: [] });

			const result = DashboardModelMapper.mapToModel(entity);

			expect(result instanceof DashboardModelEntity).toEqual(true);
			expect(result._id).toEqual(id);
			expect(result.gridElements.length).toEqual(0);
		});
	});
});
