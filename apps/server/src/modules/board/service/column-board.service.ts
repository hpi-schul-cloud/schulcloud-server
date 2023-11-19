import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import {
	AnyBoardDo,
	BoardExternalReference,
	Card,
	Column,
	ColumnBoard,
	ContentElementFactory,
	ContentElementType,
	EntityId,
	RichTextElement,
	Permission,
	PermissionContextEntity,
	UserDelta,
	Course,
	isColumn,
	SubmissionItem,
	isCard,
} from '@shared/domain';
import { PermissionContextRepo, CourseRepo } from '@shared/repo';
import { Forbidden } from '@feathersjs/errors';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

const DEFAULT_TEACHER_PERMISSIONS = [
	Permission.BOARD_READ,
	Permission.BOARD_COLUMN_CREATE,
	Permission.BOARD_DELETE,
	Permission.BOARD_UPDATE_TITLE,

	Permission.BOARD_COLUMN_CREATE,
	Permission.BOARD_COLUMN_MOVE,
	Permission.BOARD_COLUMN_DELETE,
	Permission.BOARD_COLUMN_UPDATE_TITLE,

	Permission.BOARD_CARD_CREATE,
	Permission.BOARD_CARD_MOVE,
];
const DEFAULT_SUBSTITUTE_TEACHER_PERMISSIONS = DEFAULT_TEACHER_PERMISSIONS;

