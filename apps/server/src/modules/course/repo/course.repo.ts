import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { getFieldName } from '@shared/repo/utils/repo-helper';
import { CourseEntity } from './course.entity';
import { CourseScope } from './course.scope';

@Injectable()
export class CourseRepo extends BaseRepo<CourseEntity> {
	get entityName(): EntityName<CourseEntity> {
		return CourseEntity;
	}

	public async createCourse(course: CourseEntity): Promise<CourseEntity> {
		await this.save(this.create(course));

		return course;
	}

	public async findById(id: EntityId, populate = true): Promise<CourseEntity> {
		const course = await super.findById(id);
		if (populate) {
			await this._em.populate(course, ['courseGroups', 'teachers', 'substitutionTeachers', 'students']);
		}
		return course;
	}

	public async findAllByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}

		const { pagination, order } = options || {};
		const queryOptions = {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap<CourseEntity>,
		};

		const [courses, count] = await this._em.findAndCount(CourseEntity, scope.query, queryOptions);

		return [courses, count];
	}

	public async findAllForTeacher(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forTeacher(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}

		const { pagination, order } = options || {};
		const queryOptions = {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap<CourseEntity>,
		};

		const [courses, count] = await this._em.findAndCount(CourseEntity, scope.query, queryOptions);

		return [courses, count];
	}

	// not tested in repo.integration.spec
	public async findAllForTeacherOrSubstituteTeacher(userId: EntityId): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forTeacherOrSubstituteTeacher(userId);

		const [courses, count] = await this._em.findAndCount(CourseEntity, scope.query);

		return [courses, count];
	}

	public async findOne(courseId: EntityId, userId?: EntityId): Promise<CourseEntity> {
		const scope = new CourseScope();
		scope.forCourseId(courseId);
		if (userId) scope.forAllGroupTypes(userId);

		const course = await this._em.findOneOrFail(CourseEntity, scope.query);

		return course;
	}

	public async removeUserReference(userId: EntityId): Promise<number> {
		const id = new ObjectId(userId);

		const teachersFiledName = getFieldName(this._em, 'teachers', CourseEntity.name);
		const substitutionTeachersFieldName = getFieldName(this._em, 'substitutionTeachers', CourseEntity.name);
		const studentsFieldName = getFieldName(this._em, 'students', CourseEntity.name);

		const count = await this._em.nativeUpdate(
			CourseEntity,
			{
				$or: [{ teachers: id }, { substitutionTeachers: id }, { students: id }],
			},
			{
				$pull: { [teachersFiledName]: id, [substitutionTeachersFieldName]: id, [studentsFieldName]: id },
			} as Partial<CourseEntity>
		);

		return count;
	}
}
