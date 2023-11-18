import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
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
} from '@shared/domain';
import { PermissionContextRepo, CourseRepo } from '@shared/repo';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

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
		await Promise.all(ids.map((id) => this.migrateColumnBoardToPermissionContext(id)));

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
		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
		});

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

		return columnBoard;
	}

	private createRichTextElement(text: string): RichTextElement {
		const element: RichTextElement = this.contentElementFactory.build(ContentElementType.RICH_TEXT) as RichTextElement;
		element.text = text;

		return element;
	}

	// NOTE: this is a idempotent in-place migration for POC purposes
	private async migrateColumnBoardToPermissionContext(id: EntityId) {
		const hasPermissionContext = await this.permissionCtxRepo
			.findByContextReference(id)
			.then(() => true)
			.catch((e) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (e.status === 404) return false;
				throw e;
			});
		const board = await this.boardDoRepo.findById(id, 1);

		if (
			!hasPermissionContext &&
			board instanceof ColumnBoard &&
			board.context.type === BoardExternalReferenceType.Course
		) {
			// NOTE: apply migration, defaulting to course context
			const course = await this.courseRepo.findById(board.context.id);

			// NOTE: hardcoded permissions for POC purposes
			const STUDENT_PERMISSIONS = [Permission.BOARD_READ];
			const TEACHER_PERMISSIONS = [
				Permission.BOARD_READ,
				Permission.BOARD_CREATE_COLUMN,
				Permission.BOARD_CREATE_COLUMN,
				Permission.BOARD_DELETE,
				Permission.BOARD_UPDATE_TITLE,
			];
			const SUBSTITUTE_TEACHER_PERMISSIONS = [...TEACHER_PERMISSIONS];

			const studentIds = course.getStudentIds().map((userId) => {
				return {
					userId,
					includedPermissions: STUDENT_PERMISSIONS,
					excludedPermissions: [],
				};
			});
			const teacherIds = course.getTeacherIds().map((userId) => {
				return {
					userId,
					includedPermissions: TEACHER_PERMISSIONS,
					excludedPermissions: [],
				};
			});
			const substituteTeacherIds = course.getSubstitutionTeacherIds().map((userId) => {
				return {
					userId,
					includedPermissions: SUBSTITUTE_TEACHER_PERMISSIONS,
					excludedPermissions: [],
				};
			});

			const permissionCtxEntity = new PermissionContextEntity({
				name: 'ColumnBoard with course context',
				parentContext: null,
				contextReference: new ObjectId(id),
				userDelta: new UserDelta([...studentIds, ...teacherIds, ...substituteTeacherIds]),
			});

			await this.permissionCtxRepo.save(permissionCtxEntity);
		}
	}
}
