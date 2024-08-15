import { EntityData, EntityName } from '@mikro-orm/core';
import { Group } from '@modules/group';
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
		const entity: CourseEntity = await super.findEntityById(id);

		if (!entity.courseGroups.isInitialized()) {
			await entity.courseGroups.init();
		}

		const course: Course = CourseEntityMapper.mapEntityToDo(entity);

		return course;
	}

	public async findBySyncedGroup(group: Group): Promise<Course[]> {
		const entities: CourseEntity[] = await this.em.find(CourseEntity, { syncedWithGroup: group.id });

		await Promise.all(
			entities.map(async (entity: CourseEntity): Promise<void> => {
				if (!entity.courseGroups.isInitialized()) {
					await entity.courseGroups.init();
				}
			})
		);

		const courses: Course[] = entities.map((entity: CourseEntity): Course => CourseEntityMapper.mapEntityToDo(entity));

		return courses;
	}

	public async findCoursesBySchoolId(id: EntityId): Promise<Course[]> {
		const entities: CourseEntity[] = await this.em.find(CourseEntity, { school: id });

		await Promise.all(
			entities.map(async (entity: CourseEntity): Promise<void> => {
				if (!entity.courseGroups.isInitialized()) {
					await entity.courseGroups.init();
				}
			})
		);

		const courses: Course[] = entities.map((entity: CourseEntity): Course => CourseEntityMapper.mapEntityToDo(entity));

		return courses;
	}
}
