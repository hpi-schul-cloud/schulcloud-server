import { AuthorizationService } from '@modules/authorization';
import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import {
	BoardNodeFactory,
	BoardRoles,
	ContentElementType,
	FileElement,
	isFileElement,
	isRichTextElement,
	isSubmissionItem,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
	UserWithBoardRoles,
} from '../domain';
import { BoardNodeAuthorizableService, BoardNodeService } from '../service';

@Injectable()
export class SubmissionItemUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly boardNodeRule: BoardNodeRule
	) {}

	public async findSubmissionItems(
		userId: EntityId,
		submissionContainerId: EntityId
	): Promise<{ submissionItems: SubmissionItem[]; users: UserWithBoardRoles[] }> {
		const submissionContainerElement = await this.boardNodeService.findByClassAndId(
			SubmissionContainerElement,
			submissionContainerId
		);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(
			submissionContainerElement
		);

		throwForbiddenIfFalse(this.boardNodeRule.can('viewElement', user, boardNodeAuthorizable));

		const submissionItems = submissionContainerElement.children.filter(isSubmissionItem);

		const boardReaders = boardNodeAuthorizable.users.filter((user) => user.roles.includes(BoardRoles.READER));

		const isUserBoardReader = boardReaders.some((u) => u.userId === userId);
		if (isUserBoardReader) {
			// board readers can only see their own submission item
			const ownSubmissionItems = submissionItems.filter((item) => item.userId === userId);
			return { submissionItems: ownSubmissionItems, users: [] };
		} else {
			// return all submission items to board editors and the users
			return { submissionItems, users: boardReaders };
		}
	}

	public async updateSubmissionItem(
		userId: EntityId,
		submissionItemId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(submissionItem);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateSubmissionItem', user, boardNodeAuthorizable));

		await this.boardNodeService.updateCompleted(submissionItem, completed);

		return submissionItem;
	}

	public async deleteSubmissionItem(userId: EntityId, submissionItemId: EntityId): Promise<void> {
		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(submissionItem);

		throwForbiddenIfFalse(this.boardNodeRule.can('deleteSubmissionItem', user, boardNodeAuthorizable));

		await this.boardNodeService.delete(submissionItem);
	}

	public async createElement(
		userId: EntityId,
		submissionItemId: EntityId,
		type: ContentElementType
	): Promise<FileElement | RichTextElement> {
		if (type !== ContentElementType.RICH_TEXT && type !== ContentElementType.FILE) {
			throw new BadRequestException();
		}

		const submissionItem = await this.boardNodeService.findByClassAndId(SubmissionItem, submissionItemId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(submissionItem);

		throwForbiddenIfFalse(this.boardNodeRule.can('createSubmissionItemContent', user, boardNodeAuthorizable));

		const element = this.boardNodeFactory.buildContentElement(type);
		if (!(isFileElement(element) || isRichTextElement(element))) {
			throw new UnprocessableEntityException();
		}

		await this.boardNodeService.addToParent(submissionItem, element);

		return element;
	}
}
