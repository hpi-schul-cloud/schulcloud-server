import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { UserInfo } from '../../news/entity';
import { Task } from './task.entity';
import { BaseEntityWithTimestamps } from '@shared/domain';

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	@ManyToOne({ fieldName: 'homeworkId' })
	homework: Task;
	@ManyToOne({ fieldName: 'studentId' })
	student: UserInfo;
}
