import { CopyStatus } from '@modules/copy-helper';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { StorageLocation } from '@modules/files-storage/entity';
import { UserService } from '@modules/user';
import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { BoardExternalReference, BoardExternalReferenceType, ColumnBoard, isColumnBoard } from '../../domain';
import { BoardNodeService } from '../board-node.service';
import { BoardNodeCopyContext } from './board-node-copy-context';
import { BoardNodeCopyService } from './board-node-copy.service';
import { ColumnBoardTitleService } from './column-board-title.service';

@Injectable()
export class ColumnBoardCopyService {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardTitleService: ColumnBoardTitleService,
		private readonly courseRepo: CourseRepo,
		private readonly userService: UserService,
		private readonly boardNodeCopyService: BoardNodeCopyService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async copyColumnBoard(props: {
		originalColumnBoardId: EntityId;
		destinationExternalReference: BoardExternalReference;
		userId: EntityId;
		copyTitle?: string;
	}): Promise<CopyStatus> {
		const originalBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, props.originalColumnBoardId);

		const user = await this.userService.findById(props.userId);
		/* istanbul ignore next */
		if (originalBoard.context.type !== BoardExternalReferenceType.Course) {
			throw new NotImplementedException('only courses are supported as board parents');
		}
		const course = await this.courseRepo.findById(originalBoard.context.id); // TODO: get rid of this

		const copyContext = new BoardNodeCopyContext({
			sourceStorageLocationId: course.school.id,
			targetStorageLocationId: user.schoolId,
			sourceStorageLocation: StorageLocation.SCHOOL,
			targetStorageLocation: StorageLocation.SCHOOL,
			userId: props.userId,
			filesStorageClientAdapterService: this.filesStorageClientAdapterService,
		});

		const copyStatus = await this.boardNodeCopyService.copy(originalBoard, copyContext);

		/* istanbul ignore next */
		if (!isColumnBoard(copyStatus.copyEntity)) {
			throw new InternalServerErrorException('expected copy of columnboard to be a columnboard');
		}

		if (props.copyTitle) {
			copyStatus.copyEntity.title = props.copyTitle;
		} else {
			copyStatus.copyEntity.title = await this.columnBoardTitleService.deriveColumnBoardTitle(
				originalBoard.title,
				props.destinationExternalReference
			);
		}
		copyStatus.copyEntity.context = props.destinationExternalReference;
		await this.boardNodeService.addRoot(copyStatus.copyEntity);

		return copyStatus;
	}
}
