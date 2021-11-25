import { wrap, EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import {
	DashboardEntity,
	GridElement,
	IGridElement,
	GridElementWithPosition,
	DefaultGridReference,
	IGridElementReference,
	DashboardGridElementModel,
	DashboardModelEntity,
	DefaultGridReferenceModel,
} from '@shared/domain';

@Injectable()
export class DashboardModelMapper {
	constructor(protected readonly em: EntityManager) {}

	mapReferenceToEntity(modelEntity: DefaultGridReferenceModel): DefaultGridReference {
		return new DefaultGridReference(modelEntity.id, modelEntity.title, modelEntity.color);
	}

	async mapElementToEntity(modelEntity: DashboardGridElementModel): Promise<GridElementWithPosition> {
		const referenceModels = await modelEntity.references.loadItems();
		const references = referenceModels.map((ref) => this.mapReferenceToEntity(ref));
		const result = {
			pos: { x: modelEntity.xPos, y: modelEntity.yPos },
			gridElement: GridElement.FromPersistedGroup(modelEntity.id, modelEntity.title, references),
		};
		return result;
	}

	async mapDashboardToEntity(modelEntity: DashboardModelEntity): Promise<DashboardEntity> {
		if (!modelEntity.gridElements.isInitialized()) {
			await modelEntity.gridElements.init();
		}
		const grid = await Promise.all(
			Array.from(modelEntity.gridElements).map(async (e) => {
				return this.mapElementToEntity(e);
			})
		);
		return new DashboardEntity(modelEntity.id, { grid, userId: modelEntity.user.id });
	}

	async mapReferenceToModel(reference: IGridElementReference): Promise<DefaultGridReferenceModel> {
		const metadata = reference.getMetadata();
		const existingReference = await this.em.findOne(DefaultGridReferenceModel, metadata.id);
		const result = existingReference || new DefaultGridReferenceModel(metadata.id);
		result.color = metadata.displayColor;
		result.title = metadata.title;
		return result;
	}

	private async instantiateGridElementModel(gridElement: IGridElement): Promise<DashboardGridElementModel> {
		if (!gridElement.hasId()) {
			return new DashboardGridElementModel();
		}
		const existing = await this.em.findOne(DashboardGridElementModel, gridElement.getId());
		return existing || new DashboardGridElementModel(gridElement.getId());
	}

	async mapGridElementToModel(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity
	): Promise<DashboardGridElementModel> {
		const { gridElement } = elementWithPosition;
		const elementModel = await this.instantiateGridElementModel(gridElement);
		elementModel.xPos = elementWithPosition.pos.x;
		elementModel.yPos = elementWithPosition.pos.y;

		if (gridElement.isGroup()) {
			elementModel.title = gridElement.getContent().title;
		}

		const references = await Promise.all(gridElement.getReferences().map((ref) => this.mapReferenceToModel(ref)));
		elementModel.references.set(references);

		elementModel.dashboard = wrap(dashboard).toReference();
		return elementModel;
	}

	async mapDashboardToModel(entity: DashboardEntity): Promise<DashboardModelEntity> {
		const existing = await this.em.findOne(DashboardModelEntity, entity.getId());
		const modelEntity = existing || new DashboardModelEntity({ id: entity.getId(), user: entity.getUserId() });
		const mappedElements = await Promise.all(
			entity.getGrid().map((elementWithPosition) => this.mapGridElementToModel(elementWithPosition, modelEntity))
		);

		Array.from(modelEntity.gridElements).forEach((el) => {
			if (!mappedElements.includes(el)) {
				modelEntity.gridElements.remove(el);
				this.em.remove(el);
			}
		});

		return modelEntity;
	}
}
