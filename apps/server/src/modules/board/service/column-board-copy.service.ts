import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	EntityId,
	isColumnBoard,
} from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { CopyStatus } from '@src/modules/copy-helper';
import { UserService } from '@src/modules/user';
import { BoardDoRepo } from '../repo';
import { BoardDoCopyService } from './board-do-copy-service';

@Injectable()
export class ColumnBoardCopyService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly courseRepo: CourseRepo,
		private readonly userService: UserService,
		private readonly boardDoCopyService: BoardDoCopyService
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

		const copyStatus = await this.boardDoCopyService.copy({
			originSchoolId: course.school.id,
			targetSchoolId: user.schoolId,
			userId: props.userId,
			original: originalBoard,
		});

		/* istanbul ignore next */
		if (!isColumnBoard(copyStatus.copyEntity)) {
			throw new InternalServerErrorException('expected copy of columnboard to be a columnboard');
		}

		copyStatus.copyEntity.context = props.destinationExternalReference;
		await this.boardDoRepo.save(copyStatus.copyEntity);

		return copyStatus;
	}
}
