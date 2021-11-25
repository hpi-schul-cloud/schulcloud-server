import { Entity, Property, ManyToOne, OneToMany, ManyToMany, Collection, IdentifiedReference } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { User } from './user.entity';
import { EntityId } from '../types';

@Entity({ tableName: 'dashboarddefaultreference' })
export class DefaultGridReferenceModel extends BaseEntityWithTimestamps {
	constructor(id: string) {
		super();
		this._id = ObjectId.createFromHexString(id);
		this.id = id;
	}

	@Property()
	title!: string;

	@Property()
	color!: string;
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
	title!: string;

	@Property()
	xPos!: number;

	@Property()
	yPos!: number;

	@ManyToMany('DefaultGridReferenceModel', undefined, { fieldName: 'referenceIds' })
	references = new Collection<DefaultGridReferenceModel>(this);

	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	dashboard!: IdentifiedReference<DashboardModelEntity>;
}

export interface IDashboardModelProperties {
	id: string;
	user: EntityId | User;
}

@Entity({ tableName: 'dashboard' })
export class DashboardModelEntity extends BaseEntityWithTimestamps {
	constructor(props: IDashboardModelProperties) {
		super();
		this._id = ObjectId.createFromHexString(props.id);
		this.id = props.id;
		Object.assign(this, { user: props.user });
	}

	@OneToMany('DashboardGridElementModel', 'dashboard')
	gridElements: Collection<DashboardGridElementModel> = new Collection<DashboardGridElementModel>(this);

	// userId
	@ManyToOne('User', { fieldName: 'userId', wrappedReference: true })
	user!: IdentifiedReference<User>;

	// sizetype
}
