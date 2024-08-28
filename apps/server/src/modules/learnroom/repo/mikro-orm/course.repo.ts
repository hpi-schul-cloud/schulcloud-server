import { EntityData, EntityName, FindOptions } from '@mikro-orm/core';
import { Group } from '@modules/group';
import { Page } from '@shared/domain/domainobject';
import { Course as CourseEntity } from '@shared/domain/entity';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { CourseScope } from '@shared/repo/course/course.repo';
import { Course, CourseFilter, CourseRepo, CourseStatusQueryType } from '../../domain';
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

	public async getCourseInfo(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Page<Course>> {
		const scope: CourseScope = new CourseScope();
		scope.bySchoolId(filter.schoolId);
		if (filter.courseStatusQueryType === CourseStatusQueryType.CURRENT) {
			scope.forActiveCourses();
		} else {
			scope.forArchivedCourses();
		}

		const findOptions = this.mapToMikroOrmOptions(options);

		const [entities, total] = await this.em.findAndCount(CourseEntity, scope.query, findOptions);
		await Promise.all(
			entities.map(async (entity: CourseEntity): Promise<void> => {
				if (!entity.courseGroups.isInitialized()) {
					await entity.courseGroups.init();
				}
			})
		);

		const courses: Course[] = entities.map((entity: CourseEntity): Course => CourseEntityMapper.mapEntityToDo(entity));
		const page: Page<Course> = new Page<Course>(courses, total);

		return page;
	}

	private mapToMikroOrmOptions<P extends string = never>(options?: IFindOptions<Course>): FindOptions<CourseEntity, P> {
		const findOptions: FindOptions<CourseEntity, P> = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
		};

		return findOptions;
	}
}
