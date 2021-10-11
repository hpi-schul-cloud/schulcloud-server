import { Collection, wrap, EntityManager } from '@mikro-orm/core';
import { DashboardEntity, GridElement, GridElementWithPosition, DefaultGridReference } from '@shared/domain';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

export class DashboardModelMapper {
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

	static async mapGridElementToModel(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity,
		em: EntityManager
	): Promise<DashboardGridElementModel> {
		const existing = await em.findOne(DashboardGridElementModel, elementWithPosition.gridElement.getId());
		const model = existing || new DashboardGridElementModel(elementWithPosition.gridElement.getId());
		model.xPos = elementWithPosition.pos.x;
		model.yPos = elementWithPosition.pos.y;

		const existingReference = await em.findOne(
			DefaultGridReferenceModel,
			elementWithPosition.gridElement.getMetadata().id
		);
		const reference =
			existingReference || new DefaultGridReferenceModel(elementWithPosition.gridElement.getMetadata().id);
		reference.color = elementWithPosition.gridElement.getMetadata().displayColor;
		reference.title = elementWithPosition.gridElement.getMetadata().title;
		model.reference = wrap(reference).toReference();

		model.dashboard = wrap(dashboard).toReference();
		return model;
	}

	static async mapToModel(entity: DashboardEntity, em: EntityManager): Promise<DashboardModelEntity> {
		const existing = await em.findOne(DashboardModelEntity, entity.getId());
		const modelEntity = existing || new DashboardModelEntity(entity.getId());
		const mappedElements = await Promise.all(
			entity
				.getGrid()
				.map((elementWithPosition) => DashboardModelMapper.mapGridElementToModel(elementWithPosition, modelEntity, em))
		);

		modelEntity.gridElements = new Collection<DashboardGridElementModel>(modelEntity, mappedElements);

		return modelEntity;
	}
}