const DEFAULT_STUDENT_PERMISSIONS = [Permission.BOARD_READ];

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory,
		private readonly permissionCtxRepo: PermissionContextRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		return board;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const ids = await this.boardDoRepo.findIdsByExternalReference(reference);
		// run migrateColumnBoardToPermissionContext for each id await
		await Promise.all(ids.map((id) => this.pocMigrateBoardToPermissionContext(id)));

		return ids;
	}

	async findByDescendant(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const ancestorIds: EntityId[] = await this.boardDoRepo.getAncestorIds(boardDo);
		const idHierarchy: EntityId[] = [...ancestorIds, boardDo.id];
		const rootId: EntityId = idHierarchy[0];
		const rootBoardDo: AnyBoardDo = await this.boardDoRepo.findById(rootId, 1);

		if (rootBoardDo instanceof ColumnBoard) {
			return rootBoardDo;
		}

		throw new NotFoundLoggableException(ColumnBoard.name, 'id', rootId);
	}

	async getBoardObjectTitlesById(boardIds: EntityId[]): Promise<Record<EntityId, string>> {
		const titleMap = this.boardDoRepo.getTitlesByIds(boardIds);
		return titleMap;
	}

	async create(context: BoardExternalReference, title = ''): Promise<ColumnBoard> {
		if (context.type !== 'course') throw new Forbidden('Only course boards are allowed');

		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
		});

		const course = await this.courseRepo.findById(context.id);
		await this.pocCreateColumnBoardToPermissionContext(columnBoard, course);

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	async updateTitle(board: ColumnBoard, title: string): Promise<void> {
		board.title = title;
		await this.boardDoRepo.save(board);
	}

	async createWelcomeColumnBoard(courseReference: BoardExternalReference) {
		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context: courseReference,
		});

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		columnBoard.addChild(column);

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: 'Willkommen auf dem neuen Spalten-Board! 🥳',
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		column.addChild(card);

		const text1 = this.createRichTextElement(
			'<p>Wir erweitern das Board kontinuierlich um wichtige Funktionen. <strong>Der aktuelle Stand kann hier getestet werden. </strong></p>'
		);
		card.addChild(text1);

		if (Configuration.has('COLUMN_BOARD_HELP_LINK')) {
			const helplink = Configuration.get('COLUMN_BOARD_HELP_LINK') as string;
			const text2 = this.createRichTextElement(
				`<p><strong> Wichtige Informationen</strong> zu Berechtigungen und Informationen zum Einsatz des Boards sind im <a href="${helplink}">Hilfebereich</a> zusammengefasst.</p>`
			);
			card.addChild(text2);
		}

		if (Configuration.has('COLUMN_BOARD_FEEDBACK_LINK')) {
			const feedbacklink = Configuration.get('COLUMN_BOARD_FEEDBACK_LINK') as string;
			const text3 = this.createRichTextElement(
				`<p>Wir freuen uns sehr über <strong>Feedback</strong> zum Board unter <a href="${feedbacklink}">folgendem Link</a>.</p>`
			);
			card.addChild(text3);
		}

		const SC_THEME = Configuration.get('SC_THEME') as string;
		if (SC_THEME !== 'default') {
			const clientUrl = Configuration.get('HOST') as string;
			const text4 = this.createRichTextElement(
				`<p>Wir freuen uns über <a href="${clientUrl}/help/contact/">Feedback und Wünsche</a>.</p>`
			);
			card.addChild(text4);
		}

		await this.boardDoRepo.save(columnBoard);

		await this.pocMigrateBoardToPermissionContext(columnBoard.id);

		return columnBoard;
	}

	private createRichTextElement(text: string): RichTextElement {
		const element: RichTextElement = this.contentElementFactory.build(ContentElementType.RICH_TEXT) as RichTextElement;
		element.text = text;

		return element;
	}

	// NOTE: this is a idempotent in-place migration for POC purposes
	private async pocMigrateBoardToPermissionContext(id: EntityId) {
		const hasPermissionContext = await this.permissionCtxRepo
			.findByContextReference(id)
			.then(() => true)
			.catch((e) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (e.status === 404) return false;
				throw e;
			});
		const board = await this.boardDoRepo.findById(id, 1);

		if (hasPermissionContext) return;

		if (board instanceof ColumnBoard) {
			// const contextStore: Map<string, PermissionContextEntity> = new Map();

			const course = await this.courseRepo.findById(board.context.id);
			await this.pocCreateColumnBoardToPermissionContext(board, course);
		}
	}

	private async pocCreateColumnBoardToPermissionContext(
		columnBoard: ColumnBoard,
		course: Course
	): Promise<PermissionContextEntity> {
		// NOTE: apply migration, defaulting to course context

		// NOTE: hardcoded permissions for POC purposes
		const studentIds = course.getStudentIds().map((userId) => {
			return {
				userId,
				includedPermissions: DEFAULT_STUDENT_PERMISSIONS,
				excludedPermissions: [],
			};
		});
		const teacherIds = course.getTeacherIds().map((userId) => {
			return {
				userId,
				includedPermissions: DEFAULT_TEACHER_PERMISSIONS,
				excludedPermissions: [],
			};
		});
		const substituteTeacherIds = course.getSubstitutionTeacherIds().map((userId) => {
			return {
				userId,
				includedPermissions: DEFAULT_SUBSTITUTE_TEACHER_PERMISSIONS,
				excludedPermissions: [],
			};
		});

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'ColumnBoard with course context',
			parentContext: null,
			contextReference: new ObjectId(columnBoard.id),
			userDelta: new UserDelta([...studentIds, ...teacherIds, ...substituteTeacherIds]),
		});

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const columns = columnBoard.children.filter((child): child is Column => isColumn(child));
		await Promise.all(
			columns.map(async (column) => this.pocCreateColumnToPermissionContext(column, permissionCtxEntity, course))
		);

		return permissionCtxEntity;
	}

	private async pocCreateColumnToPermissionContext(
		column: Column,
		parentContext: PermissionContextEntity,
		course: Course
	): Promise<PermissionContextEntity> {
		// NOTE: apply migration, defaulting to course context

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Column with course context',
			parentContext,
			contextReference: new ObjectId(column.id),
			userDelta: new UserDelta([]),
		});

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const { children } = await this.boardDoRepo.findById(column.id, 1);

		const cards = children.filter((child): child is Card => isCard(child));

		await Promise.all(
			cards.map(async (card) =>
				this.pocCreateOtherToPermissionContext(card, permissionCtxEntity, course, 'Card with course context')
			)
		);

		return permissionCtxEntity;
	}

	private async pocCreateOtherToPermissionContext<T extends AnyBoardDo>(
		boardNode: T,
		parentContext: PermissionContextEntity,
		course: Course,
		name = 'Boardnode with course context'
	): Promise<PermissionContextEntity> {
		// NOTE: apply migration, defaulting to course context

		const permissionCtxEntity = new PermissionContextEntity({
			name,
			parentContext,
			contextReference: new ObjectId(boardNode.id),
			userDelta: new UserDelta([]),
		});

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const elements = boardNode.children.filter((el): el is SubmissionItem => !(el instanceof SubmissionItem));
		await Promise.all(
			elements.map((el) =>
				this.pocCreateOtherToPermissionContext(el, permissionCtxEntity, course, 'Element with course context')
			)
		);

		const { children } = await this.boardDoRepo.findById(boardNode.id, 1);

		const submissionItems = children.filter((el): el is SubmissionItem => el instanceof SubmissionItem);
		await Promise.all(
			submissionItems.map((submissionItem) =>
				this.pocCreateSubmissionItemToPermissionContext(submissionItem, permissionCtxEntity, course)
			)
		);

		return permissionCtxEntity;
	}

	private async pocCreateSubmissionItemToPermissionContext(
		boardNode: SubmissionItem,
		parentContext: PermissionContextEntity,
		course: Course
	): Promise<PermissionContextEntity> {
		// NOTE: apply migration, defaulting to course context
		const otherStudentIds = course
			.getStudentIds()
			.filter((userId) => userId !== boardNode.userId)
			.map((userId) => {
				return {
					userId,
					includedPermissions: [],
					excludedPermissions: [Permission.BOARD_READ],
				};
			});

		const studentIds = [
			...otherStudentIds,
			{ userId: boardNode.userId, includedPermissions: [Permission.BOARD_READ], excludedPermissions: [] },
		];

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Submission item with course context',
			parentContext,
			contextReference: new ObjectId(boardNode.id),
			userDelta: new UserDelta([...studentIds]),
		});

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const { children: submissionItemElements } = await this.boardDoRepo.findById(boardNode.id, 1);

		await Promise.all(
			submissionItemElements.map((el) =>
				this.pocCreateOtherToPermissionContext(
					el,
					permissionCtxEntity,
					course,
					'SubmissionItemElement with course context'
				)
			)
		);

		return permissionCtxEntity;
	}
}
