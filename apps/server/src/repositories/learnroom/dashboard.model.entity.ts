import { Entity, Property, ManyToOne, OneToMany, Collection, IdentifiedReference } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '../../shared/domain';
import { Course } from '../../entities/learnroom/course.entity';
import { DashboardEntity, GridElement } from '../../entities/learnroom/dashboard.entity';

@Entity()
export class DashboardGridElementModel extends BaseEntityWithTimestamps {
	@Property()
	xPos: number;

	@Property()
	yPos: number;

	@ManyToOne()
	reference: Course;

	@ManyToOne('DashboardModelEntity', { wrappedReference: true })
	dashboard: IdentifiedReference<DashboardModelEntity>;
}

@Entity()
export class DashboardModelEntity extends BaseEntityWithTimestamps {
	@OneToMany('DashboardGridElementModel', 'dashboard')
	gridElements: Collection<DashboardGridElementModel> = new Collection<DashboardGridElementModel>(this);

	// userId

	// sizetype
}

export function mapToEntity(modelEntity: DashboardModelEntity): DashboardEntity {
	const grid: GridElement[] = Array.from(modelEntity.gridElements).map(
		(e) => new GridElement(e.xPos, e.yPos, e.reference)
	);
	return new DashboardEntity({ grid });
}
