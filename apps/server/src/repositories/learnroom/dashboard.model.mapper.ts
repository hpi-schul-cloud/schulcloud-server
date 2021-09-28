import { Collection, wrap } from '@mikro-orm/core';
import { DashboardEntity, GridElement, IGridElement, DefaultGridReference } from '@shared/domain';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

export class DashboardModelMapper {
	static mapGridElementToModel(gridElement: IGridElement, dashboard: DashboardModelEntity): DashboardGridElementModel {
		const model = new DashboardGridElementModel(gridElement.getId());
		model.xPos = gridElement.getPosition().x;
		model.yPos = gridElement.getPosition().y;
		// model.reference = new DefaultGridReference(gridElement.getMetadata().title); // should be replaced with model reference
		const reference = new DefaultGridReferenceModel(gridElement.getMetadata().id);
		reference.color = gridElement.getMetadata().displayColor;
		reference.title = gridElement.getMetadata().title;
		model.reference = wrap(reference).toReference();

		model.dashboard = wrap(dashboard).toReference();
		return model;
	}

	static async mapToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		await modelEntity.gridElements.init();
		const grid: GridElement[] = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => {
				const loaded = await e.reference.load();
				return new GridElement(e.id, e.xPos, e.yPos, new DefaultGridReference(loaded.id, loaded.title, loaded.color));
			})
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
