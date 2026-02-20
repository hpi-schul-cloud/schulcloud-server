import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { UserService } from '@modules/user';
import { BoardContextApiHelperService } from '@modules/board-context';
import { type User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	BoardExternalReferenceType,
	BoardNodeAuthorizable,
	BoardRoles,
	ColumnBoard,
	isDrawingElement,
	isSubmissionItem,
	isSubmissionItemContent,
	isVideoConferenceElement,
	MediaBoard,
	SubmissionItem,
	UserWithBoardRoles,
} from '../domain';

@Injectable()
export class BoardNodeRule implements Rule<BoardNodeAuthorizable> {
	constructor(authorisationInjectionService: AuthorizationInjectionService, private readonly userService: UserService, private readonly boardContextApiHelperService: BoardContextApiHelperService) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof BoardNodeAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, authorizable: BoardNodeAuthorizable, context: AuthorizationContext): boolean {
		const hasAllPermissions = this.hasAllPermissions(user, authorizable, context.requiredPermissions);
		if (!hasAllPermissions) {
			return false;
		}

		const userWithBoardRoles = authorizable.users.find(({ userId }) => userId === user.id);
		if (!userWithBoardRoles) {
			return false;
		}

		if (
			authorizable.rootNode instanceof ColumnBoard &&
			!authorizable.rootNode.isVisible &&
			!this.isBoardEditor(userWithBoardRoles)
		) {
			return false;
		}

		if (this.shouldProcessSubmissionItem(authorizable)) {
			return this.hasPermissionForSubmissionItem(user, userWithBoardRoles, authorizable, context);
		}

		if (this.shouldProcessDrawingElementFile(authorizable, context)) {
			return this.hasPermissionForDrawingElementFile(userWithBoardRoles);
		}

		if (this.shouldProcessVideoConferenceElement(authorizable)) {
			return this.hasPermissionForVideoConferenceElement(userWithBoardRoles, context, authorizable);
		}

		if (context.action === Action.write) {
			const writePermissions = Array.from(new Set([Permission.BOARD_EDIT, ...context.requiredPermissions]));
			return this.hasAllPermissions(user, authorizable, writePermissions);
		}

		return this.isBoardReader(userWithBoardRoles);
	}

	private hasAllPermissions(
		user: User,
		authorizable: BoardNodeAuthorizable,
		requiredPermissions: Permission[]
	): boolean {
		const schoolPermissions = this.userService.resolvePermissions(user);
		const boardPermissions = authorizable.getUserPermissions(user.id);

		const permissions = Array.from(new Set([...schoolPermissions, ...boardPermissions]));
		return requiredPermissions.every((p) => permissions.includes(p));
	}

	public canFindBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const canViewBoard = this.canViewBoard(user, authorizable);
		const permissions = authorizable.getUserPermissions(user.id);

		if (
			authorizable.rootNode instanceof ColumnBoard &&
			!authorizable.rootNode.isVisible &&
			!permissions.includes(Permission.BOARD_EDIT)
		) {
			return false;
		}

		return canViewBoard;
	}

	public canFindCards(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canViewBoard(user, authorizable);
	}

	public canCopyCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCreateCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCreateColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCreateElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCreateMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canDeleteMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCreateSubmissionItemContent(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.isSubmissionItemOfUser(user, authorizable);
	}

	public canDeleteBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canManageBoard(user, authorizable);
	}

	public canDeleteCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canDeleteColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canDeleteElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canDeleteSubmissionItem(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.isSubmissionItemOfUser(user, authorizable);
	}

	public canUpdateBoardTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateCardHeight(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateCardTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateColumnTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canMoveCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canMoveColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canMoveElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCopyBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canManageBoard(user, authorizable);
	}

	public canUpdateBoardVisibility(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canManageBoard(user, authorizable);
	}

	public canUpdateReadersCanEditSetting(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);

		const isBoard = authorizable.boardNode instanceof ColumnBoard;
		const canManageReadersCanEdit = permissions.includes(Permission.BOARD_MANAGE_READERS_CAN_EDIT);

		return isBoard && canManageReadersCanEdit;
	}

	public canUpdateMediaBoardColor(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateMediaBoardLayout(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canCollapseMediaBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canEditBoard(user, authorizable);
	}

	public canUpdateBoardLayout(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canManageBoard(user, authorizable);
	}

	public canUpdateSubmissionItem(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.isSubmissionItemOfUser(user, authorizable);
	}

	public canViewElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canViewBoard(user, authorizable);
	}

	public canViewMediaBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.canViewBoard(user, authorizable);
	}

	public canRelocateContent(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);

		const isBoard = authorizable.rootNode instanceof ColumnBoard;
		const canRelocateContent = permissions.includes(Permission.BOARD_RELOCATE_CONTENT);

		return isBoard && canRelocateContent;
	}

	private isBoardAdmin(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.ADMIN);
	}

	private isBoardEditor(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.EDITOR);
	}

	private isBoardReader(userWithBoardRoles: UserWithBoardRoles): boolean {
		return [BoardRoles.READER, BoardRoles.EDITOR].some((role) => userWithBoardRoles.roles.includes(role));
	}

	private shouldProcessDrawingElementFile(
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		const requiresFileStoragePermission =
			context.requiredPermissions.includes(Permission.FILESTORAGE_CREATE) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_VIEW) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_REMOVE);

		return isDrawingElement(boardNodeAuthorizable.boardNode) && requiresFileStoragePermission;
	}

	private hasPermissionForDrawingElementFile(userWithBoardRoles: UserWithBoardRoles): boolean {
		// check if user has read permissions with no account for the context.action
		// because everyone should be able to upload files to a drawing element
		return this.isBoardReader(userWithBoardRoles);
	}

	private shouldProcessSubmissionItem(boardNodeAuthorizable: BoardNodeAuthorizable): boolean {
		return isSubmissionItem(boardNodeAuthorizable.boardNode) || isSubmissionItem(boardNodeAuthorizable.parentNode);
	}

	private hasPermissionForSubmissionItem(
		user: User,
		userWithBoardRoles: UserWithBoardRoles,
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		// permission for elements under a submission item, are handled by the parent submission item
		if (isSubmissionItem(boardNodeAuthorizable.parentNode)) {
			if (!isSubmissionItemContent(boardNodeAuthorizable.boardNode)) {
				return false;
			}
			boardNodeAuthorizable.boardNode = boardNodeAuthorizable.parentNode;
			boardNodeAuthorizable.parentNode = undefined;
		}

		if (!isSubmissionItem(boardNodeAuthorizable.boardNode)) {
			/* istanbul ignore next */
			throw new Error('BoardDoAuthorizable.boardDo is not a submission item');
		}

		if (context.action === Action.write) {
			return this.hasSubmissionItemWritePermission(userWithBoardRoles, boardNodeAuthorizable.boardNode);
		}

		return this.hasSubmissionItemReadPermission(userWithBoardRoles, boardNodeAuthorizable.boardNode);
	}

	private hasSubmissionItemWritePermission(
		userWithBoardRoless: UserWithBoardRoles,
		submissionItem: SubmissionItem
	): boolean {
		// teacher don't have write access
		if (this.isBoardEditor(userWithBoardRoless)) {
			return false;
		}

		// student has write access only for his own submission item
		if (
			this.isBoardReader(userWithBoardRoless) &&
			this.isSubmissionItemCreator(userWithBoardRoless.userId, submissionItem)
		) {
			return true;
		}

		return false;
	}

	private hasSubmissionItemReadPermission(
		userWithBoardRoless: UserWithBoardRoles,
		submissionItem: SubmissionItem
	): boolean {
		if (this.isBoardEditor(userWithBoardRoless)) {
			return true;
		}

		if (
			this.isBoardReader(userWithBoardRoless) &&
			this.isSubmissionItemCreator(userWithBoardRoless.userId, submissionItem)
		) {
			return true;
		}

		return false;
	}

	private isSubmissionItemCreator(userId: EntityId, submissionItem: SubmissionItem): boolean {
		return submissionItem.userId === userId;
	}

	private shouldProcessVideoConferenceElement(boardNodeAuthorizable: BoardNodeAuthorizable): boolean {
		return isVideoConferenceElement(boardNodeAuthorizable.boardNode);
	}

	private hasPermissionForVideoConferenceElement(
		userWithBoardRoles: UserWithBoardRoles,
		context: AuthorizationContext,
		authorizable: BoardNodeAuthorizable
	): boolean {
		if (context.action === Action.write) {
			const canRoomEditorManageVideoconference =
				authorizable.boardContextSettings.canRoomEditorManageVideoconference ?? false;
			return (
				(canRoomEditorManageVideoconference && this.isBoardEditor(userWithBoardRoles)) ||
				this.isBoardAdmin(userWithBoardRoles)
			);
		}

		return this.isBoardReader(userWithBoardRoles);
	}

	private async isBoardLocked(authorizable: BoardNodeAuthorizable): Promise<boolean> {
		if (!(authorizable.rootNode instanceof ColumnBoard)) {
			return false;
		}

		const { context } = authorizable.rootNode;

		if (context.type === BoardExternalReferenceType.Course) {
			// TODO get course and check if it's locked or not
		}

		if (context.type === BoardExternalReferenceType.Room) {
			// TODO get room and check if it's locked or not
			if (await this.boardContextApiHelperService.isLockedRoom(context.id)) {
				return false;
			}
		}

		return true;
	}

	private canEditBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);

		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		const canEditBoard = permissions.includes(Permission.BOARD_EDIT);
		return isBoard && canEditBoard;
	}

	private canManageBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);

		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		const canManageBoard = permissions.includes(Permission.BOARD_MANAGE);
		return isBoard && canManageBoard;
	}

	private canViewBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		if (!this.isBoardLocked(authorizable)) {
			return false;
		}

		const permissions = authorizable.getUserPermissions(user.id);

		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		const canViewBoard = permissions.includes(Permission.BOARD_VIEW);
		return isBoard && canViewBoard;
	}

	private isSubmissionItemOfUser(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const { boardNode } = authorizable;
		return boardNode instanceof SubmissionItem && boardNode.userId === user.id;
	}
}
