import { EntityData, EntityName } from '@mikro-orm/core';
import { Course as CourseEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Course, CourseRepo } from '../../domain';
import { CourseEntityMapper } from './mapper/course.entity.mapper';

export class CourseMikroOrmRepo extends BaseDomainObjectRepo<Course, CourseEntity> implements CourseRepo {
	protected get entityName(): EntityName<CourseEntity> {
		return CourseEntity;
	}

	protected mapDOToEntityProperties(entityDO: Course): EntityData<CourseEntity> {
		const entityProps: EntityData<CourseEntity> = CourseEntityMapper.mapDoToEntityData(entityDO, this.em);

		return entityProps;
	}

	public async findCourseById(id: EntityId): Promise<Course> {
		const entity: CourseEntity = await super.findById(id);

		if (!entity.courseGroups.isInitialized()) {
			await entity.courseGroups.init();
		}

		const course: Course = CourseEntityMapper.mapEntityToDo(entity);

		return course;
	}
}