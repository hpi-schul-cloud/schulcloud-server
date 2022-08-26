import { CopyStatus, CopyStatusEnum } from '@shared/domain';
import { LessonCopyApiParams } from '@src/modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@src/modules/learnroom/uc/lesson-copy.uc';
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
			dto.destinationCourseId = copyStatus.copyEntity.id;
		}
		if (copyStatus.status !== CopyStatusEnum.SUCCESS && copyStatus.elements) {
			dto.elements = copyStatus.elements
				.map((element) => CopyMapper.mapToResponse(element))
				.filter((element) => element.status !== CopyStatusEnum.SUCCESS);
		}
		return dto;
	}

	static mapLessonCopyToDomain(params: LessonCopyApiParams, jwt: string): LessonCopyParentParams {
		const dto = {
			courseId: params.courseId,
			jwt,
		};

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
