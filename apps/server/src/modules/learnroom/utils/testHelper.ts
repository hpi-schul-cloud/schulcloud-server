import { EntityId, TestHelper } from '@shared/domain';

import { Course, Coursegroup } from '../entity';

enum CourseTyps {
	teacher = 'teacherIds',
	student = 'studentIds',
	subsitutionTeacher = 'substitutionTeacherIds',
}

export class LearnroomTestHelper extends TestHelper<EntityId, EntityId> {
	createUser(): EntityId {
		return this.createEntityId();
	}

	createSchool(): EntityId {
		return this.createEntityId();
	}

	private createCourse(type: CourseTyps): Course {
		const course = new Course({ [type]: this.getUsers(), schoolId: this.getSchool(), name: '' });
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
		const coursegroup = new Coursegroup({ studentIds: this.getUsers(), courseId: course.id });
		this.addId(coursegroup);
		return coursegroup;
	}
}
