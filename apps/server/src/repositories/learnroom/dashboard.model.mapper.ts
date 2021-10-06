import { Collection, wrap } from '@mikro-orm/core';
import { DashboardEntity, GridElement, GridElementWithPosition, DefaultGridReference } from '@shared/domain';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

export class DashboardModelMapper {
	static mapGridElementToModel(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity
	): DashboardGridElementModel {
		const model = new DashboardGridElementModel(elementWithPosition.gridElement.getId());
		model.xPos = elementWithPosition.pos.x;
		model.yPos = elementWithPosition.pos.y;
		// model.reference = new DefaultGridReference(gridElement.getMetadata().title); // should be replaced with model reference
		const reference = new DefaultGridReferenceModel(elementWithPosition.gridElement.getMetadata().id);
		reference.color = elementWithPosition.gridElement.getMetadata().displayColor;
		reference.title = elementWithPosition.gridElement.getMetadata().title;
		model.reference = wrap(reference).toReference();

		model.dashboard = wrap(dashboard).toReference();
		return model;
	}

	static async mapToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		await modelEntity.gridElements.init();
		const grid: GridElementWithPosition[] = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => {
				const loaded = await e.reference.load();
				const result = {
					pos: { x: e.xPos, y: e.yPos },
					gridElement: new GridElement(e.id, new DefaultGridReference(loaded.id, loaded.title, loaded.color)),
				};
				return result;
			})
		);
		return new DashboardEntity(modelEntity.id, { grid });
	}

	static mapToModel(entity: DashboardEntity): DashboardModelEntity {
		const modelEntity = new DashboardModelEntity(entity.getId());
		modelEntity.gridElements = new Collection<DashboardGridElementModel>(
			modelEntity,
			entity
				.getGrid()
				.map((elementWithPosition) => DashboardModelMapper.mapGridElementToModel(elementWithPosition, modelEntity))
		);
		return modelEntity;
	}
}
