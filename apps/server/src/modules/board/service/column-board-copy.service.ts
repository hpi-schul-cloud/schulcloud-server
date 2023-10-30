import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { ColumnBoard, isColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
} from '@shared/domain/domainobject/board/types/board-external-reference';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { CopyStatus } from '@src/modules/copy-helper/types/copy.types';
import { UserService } from '@src/modules/user/service/user.service';
import { BoardDoRepo } from '../repo/board-do.repo';
import { BoardDoCopyService } from './board-do-copy-service/board-do-copy.service';
import { SchoolSpecificFileCopyServiceFactory } from './board-do-copy-service/school-specific-file-copy-service.factory';

@Injectable()
export class ColumnBoardCopyService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly courseRepo: CourseRepo,
		private readonly userService: UserService,
		private readonly boardDoCopyService: BoardDoCopyService,
		private readonly fileCopyServiceFactory: SchoolSpecificFileCopyServiceFactory
	) {}

	async copyColumnBoard(props: {
		originalColumnBoardId: EntityId;
		destinationExternalReference: BoardExternalReference;
		userId: EntityId;
	}): Promise<CopyStatus> {
		const originalBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, props.originalColumnBoardId);

		const user = await this.userService.findById(props.userId);
		/* istanbul ignore next */
		if (originalBoard.context.type !== BoardExternalReferenceType.Course) {
			throw new NotImplementedException('only courses are supported as board parents');
		}
		const course = await this.courseRepo.findById(originalBoard.context.id); // TODO: get rid of this

		const fileCopyService = this.fileCopyServiceFactory.build({
			sourceSchoolId: course.school.id,
			targetSchoolId: user.schoolId,
			userId: props.userId,
		});

		const copyStatus = await this.boardDoCopyService.copy({ original: originalBoard, fileCopyService });

		/* istanbul ignore next */
		if (!isColumnBoard(copyStatus.copyEntity)) {
			throw new InternalServerErrorException('expected copy of columnboard to be a columnboard');
		}

		copyStatus.copyEntity.context = props.destinationExternalReference;
		await this.boardDoRepo.save(copyStatus.copyEntity);

		return copyStatus;
	}
}
