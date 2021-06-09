import { Entity, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from '../../news/entity';
import { Task } from './task.entity';

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	@ManyToOne({ fieldName: 'homeworkId' })
	homework: Task;

	@ManyToOne({ fieldName: 'studentId' })
	student: UserInfo;
}
