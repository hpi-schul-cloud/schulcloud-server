import { Collection, wrap, EntityManager } from '@mikro-orm/core';
import {
	DashboardEntity,
	GridElement,
	IGridElement,
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
		if (!modelEntity.references.isInitialized()) {
			await modelEntity.references.init();
		}
		const references = Array.from(modelEntity.references).map((ref) => DashboardModelMapper.mapReferenceToEntity(ref));
		const result = {
			pos: { x: modelEntity.xPos, y: modelEntity.yPos },
			gridElement: GridElement.FromPersistedGroup(modelEntity.id, modelEntity.title, references),
		};
		return result;
	}

	static async mapDashboardToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		if (!modelEntity.gridElements.isInitialized()) {
			await modelEntity.gridElements.init();
		}
		const grid = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => {
				return DashboardModelMapper.mapElementToEntity(e);
			})
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

	private static async instantiateGridElementModel(
		gridElement: IGridElement,
		em: EntityManager
	): Promise<DashboardGridElementModel> {
		if (!gridElement.hasId()) {
			return new DashboardGridElementModel();
		}
		const existing = await em.findOne(DashboardGridElementModel, gridElement.getId());
		return existing || new DashboardGridElementModel(gridElement.getId());
	}

	static async mapGridElementToModel(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity,
		em: EntityManager
	): Promise<DashboardGridElementModel> {
		const { gridElement } = elementWithPosition;
		const elementModel = await DashboardModelMapper.instantiateGridElementModel(gridElement, em);
		elementModel.xPos = elementWithPosition.pos.x;
		elementModel.yPos = elementWithPosition.pos.y;

		if (gridElement.isGroup()) {
			elementModel.title = gridElement.getContent().title;
		}

		const references = await Promise.all(
			gridElement.getReferences().map((ref) => DashboardModelMapper.mapReferenceToModel(ref, elementModel, em))
		);
		elementModel.references = new Collection<DefaultGridReferenceModel>(elementModel, references);

		elementModel.dashboard = wrap(dashboard).toReference();
		return elementModel;
	}

	static async mapDashboardToModel(entity: DashboardEntity, em: EntityManager): Promise<DashboardModelEntity> {
		const existing = await em.findOne(DashboardModelEntity, entity.getId());
		const modelEntity = existing || new DashboardModelEntity(entity.getId());
		const mappedElements = await Promise.all(
			entity
				.getGrid()
				.map((elementWithPosition) => DashboardModelMapper.mapGridElementToModel(elementWithPosition, modelEntity, em))
		);

		if (!modelEntity.gridElements.isInitialized()) {
			await modelEntity.gridElements.init();
		}

		Array.from(modelEntity.gridElements).forEach((el) => {
			if (!mappedElements.includes(el)) {
				modelEntity.gridElements.remove(el);
				em.remove(el);
			}
		});

		mappedElements.forEach((el) => {
			if (!modelEntity.gridElements.contains(el)) {
				modelEntity.gridElements.add(el);
			}
		});

		return modelEntity;
	}
}
