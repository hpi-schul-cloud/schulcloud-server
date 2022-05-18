import { CopyStatusDTO } from '@shared/domain';
import { TaskCopyApiResponse } from '../controller/dto';
import { TaskCopyApiParams } from '../controller/dto/task-copy.params';
import { TaskCopyParentParams } from '../uc/task-copy.uc';

export class TaskCopyMapper {
	static mapToResponse(copyStatus: CopyStatusDTO): TaskCopyApiResponse {
		const dto = new TaskCopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.elements) {
			dto.elements = copyStatus.elements;
		}

		if (copyStatus.id) {
			dto.id = copyStatus.id;
		}
		return dto;
	}

	static mapTaskCopyToDomain(params: TaskCopyApiParams): TaskCopyParentParams {
		const dto = {
			courseId: params.courseId,
			lessonId: params.lessonId,
		};

		return dto;
	}
}
