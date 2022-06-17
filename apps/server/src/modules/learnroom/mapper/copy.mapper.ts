import { CopyStatus } from '@shared/domain';
import { TaskCopyApiParams } from '@src/modules/task/controller/dto/task-copy.params';
import { TaskCopyParentParams } from '@src/modules/task/uc/task-copy.uc';
import { CopyApiResponse } from '../controller/dto/copy.response';

export class CopyMapper {
	static mapToResponse(copyStatus: CopyStatus): CopyApiResponse {
		const dto = new CopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.copyEntity) {
			dto.id = copyStatus.copyEntity.id;
		}
		if (copyStatus.elements) {
			dto.elements = copyStatus.elements;
		}
		return dto;
	}

	static mapTaskCopyToDomain(params: TaskCopyApiParams, jwt: string): TaskCopyParentParams {
		const dto = {
			courseId: params.courseId,
			lessonId: params.lessonId,
			jwt,
		};

		return dto;
	}
}
