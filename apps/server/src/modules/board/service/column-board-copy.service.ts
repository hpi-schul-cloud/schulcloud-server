import { CopyHelperService, CopyStatus } from '@modules/copy-helper';
import { UserService } from '@modules/user';
import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	isColumnBoard,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';
import { BoardDoCopyService, SchoolSpecificFileCopyServiceFactory } from './board-do-copy-service';
import { SwapInternalLinksVisitor } from './board-do-copy-service/swap-internal-links.visitor';

@Injectable()
export class ColumnBoardCopyService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly copyHelperService: CopyHelperService,
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

		originalBoard.title = await this.deriveColumnBoardTitle(originalBoard.title, props.destinationExternalReference);

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

	private async deriveColumnBoardTitle(
		originalTitle: string,
		destinationExternalReference: BoardExternalReference
	): Promise<string> {
		const existingBoardIds = await this.boardDoRepo.findIdsByExternalReference(destinationExternalReference);
		const existingTitles = await this.boardDoRepo.getTitlesByIds(existingBoardIds);
		const copyName = this.copyHelperService.deriveCopyName(originalTitle, Object.values(existingTitles));
		return copyName;
	}

	public async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>) {
		const board = await this.boardDoRepo.findById(boardId);

		const visitor = new SwapInternalLinksVisitor(idMap);

		board.accept(visitor);

		await this.boardDoRepo.save(board);

		return board;
	}
}
