import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '@shared/domain';

import { Course, Coursegroup } from '../entity';

enum CourseTyps {
	teacher = 'teacherIds',
	student = 'studentIds',
	subsitutionTeacher = 'substitutionTeacherIds',
}

export class LearnroomTestHelper {
	userId: EntityId;

	schoolId: EntityId;

	constructor() {
		this.userId = new ObjectId().toHexString();
		this.schoolId = new ObjectId().toHexString();
	}

	private addId(entity: Course | Coursegroup) {
		const id = new ObjectId();
		entity.id = id.toHexString();
		entity._id = id;
	}

	private createCourse(type: CourseTyps): Course {
		const course = new Course({ [type]: [this.userId], schoolId: this.schoolId, name: '' });
		this.addId(course);
		return course;
	}

	createStudentCourse(): Course {
		return this.createCourse(CourseTyps.student);
	}

	createTeacherCourse(): Course {
		return this.createCourse(CourseTyps.teacher);
	}

	createSubstitutionCourse(): Course {
		return this.createCourse(CourseTyps.subsitutionTeacher);
	}

	createCoursegroup(course: Course): Coursegroup {
		const coursegroup = new Coursegroup({ studentIds: [this.userId], courseId: course.id });
		this.addId(coursegroup);
		return coursegroup;
	}
}
