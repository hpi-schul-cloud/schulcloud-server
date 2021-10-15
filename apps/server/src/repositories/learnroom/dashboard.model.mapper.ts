import { Collection, wrap, EntityManager } from '@mikro-orm/core';
import {
	DashboardEntity,
	GridElement,
	GridElementWithPosition,
	DefaultGridReference,
	IGridElementReference,
} from '@shared/domain';
import { DashboardGridElementModel, DashboardModelEntity, DefaultGridReferenceModel } from './dashboard.model.entity';

export class DashboardModelMapper {
	static mapReferenceToEntity(modelEntity: DefaultGridReferenceModel): DefaultGridReference {
		return new DefaultGridReference(modelEntity.id, modelEntity.title, modelEntity.color);
	}

	static async mapElementToEntity(modelEntity: DashboardGridElementModel): Promise<GridElementWithPosition> {
		await modelEntity.references.init();
		const references = Array.from(modelEntity.references).map((ref) => DashboardModelMapper.mapReferenceToEntity(ref));
		const result = {
			pos: { x: modelEntity.xPos, y: modelEntity.yPos },
			gridElement: GridElement.FromReferenceGroup(modelEntity.id, references),
		};
		return result;
	}

	static async mapToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		await modelEntity.gridElements.init();
		const grid: GridElementWithPosition[] = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => DashboardModelMapper.mapElementToEntity(e))
		);
		return new DashboardEntity(modelEntity.id, { grid });
	}

	static async mapReferenceToModel(
		reference: IGridElementReference,
		element: DashboardGridElementModel,
		em: EntityManager
	): Promise<DefaultGridReferenceModel> {
		const metadata = reference.getMetadata();
		const existingReference = await em.findOne(DefaultGridReferenceModel, metadata.id);
		const result = existingReference || new DefaultGridReferenceModel(metadata.id);
		result.color = metadata.displayColor;
		result.title = metadata.title;
		result.gridelement = wrap(element).toReference();
		return result;
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

		const references = await Promise.all(
			elementWithPosition.gridElement
				.getReferences()
				.map((ref) => DashboardModelMapper.mapReferenceToModel(ref, elementModel, em))
		);
		elementModel.references = new Collection<DefaultGridReferenceModel>(elementModel, references);

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
