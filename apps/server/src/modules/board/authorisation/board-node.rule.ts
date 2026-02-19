import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { UserService } from '@modules/user';
import { type User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
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

export const BoardOperationValues = [
	// board
	'copyBoard',
	'deleteBoard',
	'findBoard',
	'relocateContent',
	'shareBoard',
	'updateBoardLayout',
	'updateBoardTitle',
	'updateReadersCanEditSetting',

	// column
	'createColumn',
	'deleteColumn',
	'moveColumn',
	'updateColumnTitle',

	// card
	'copyCard',
	'createCard',
	'deleteCard',
	'findCards',
	'moveCard',
	'shareCard',
	'updateCardHeight',
	'updateCardTitle',

	// element
	'createElement',
	'deleteElement',
	'moveElement',
	'updateElement',
	'viewElement',

	// element / externalToolElement
	'createExternalToolElement',

	// element / fileElement
	'createFileElement',

	// element / submissionElement
	'createSubmissionItemContent',
	'deleteSubmissionItem',
	'updateSubmissionItem',

	// element / videoConferenceElement
	'manageVideoConference',

	// mediaBoard
	'collapseMediaBoard',
	'updateBoardVisibility',
	'updateMediaBoardColor',
	'updateMediaBoardLayout',
	'viewMediaBoard',

	// mediaBoardLine
	'collapseMediaBoardLine',
	'createMediaBoardLine',
	'deleteMediaBoardLine',
	'updateMediaBoardLine',
	'updateMediaBoardLineColor',
] as const;

export type BoardOperation = (typeof BoardOperationValues)[number]; // turn string list to type union of strings

type OperationFn = (user: User, authorizable: BoardNodeAuthorizable) => boolean;

@Injectable()
export class BoardNodeRule implements Rule<BoardNodeAuthorizable> {
	constructor(authorisationInjectionService: AuthorizationInjectionService, private readonly userService: UserService) {
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
		const schoolPermissions: Permission[] = this.userService.resolvePermissions(user);
		const boardPermissions = authorizable.getUserPermissions(user.id);

		const permissions = Array.from(new Set([...schoolPermissions, ...boardPermissions]));
		return requiredPermissions.every((p) => permissions.includes(p));
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	public getOperationMap() {
		const map = {
			// board
			copyBoard: _canManageBoard,
			deleteBoard: _canManageBoard,
			findBoard: canFindBoard,
			relocateContent: canRelocateContent,
			shareBoard: canShareBoardNode,
			updateBoardLayout: _canManageBoard,
			updateBoardTitle: _canEditBoard,
			updateReadersCanEditSetting: canUpdateReadersCanEditSetting,

			// column
			createColumn: _canEditBoard,
			deleteColumn: _canEditBoard,
			moveColumn: _canEditBoard,
			updateColumnTitle: _canEditBoard,

			// card
			copyCard: _canEditBoard,
			createCard: _canEditBoard,
			deleteCard: _canEditBoard,
			findCards: _canViewBoard,
			moveCard: _canEditBoard,
			shareCard: canShareBoardNode,
			updateCardHeight: _canEditBoard,
			updateCardTitle: _canEditBoard,

			// element
			createElement: _canEditBoard,
			deleteElement: _canEditBoard,
			moveElement: _canEditBoard,
			updateElement: _canEditBoard,
			viewElement: _canViewBoard,

			// element / externalToolElement
			createExternalToolElement: _canCreateExternalToolElement,

			// element / fileElement
			createFileElement: _canEditBoard,

			// element / submissionElement
			createSubmissionItemContent: _isSubmissionItemOfUser,
			deleteSubmissionItem: _isSubmissionItemOfUser,
			updateSubmissionItem: _isSubmissionItemOfUser,

			// element / videoConferenceElement
			manageVideoConference: canManageVideoConference,

			// mediaBoard
			collapseMediaBoard: _canManageBoard,
			updateBoardVisibility: _canManageBoard,
			updateMediaBoardColor: _canEditBoard,
			updateMediaBoardLayout: _canManageBoard,
			viewMediaBoard: _canViewBoard,

			// mediaBoardLine
			collapseMediaBoardLine: _canEditBoard,
			createMediaBoardLine: _canEditBoard,
			deleteMediaBoardLine: _canEditBoard,
			updateMediaBoardLine: _canEditBoard,
			updateMediaBoardLineColor: _canEditBoard,
		} satisfies Record<BoardOperation, OperationFn>;

		return map;
	}

	public listAllowedOperations(user: User, authorizable: BoardNodeAuthorizable): Record<BoardOperation, boolean> {
		const list: Record<BoardOperation, boolean> = {} as Record<BoardOperation, boolean>;
		const map = this.getOperationMap();
		const operations = Object.keys(map) as BoardOperation[];

		for (const operation of operations) {
			const fn = map[operation];
			list[operation] = fn(user, authorizable);
		}

		return list;
	}

	public can(operation: BoardOperation, user: User, authorizable: BoardNodeAuthorizable): boolean {
		const canFunction = this.getOperationMap()[operation];

		const can = canFunction(user, authorizable);

		return can;
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
}

const _canEditBoard = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canEditBoard = permissions.includes(Permission.BOARD_EDIT);
	return isBoard && canEditBoard;
};

const _canManageBoard = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canManageBoard = permissions.includes(Permission.BOARD_MANAGE);
	return isBoard && canManageBoard;
};

const _canViewBoard = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canViewBoard = permissions.includes(Permission.BOARD_VIEW);
	return isBoard && canViewBoard;
};

const _isSubmissionItemOfUser = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const { boardNode } = authorizable;
	return boardNode instanceof SubmissionItem && boardNode.userId === user.id;
};

const _canCreateExternalToolElement = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canCreateExternalToolElement = permissions.includes(Permission.CONTEXT_TOOL_ADMIN);

	return isBoard && canCreateExternalToolElement;
};

const canFindBoard = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const canViewBoard = _canViewBoard(user, authorizable);
	const permissions = authorizable.getUserPermissions(user.id);

	if (
		authorizable.rootNode instanceof ColumnBoard &&
		!authorizable.rootNode.isVisible &&
		!permissions.includes(Permission.BOARD_EDIT)
	) {
		return false;
	}

	return canViewBoard;
};

const canManageVideoConference = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canManageVideoConference = permissions.includes(Permission.BOARD_MANAGE_VIDEOCONFERENCE);
	return isBoard && canManageVideoConference;
};

const canUpdateReadersCanEditSetting = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.boardNode instanceof ColumnBoard;
	const hasManageReadersCanEditPermission = permissions.includes(Permission.BOARD_MANAGE_READERS_CAN_EDIT);

	return isBoard && hasManageReadersCanEditPermission;
};

const canRelocateContent = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard;
	const hasRelocateContentPermission = permissions.includes(Permission.BOARD_RELOCATE_CONTENT);

	return isBoard && hasRelocateContentPermission;
};

const canShareBoardNode = (user: User, authorizable: BoardNodeAuthorizable): boolean => {
	const permissions = authorizable.getUserPermissions(user.id);

	const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
	const canShareBoard = permissions.includes(Permission.BOARD_SHARE_BOARD);

	return isBoard && canShareBoard;
};
