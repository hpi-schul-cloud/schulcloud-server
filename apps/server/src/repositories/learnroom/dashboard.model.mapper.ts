import { Collection, wrap } from '@mikro-orm/core';
import {
	DashboardEntity,
	GridElement,
	IGridElement,
	DefaultGridReference,
} from '../../entities/learnroom/dashboard.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';

export class DashboardModelMapper {
	static mapGridElementToModel(gridElement: IGridElement, dashboard: DashboardModelEntity): DashboardGridElementModel {
		const model = new DashboardGridElementModel(gridElement.getId());
		model.xPos = gridElement.getPosition().x;
		model.yPos = gridElement.getPosition().y;
		model.reference = new DefaultGridReference(gridElement.getMetadata().title); // should be replaced with model reference
		model.dashboard = wrap(dashboard).toReference();
		return model;
	}

	static mapToEntity(modelEntity: DashboardModelEntity): DashboardEntity {
		const grid: GridElement[] = Array.from(modelEntity.gridElements).map(
			(e) => new GridElement(e.id, e.xPos, e.yPos, e.reference)
		);
		return new DashboardEntity(modelEntity.id, { grid });
	}

	static mapToModel(entity: DashboardEntity): DashboardModelEntity {
		const modelEntity = new DashboardModelEntity(entity.getId());
		modelEntity.gridElements = new Collection<DashboardGridElementModel>(
			modelEntity,
			entity.grid.map((element) => DashboardModelMapper.mapGridElementToModel(element, modelEntity))
		);
		return modelEntity;
	}
}
