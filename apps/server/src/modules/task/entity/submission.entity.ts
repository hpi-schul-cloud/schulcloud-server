import { Entity, ManyToOne, Collection, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from '../../news/entity';
import { Task, FileInfo } from './';

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

	@ManyToOne({ fieldName: 'fileIds', type: FileInfo })
	studentFiles = new Collection<FileInfo>(this);

	/***** teacher uploads *****/
	@Property()
	grade: number;

	@Property()
	gradeComment: string;

	@ManyToOne({ fieldName: 'gradeFileIds', type: FileInfo })
	gradeFileIds = new Collection<FileInfo>(this);

}
