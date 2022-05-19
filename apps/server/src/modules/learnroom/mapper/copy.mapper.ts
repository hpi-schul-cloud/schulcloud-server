import { CopyStatusDTO } from '@shared/domain';
import { TaskCopyApiParams } from '@src/modules/task/controller/dto/task-copy.params';
import { TaskCopyParentParams } from '@src/modules/task/uc/task-copy.uc';
import { CopyApiResponse } from '../controller/dto/copy.response';

export class CopyMapper {
	static mapToResponse(copyStatus: CopyStatusDTO): CopyApiResponse {
		const dto = new CopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.elements) {
			dto.elements = copyStatus.elements;
		}
		if (copyStatus.copyEntity) {
			dto.id = copyStatus.copyEntity.id;
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
