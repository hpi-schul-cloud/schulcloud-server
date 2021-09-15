/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity, EntityId, TestHelper } from '@shared/domain';

import { Course } from './course.entity';
import { Coursegroup } from './coursegroup.entity';

enum CourseTyps {
	teacher = 'teacherIds',
	student = 'studentIds',
	subsitutionTeacher = 'substitutionTeacherIds',
}

export class LearnroomTestHelper extends TestHelper<EntityId> {
	createUser(): BaseEntity {
		const user = new BaseEntity();
		this.addId(user);
		return user;
	}

	createSchool(): EntityId {
		return this.createEntityId();
	}

	private createCourse(type: CourseTyps): Course {
		const course = new Course({
			[type]: this.getUsers().map((o) => o._id),
			schoolId: new ObjectId(this.getSchool()),
			name: '',
		});
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
		const studentIds = this.getUsers().map((o) => o._id);
		const coursegroup = new Coursegroup({ studentIds, courseId: course._id });
		this.addId(coursegroup);
		return coursegroup;
	}
}
