import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc/task.uc';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskRepo } from './repo/task.repo';
import { TaskSchema, SubmissionSchema, LessonSchema, CourseSchema } from './repo/task.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Task', schema: TaskSchema, collection: 'homeworks' },
			{ name: 'Submission', schema: SubmissionSchema },
			{ name: 'Lesson', schema: LessonSchema },
			{ name: 'Course', schema: CourseSchema },
		]),
	],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo],
})
export class TaskModule {}
