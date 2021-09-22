import { ObjectId } from '@mikro-orm/mongodb';
import { DashboardEntity } from '../../entities/learnroom/dashboard.entity';
import { DashboardModelEntity, DashboardGridElementModel, mapToEntity, mapToModel } from './dashboard.model.entity';

describe('Dashboard Model Entity', () => {
	describe('mapToModel', () => {
		it('transforms plain entity into modelEntity', () => {
			const id = new ObjectId();
			const entity = new DashboardEntity(id.toString(), { grid: [] });

			const result = mapToModel(entity);

			expect(result instanceof DashboardModelEntity).toEqual(true);
			expect(result._id).toEqual(id);
			expect(result.gridElements.length).toEqual(0);
		});
	});
});
