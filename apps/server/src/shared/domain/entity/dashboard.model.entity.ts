import {
	Collection,
	Entity,
	IdentifiedReference,
	Index,
	ManyToMany,
	ManyToOne,
	OneToMany,
	Property,
	wrap,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { Course } from './course.entity';
import { User } from './user.entity';

export interface DashboardGridElementModelProperties {
	id?: string;
	title?: string;
	xPos: number;
	yPos: number;
	references: Course[];
	dashboard: DashboardModelEntity;
}

@Entity({ tableName: 'dashboardelement' })
export class DashboardGridElementModel extends BaseEntityWithTimestamps {
	constructor({ id, title, xPos, yPos, references, dashboard }: DashboardGridElementModelProperties) {
		super();
		if (id) {
			this._id = ObjectId.createFromHexString(id);
			this.id = id;
		}
		this.title = title;
		this.xPos = xPos;
		this.yPos = yPos;
		this.references.set(references);
		this.dashboard = wrap(dashboard).toReference();
	}

	@Property({ nullable: true })
	title?: string;

	@Property()
	xPos: number;

	@Property()
	yPos: number;

	@Index()
	@ManyToMany('Course', undefined, { fieldName: 'referenceIds' })
	references = new Collection<Course>(this);

	@Index()
	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	dashboard: IdentifiedReference<DashboardModelEntity>;
}

export interface DashboardModelProperties {
	id: string;
	user: User;
	gridElements?: DashboardGridElementModel[];
}

@Entity({ tableName: 'dashboard' })
export class DashboardModelEntity extends BaseEntityWithTimestamps {
	constructor(props: DashboardModelProperties) {
		super();
		this._id = ObjectId.createFromHexString(props.id);
		this.id = props.id;
		this.user = wrap(props.user).toReference();
		if (props.gridElements) this.gridElements.set(props.gridElements);
	}

	@OneToMany('DashboardGridElementModel', 'dashboard', { orphanRemoval: true })
	gridElements: Collection<DashboardGridElementModel> = new Collection<DashboardGridElementModel>(this);

	// userId
	@Index()
	@ManyToOne('User', { fieldName: 'userId', wrappedReference: true })
	user: IdentifiedReference<User>;

	// sizetype
}
