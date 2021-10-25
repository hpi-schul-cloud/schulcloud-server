import { Entity, Property, ManyToOne, OneToMany, Collection, IdentifiedReference } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

@Entity({ tableName: 'dashboarddefaultreference' })
export class DefaultGridReferenceModel extends BaseEntityWithTimestamps {
	constructor(id: string) {
		super();
		this._id = ObjectId.createFromHexString(id);
		this.id = id;
	}

	@Property()
	title: string;

	@Property()
	color: string;

	// not really happy with this, but didnt find a better solution yet to connect the gridelement with multiple references.
	@ManyToOne('DashboardGridElementModel', { wrappedReference: true })
	gridelement: IdentifiedReference<DashboardGridElementModel>;
}

@Entity({ tableName: 'dashboardelement' })
export class DashboardGridElementModel extends BaseEntityWithTimestamps {
	constructor(id?: string) {
		super();
		if (id) {
			this._id = ObjectId.createFromHexString(id);
			this.id = id;
		}
	}

	@Property()
	xPos: number;

	@Property()
	yPos: number;

	// todo: put in references to useful things like courses via polymorphic inheritance (see news)
	@OneToMany('DefaultGridReferenceModel', 'gridelement')
	references: Collection<DefaultGridReferenceModel> = new Collection<DefaultGridReferenceModel>(this);

	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	dashboard: IdentifiedReference<DashboardModelEntity>;
}

@Entity({ tableName: 'dashboard' })
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
