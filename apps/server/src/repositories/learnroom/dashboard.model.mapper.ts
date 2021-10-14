import { Collection, wrap, EntityManager } from '@mikro-orm/core';
import { DashboardEntity, GridElement, GridElementWithPosition, DefaultGridReference } from '@shared/domain';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

export class DashboardModelMapper {
	static async mapToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		await modelEntity.gridElements.init();
		const grid: GridElementWithPosition[] = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => {
				await e.references.init();
				const references = Array.from(e.references).map(
					(ref) => new DefaultGridReference(ref.id, ref.title, ref.color)
				);
				const result = {
					pos: { x: e.xPos, y: e.yPos },
					gridElement: GridElement.FromReferenceGroup(e.id, references),
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
		const elementModel = existing || new DashboardGridElementModel(elementWithPosition.gridElement.getId());
		elementModel.xPos = elementWithPosition.pos.x;
		elementModel.yPos = elementWithPosition.pos.y;

		const elementContent = elementWithPosition.gridElement.getContent();

		if (elementContent.referencedId) {
			const existingReference = await em.findOne(DefaultGridReferenceModel, elementContent.referencedId);
			const reference = existingReference || new DefaultGridReferenceModel(elementContent.referencedId);
			reference.color = elementContent.displayColor;
			reference.title = elementContent.title;
			reference.gridelement = wrap(elementModel).toReference();
			elementModel.references = new Collection<DefaultGridReferenceModel>(elementModel, [reference]);
		} else if (elementContent.group) {
			const referenceArray = await Promise.all(
				elementContent.group.map(async (groupElement) => {
					const existingReference = await em.findOne(DefaultGridReferenceModel, groupElement.id);
					const reference = existingReference || new DefaultGridReferenceModel(groupElement.id);
					reference.color = groupElement.displayColor;
					reference.title = groupElement.title;
					reference.gridelement = wrap(elementModel).toReference();
					return reference;
				})
			);
			elementModel.references = new Collection<DefaultGridReferenceModel>(elementModel, referenceArray);
		}

		elementModel.dashboard = wrap(dashboard).toReference();
		return elementModel;
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
