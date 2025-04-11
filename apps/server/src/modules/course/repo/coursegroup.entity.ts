import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { LessonParent } from '@modules/lesson/repo';
import { SchoolEntity } from '@modules/school/repo';
import { TaskParent } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
// eslint-disable-next-line import/no-cycle
import { CourseEntity } from './course.entity'; // https://github.com/mikro-orm/mikro-orm/discussions/4089

export interface CourseGroupProperties {
	name: string;
	course: CourseEntity;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroupEntity extends BaseEntityWithTimestamps implements TaskParent, LessonParent {
	@Property()
	name: string;

	@ManyToMany('User', undefined, { fieldName: 'userIds' })
	@Index()
	students = new Collection<User>(this);

	@Index()
	@ManyToOne(() => CourseEntity, { fieldName: 'courseId' })
	course: CourseEntity;

	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	@Index()
	school: SchoolEntity;

	constructor(props: CourseGroupProperties) {
		super();
		this.name = props.name;
		this.course = props.course;
		this.school = props.course.school;
		if (props.students) this.students.set(props.students);
	}

	public getStudentIds(): EntityId[] {
		let studentIds: EntityId[] = [];

		// A not existing course group can be referenced in a submission.
		// Therefore we need to handle this case instead of returning an error here.
		if (this.students) {
			const studentObjectIds = this.students.getIdentifiers('_id');
			studentIds = studentObjectIds.map((id): string => id.toString());
		}

		return studentIds;
	}

	public removeStudent(userId: EntityId): void {
		this.students.remove((u) => u.id === userId);
	}
}
