import { Entity, Property, ManyToOne, OneToMany, Collection, IdentifiedReference, wrap } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '../../shared/domain';
import {
	DashboardEntity,
	GridElement,
	IGridElement,
	DefaultGridReference,
} from '../../entities/learnroom/dashboard.entity';

@Entity()
export class DashboardGridElementModel extends BaseEntityWithTimestamps {
	constructor(id: string) {
		super();
		this._id = ObjectId.createFromHexString(id);
		this.id = id;
	}

	@Property()
	xPos: number;

	@Property()
	yPos: number;

	// todo: put in references to useful things like courses via polymorphic inheritance (see news)
	reference: DefaultGridReference = new DefaultGridReference('testcourse');

	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	dashboard: IdentifiedReference<DashboardModelEntity>;
}

@Entity()
export class DashboardModelEntity extends BaseEntityWithTimestamps {
	constructor(id: string) {
		super();
		this._id = ObjectId.createFromHexString(id);
		this.id = id;
	}

	@OneToMany('DashboardGridElementModel', 'dashboard')
	gridElements: Collection<DashboardGridElementModel> = new Collection<DashboardGridElementModel>(this);

	// userId

	// sizetype
}

function mapGridElementToModel(gridElement: IGridElement, dashboard: DashboardModelEntity): DashboardGridElementModel {
	const model = new DashboardGridElementModel(gridElement.getId());
	model.xPos = gridElement.getPosition().x;
	model.yPos = gridElement.getPosition().y;
	model.reference = new DefaultGridReference(gridElement.getMetadata().title); // should be replaced with model reference
	model.dashboard = wrap(dashboard).toReference();
	return model;
}

// put into mapper object
export function mapToEntity(modelEntity: DashboardModelEntity): DashboardEntity {
	const grid: GridElement[] = Array.from(modelEntity.gridElements).map(
		(e) => new GridElement(e.id, e.xPos, e.yPos, e.reference)
	);
	return new DashboardEntity(modelEntity.id, { grid });
}

export function mapToModel(entity: DashboardEntity): DashboardModelEntity {
	const modelEntity = new DashboardModelEntity(entity.getId());
	modelEntity.gridElements = new Collection<DashboardGridElementModel>(
		modelEntity,
		entity.grid.map((element) => mapGridElementToModel(element, modelEntity))
	);
	return modelEntity;
}
