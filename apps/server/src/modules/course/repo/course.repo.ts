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
		schoolId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}
		scope.bySchoolId(schoolId);

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
		schoolId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forTeacher(userId);
		scope.bySchoolId(schoolId);

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
	public async findAllForTeacherOrSubstituteTeacher(
		userId: EntityId,
		schoolId: EntityId
	): Promise<Counted<CourseEntity[]>> {
		const scope = new CourseScope();
		scope.forTeacherOrSubstituteTeacher(userId);
		scope.bySchoolId(schoolId);

		const [courses, count] = await this._em.findAndCount(CourseEntity, scope.query);

		return [courses, count];
	}

	public async findOne(courseId: EntityId, userId: EntityId, schoolId: EntityId): Promise<CourseEntity> {
		const scope = new CourseScope();
		scope.forCourseId(courseId);
		scope.forAllGroupTypes(userId);
		scope.bySchoolId(schoolId);

		const course = await this._em.findOneOrFail(CourseEntity, scope.query);

		return course;
	}

	public async removeUserFromCourses(userId: EntityId, schoolId: EntityId): Promise<void> {
		const [courses] = await this.findAllByUserId(userId, schoolId);
		await this.removeUserReference(
			userId,
			courses.map((c) => c.id)
		);
	}

	public async removeUserReference(userId: EntityId, courseIdsFilter?: EntityId[]): Promise<Counted<EntityId[]>> {
		const id = new ObjectId(userId);

		const teachersFiledName = getFieldName(this._em, 'teachers', CourseEntity.name);
		const substitutionTeachersFieldName = getFieldName(this._em, 'substitutionTeachers', CourseEntity.name);
		const studentsFieldName = getFieldName(this._em, 'students', CourseEntity.name);

		const query: Record<string, any> = {
			$or: [{ teachers: id }, { substitutionTeachers: id }, { students: id }],
		};

		if (courseIdsFilter && courseIdsFilter.length > 0) {
			query._id = { $in: courseIdsFilter.map((cid) => new ObjectId(cid)) };
		}

		const [courses] = await this._em.findAndCount(CourseEntity, query);

		const count = await this._em.nativeUpdate(CourseEntity, query, {
			$pull: { [teachersFiledName]: id, [substitutionTeachersFieldName]: id, [studentsFieldName]: id },
		} as Partial<CourseEntity>);

		const courseIds = courses.map((c) => c.id);
		return [courseIds, count];
	}
}
