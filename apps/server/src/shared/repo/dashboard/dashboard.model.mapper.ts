import { wrap, EntityManager } from '@mikro-orm/core';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	DashboardEntity,
	GridElement,
	GridElementWithPosition,
	ILearnroom,
	LearnroomTypes,
	DashboardGridElementModel,
	DashboardModelEntity,
	Course,
	User,
} from '@shared/domain';

@Injectable()
export class DashboardModelMapper {
	constructor(protected readonly em: EntityManager) {}

	async mapReferenceToEntity(modelEntity: Course): Promise<Course> {
		const domainEntity = await wrap(modelEntity).init();
		return domainEntity;
	}

	async mapElementToEntity(modelEntity: DashboardGridElementModel): Promise<GridElementWithPosition> {
		const referenceModels = await modelEntity.references.loadItems();
		const references = await Promise.all(referenceModels.map((ref) => this.mapReferenceToEntity(ref)));
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
		const grid = await Promise.all(Array.from(modelEntity.gridElements).map(async (e) => this.mapElementToEntity(e)));
		return new DashboardEntity(modelEntity.id, { grid, userId: modelEntity.user.id });
	}

	mapReferenceToModel(reference: ILearnroom): Course {
		const metadata = reference.getMetadata();
		if (metadata.type === LearnroomTypes.Course) {
			const course = reference as Course;
			return course;
		}
		throw new InternalServerErrorException('unknown learnroom type');
	}

	async mapGridElementToModel(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity
	): Promise<DashboardGridElementModel> {
		const existing = await this.findExistingGridElement(elementWithPosition);
		if (existing) {
			const updatedModel = this.updateExistingGridElement(existing, elementWithPosition, dashboard);
			return updatedModel;
		}
		const createdModel = await this.createGridElement(elementWithPosition, dashboard);
		return createdModel;
	}

	private async findExistingGridElement(
		elementWithPosition: GridElementWithPosition
	): Promise<DashboardGridElementModel | undefined> {
		const { gridElement } = elementWithPosition;
		if (gridElement.hasId()) {
			const existing = await this.em.findOne(DashboardGridElementModel, gridElement.getId() as string);
			if (existing) return existing;
		}
		return undefined;
	}

	private async updateExistingGridElement(
		elementModel: DashboardGridElementModel,
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity
	): Promise<DashboardGridElementModel> {
		elementModel.xPos = elementWithPosition.pos.x;
		elementModel.yPos = elementWithPosition.pos.y;
		const { gridElement } = elementWithPosition;

		if (gridElement.isGroup()) {
			elementModel.title = gridElement.getContent().title;
		}

		const references = await Promise.all(gridElement.getReferences().map((ref) => this.mapReferenceToModel(ref)));
		elementModel.references.set(references);

		elementModel.dashboard = wrap(dashboard).toReference();
		return elementModel;
	}

	private async createGridElement(
		elementWithPosition: GridElementWithPosition,
		dashboard: DashboardModelEntity
	): Promise<DashboardGridElementModel> {
		const { gridElement } = elementWithPosition;
		const references = await Promise.all(gridElement.getReferences().map((ref) => this.mapReferenceToModel(ref)));
		const elementModel = new DashboardGridElementModel({
			id: gridElement.getId(),
			xPos: elementWithPosition.pos.x,
			yPos: elementWithPosition.pos.y,
			references,
			dashboard,
		});

		return elementModel;
	}

	async mapDashboardToModel(entity: DashboardEntity): Promise<DashboardModelEntity> {
		const modelEntity = await this.getOrConstructDashboardModelEntity(entity);
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

	private async getOrConstructDashboardModelEntity(entity: DashboardEntity): Promise<DashboardModelEntity> {
		const existing = await this.em.findOne(DashboardModelEntity, entity.getId());
		if (existing) {
			return existing;
		}
		const user = await this.em.findOneOrFail(User, entity.getUserId());
		return new DashboardModelEntity({ id: entity.getId(), user, gridElements: [] });
	}
}
