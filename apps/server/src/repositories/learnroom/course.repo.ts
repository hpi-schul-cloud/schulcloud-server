import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Course } from '@src/entities';
import { EntityId, Counted } from '@shared/domain';
import { Scope } from '@shared/repo';

class CourseScope extends Scope<Course> {
	forAllGroupTypes(userId: EntityId): CourseScope {
		const isStudent = { studentIds: new ObjectId(userId) };
		const isTeacher = { teacherIds: new ObjectId(userId) };
		const isSubstitutionTeacher = { substitutionTeacherIds: new ObjectId(userId) };

		if (userId) {
			this.addQuery({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}
}

@Injectable()
export class CourseRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);
		const [courses, count] = await this.em.findAndCount(Course, scope.query);
		return [courses, count];
	}

	async findAllForStudent(userId: EntityId): Promise<Counted<Course[]>> {
		const query = { studentIds: new ObjectId(userId) };
		const [courses, count] = await this.em.findAndCount(Course, query);
		return [courses, count];
	}

	async findAllForTeacher(userId: EntityId): Promise<Counted<Course[]>> {
		const isTeacher = { teacherIds: new ObjectId(userId) };
		const isSubstitutionTeacher = { substitutionTeacherIds: new ObjectId(userId) };
		const query = { $or: [isTeacher, isSubstitutionTeacher] };
		const [courses, count] = await this.em.findAndCount(Course, query);
		return [courses, count];
	}
}
