import { CopyStatus } from '@shared/domain';
import { LessonCopyApiParams } from '@src/modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@src/modules/learnroom/uc/lesson-copy.uc';
import { TaskCopyApiParams } from '@src/modules/task/controller/dto/task-copy.params';
import { TaskCopyParentParams } from '@src/modules/task/uc/task-copy.uc';
import { CopyApiResponse } from '../controller/dto/copy.response';

export class CopyMapper {
	static mapToResponse(copyStatus: CopyStatus): CopyApiResponse {
		const dto = new CopyApiResponse({
			type: copyStatus.type,
			status: copyStatus.status,
		});
		if (copyStatus.title) {
			dto.title = copyStatus.title;
		}
		if (copyStatus.copyEntity) {
			dto.id = copyStatus.copyEntity.id;
		}
		if (copyStatus.elements) {
			dto.elements = copyStatus.elements.map((status) => CopyMapper.mapToResponse(status));
		}
		return dto;
	}

	static mapLessonCopyToDomain(params: LessonCopyApiParams): LessonCopyParentParams {
		const dto = {
			courseId: params.courseId,
		};

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
