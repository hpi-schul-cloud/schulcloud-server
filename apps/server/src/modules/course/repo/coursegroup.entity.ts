import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { BaseEntityWithTimestamps } from '../../../shared/domain/entity/base.entity';
import type { LessonParent } from '../../../shared/domain/entity/lesson.entity';
import type { TaskParent } from '../../../shared/domain/entity/task.entity';
import type { User } from '../../../shared/domain/entity/user.entity';
import { EntityWithSchool } from '../../../shared/domain/interface';
import { EntityId } from '../../../shared/domain/types';
import { CourseEntity } from './course.entity';

export interface CourseGroupProperties {
	name: string;
	course: CourseEntity;
	students?: User[];
}

@Entity({ tableName: 'coursegroups' })
@Index({ properties: ['school', 'course'] })
export class CourseGroupEntity extends BaseEntityWithTimestamps implements EntityWithSchool, TaskParent, LessonParent {
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
