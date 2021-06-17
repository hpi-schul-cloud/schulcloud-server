import { Entity, ManyToOne, Collection, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from '../../news/entity';
import { Task, File } from './';

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Submission>) {
		super();
		Object.assign(this, partial);
	}
	// TODO: this populate the complete task stuff for now
	@ManyToOne({ fieldName: 'homeworkId' })
	homework: Task;

	@ManyToOne({ fieldName: 'studentId' })
	student: UserInfo;

	/***** student uploads *****/
	@Property()
	comment: string;

	@ManyToMany({ fieldName: 'fileIds', type: File })
	studentFiles = new Collection<File>(this);

	/***** teacher uploads *****/
	@Property()
	grade: number;

	@Property()
	gradeComment: string;

	@ManyToMany({ fieldName: 'gradeFileIds', type: File })
	gradeFileIds = new Collection<File>(this);

}
