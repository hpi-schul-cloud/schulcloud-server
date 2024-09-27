import { LessonEntity, Task } from '@shared/domain/entity';
import { LessonMetadataResponse } from '../dto';
import { LessonLinkedTaskResponse } from '../dto/lesson-linked-task.response';

export class LessonMapper {
	public static mapToMetadataResponse(lesson: LessonEntity): LessonMetadataResponse {
		const dto = new LessonMetadataResponse({ _id: lesson.id, name: lesson.name });
		return dto;
	}

	public static mapTaskToResponse(task: Task): LessonLinkedTaskResponse {
		const response = new LessonLinkedTaskResponse({
			name: task.name,
			description: task.description,
			descriptionInputFormat: task.descriptionInputFormat,
			availableDate: task.availableDate,
			dueDate: task.dueDate,
			private: task.private,
			creator: task.creator?.id,
			publicSubmissions: task.publicSubmissions,
			teamSubmissions: task.teamSubmissions,
			courseId: task.course?.id,
			submissionIds: task.submissions.toArray().map((submission) => submission.id),
			finishedIds: task.finished.toArray().map((submission) => submission.id),
		});

		return response;
	}
}
