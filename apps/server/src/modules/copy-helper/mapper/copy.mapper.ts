import { ColumnBoard } from '@modules/board/domain/colum-board.do';
import type { CopyFileDto } from '@modules/files-storage-client';
import { LessonCopyApiParams } from '@modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@modules/lesson';
import { LessonEntity } from '@modules/lesson/repo';
import { TaskCopyParentParams } from '@modules/task/api/dto/task-copy-parent.params';
import { TaskCopyApiParams } from '@modules/task/api/dto/task-copy.params';
import { Task } from '@modules/task/repo';
import { EntityId } from '@shared/domain/types';
import { CopyApiResponse } from '../dto/copy.response';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types/copy.types';

export class CopyMapper {
	public static mapToResponse(copyStatus: CopyStatus): CopyApiResponse {
		const dto = new CopyApiResponse({
			title: copyStatus.title,
			type: copyStatus.type,
			status: copyStatus.status,
		});

		if (copyStatus.copyEntity) {
			const copyEntity = copyStatus.copyEntity as LessonEntity | Task;
			dto.id = copyEntity.id;
			if (copyEntity instanceof LessonEntity || copyEntity instanceof Task) {
				dto.destinationId = copyEntity.course?.id;
			}
			if (copyEntity instanceof ColumnBoard) {
				dto.destinationId = copyEntity.context?.id;
			}
		}
		if (copyStatus.status !== CopyStatusEnum.SUCCESS && copyStatus.elements) {
			dto.elements = copyStatus.elements
				.map((element) => CopyMapper.mapToResponse(element))
				.filter((element) => element.status !== CopyStatusEnum.SUCCESS);
		}
		return dto;
	}

	public static mapLessonCopyToDomain(params: LessonCopyApiParams, userId: EntityId): LessonCopyParentParams {
		const dto = {
			courseId: params.courseId,
			userId,
		};

		return dto;
	}

	public static mapTaskCopyToDomain(params: TaskCopyApiParams, userId: EntityId): TaskCopyParentParams {
		const dto = {
			courseId: params.courseId,
			lessonId: params.lessonId,
			userId,
		};

		return dto;
	}

	public static mapFileDtosToCopyStatus(copyFileDtos: CopyFileDto[]): CopyStatus[] {
		const copyStatus = copyFileDtos.map((copyFileDto) => {
			return {
				type: CopyElementType.FILE,
				status: copyFileDto.id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
				title: copyFileDto.name ?? `(old fileid: ${copyFileDto.sourceId})`,
			};
		});

		return copyStatus;
	}
}
