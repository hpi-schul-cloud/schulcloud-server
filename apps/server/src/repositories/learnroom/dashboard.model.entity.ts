import { Entity, Property, ManyToOne, OneToMany, Collection, IdentifiedReference } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '../../shared/domain';
import { DefaultGridReference } from '../../entities/learnroom/dashboard.entity';

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
