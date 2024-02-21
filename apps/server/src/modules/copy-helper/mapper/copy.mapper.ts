import { LessonCopyApiParams } from '@modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@modules/lesson/types';
import { TaskCopyApiParams } from '@modules/task/controller/dto/task-copy.params';
import { TaskCopyParentParams } from '@modules/task/types';
import { LessonEntity, Task } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CopyApiResponse } from '../dto/copy.response';
import { CopyStatus, CopyStatusEnum } from '../types/copy.types';

export class CopyMapper {
	static mapToResponse(copyStatus: CopyStatus): CopyApiResponse {
		const dto = new CopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.copyEntity) {
			const copyEntity = copyStatus.copyEntity as LessonEntity | Task;
			dto.id = copyEntity.id;
			dto.destinationCourseId = copyEntity.course?.id;
		}
		if (copyStatus.status !== CopyStatusEnum.SUCCESS && copyStatus.elements) {
			dto.elements = copyStatus.elements
				.map((element) => CopyMapper.mapToResponse(element))
				.filter((element) => element.status !== CopyStatusEnum.SUCCESS);
		}
		return dto;
	}

	static mapLessonCopyToDomain(params: LessonCopyApiParams, userId: EntityId): LessonCopyParentParams {
		const dto = {
			courseId: params.courseId,
			userId,
		};

		return dto;
	}

	static mapTaskCopyToDomain(params: TaskCopyApiParams, userId: EntityId): TaskCopyParentParams {
		const dto = {
			courseId: params.courseId,
			lessonId: params.lessonId,
			userId,
		};

		return dto;
	}
}
