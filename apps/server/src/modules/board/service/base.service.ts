import {
	AnyBoardDo,
	AnyContentElementDo,
	Card,
	Column,
	ColumnBoard,
	Course,
	EntityId,
	PermissionContextEntity,
	PermissionCrud,
	SubmissionContainerElement,
	SubmissionItem,
	User,
	UserDelta,
	isCard,
	isColumn,
} from '@shared/domain';
import { ObjectId } from 'bson';
import { CourseRepo, PermissionContextRepo } from '@shared/repo';
import { BoardDoRepo } from '../repo';

const DEFAULT_TEACHER_PERMISSIONS = [
	PermissionCrud.CREATE,
	PermissionCrud.READ,
	PermissionCrud.UPDATE,
	PermissionCrud.DELETE,
];
const DEFAULT_SUBSTITUTE_TEACHER_PERMISSIONS = DEFAULT_TEACHER_PERMISSIONS;

const DEFAULT_STUDENT_PERMISSIONS = [PermissionCrud.READ];

export abstract class BaseService {
	constructor(
		protected readonly permissionCtxRepo: PermissionContextRepo,
		protected readonly boardDoRepo: BoardDoRepo,
		protected readonly courseRepo: CourseRepo
	) {}

	protected async createBoardPermissionCtx(
		referenceId: EntityId,
		parentReferenceId: EntityId | null,
		name?: string
	): Promise<PermissionContextEntity> {
		const parentContext = parentReferenceId
			? await this.permissionCtxRepo.findByContextReference(parentReferenceId)
			: null;

		const permissionCtxEntity = new PermissionContextEntity({
			name,
			parentContext,
			contextReference: new ObjectId(referenceId),
		});
		await this.permissionCtxRepo.save(permissionCtxEntity);

		return permissionCtxEntity;
	}

	protected async findCourseMembers(
		boardDo: AnyBoardDo
	): Promise<{ students: User[]; teachers: User[]; substituteTeachers: User[] }> {
		const rootId = (await this.boardDoRepo.getAncestorIds(boardDo))[0];

		const columnBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, rootId);
		const course = await this.courseRepo.findById(columnBoard.context.id);

		return {
			students: course.students.getItems(),
			teachers: course.teachers.getItems(),
			substituteTeachers: course.substitutionTeachers.getItems(),
		};
	}

	protected async pocCreateSubmissionItemPermissionCtx(
		userId: EntityId,
		submissionContainer: SubmissionContainerElement,
		submissionItemId: EntityId
	) {
		// NOTE: this will be simplified once we have user groups
		const parentContext = await this.permissionCtxRepo.findByContextReference(submissionContainer.id);

		const rootId = (await this.boardDoRepo.getAncestorIds(submissionContainer))[0];
		const columnBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, rootId);
		const course = await this.courseRepo.findById(columnBoard.context.id);
		const revokeStudentsPermissions = course.students
			.getItems()
			.filter((student) => student.id !== userId)
			.map((student) => {
				return {
					userId: student.id,
					includedPermissions: [],
					excludedPermissions: [PermissionCrud.UPDATE, PermissionCrud.DELETE],
				};
			});

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Element permission context',
			parentContext,
			contextReference: new ObjectId(submissionItemId),
			userDelta: new UserDelta(revokeStudentsPermissions),
		});
		await this.permissionCtxRepo.save(permissionCtxEntity);
	}

	protected async pocCreateElementPermissionCtx(element: AnyContentElementDo, parent: Card | SubmissionItem) {
		const parentContext = await this.permissionCtxRepo.findByContextReference(parent.id);

		if (element instanceof SubmissionContainerElement) {
			// NOTE: this will be simplified once we have user groups
			const rootId = (await this.boardDoRepo.getAncestorIds(parent))[0];
			const columnBoard = await this.boardDoRepo.findByClassAndId(ColumnBoard, rootId);
			const course = await this.courseRepo.findById(columnBoard.context.id);
			const updatedStudentsPermissions = course.students.getItems().map((student) => {
				return {
					userId: student.id,
					includedPermissions: [PermissionCrud.CREATE],
					excludedPermissions: [],
				};
			});
			const permissionCtxEntity = new PermissionContextEntity({
				name: 'SubmissionContainerElement permission context',
				parentContext,
				contextReference: new ObjectId(element.id),
				userDelta: new UserDelta(updatedStudentsPermissions),
			});
			await this.permissionCtxRepo.save(permissionCtxEntity);
		} else {
			const permissionCtxEntity = new PermissionContextEntity({
				name: 'Element permission context',
				parentContext,
				contextReference: new ObjectId(element.id),
			});
			await this.permissionCtxRepo.save(permissionCtxEntity);
		}
	}

	// NOTE: this is a idempotent in-place migration for POC purposes
	protected async pocMigrateBoardToPermissionContext(id: EntityId) {
		const hasPermissionContext = await this.permissionCtxRepo
			.findByContextReference(id)
			.then(() => true)
			.catch((e) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (e.status === 404) return false;
				throw e;
			});
		const board = await this.boardDoRepo.findById(id, 10);

		if (hasPermissionContext) return;

		if (board instanceof ColumnBoard) {
			// const contextStore: Map<string, PermissionContextEntity> = new Map();

			const course = await this.courseRepo.findById(board.context.id);
			await this.pocCreateColumnBoardToPermissionContext(board, course);
		}
	}

	protected async pocCreateColumnBoardToPermissionContext(
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

	protected async pocCreateColumnToPermissionContext(
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

		const { children } = await this.boardDoRepo.findById(column.id, 10);

		const cards = children.filter((child): child is Card => isCard(child));

		await Promise.all(
			cards.map(async (card) =>
				this.pocCreateOtherToPermissionContext(card, permissionCtxEntity, course, 'Card with course context')
			)
		);

		return permissionCtxEntity;
	}

	protected async pocCreateOtherToPermissionContext<T extends AnyBoardDo>(
		boardNode: T,
		parentContext: PermissionContextEntity,
		course: Course,
		name = 'Boardnode with course context'
	): Promise<PermissionContextEntity> {
		// NOTE: apply migration, defaulting to course context

		let permissionCtxEntity = new PermissionContextEntity({
			name,
			parentContext,
			contextReference: new ObjectId(boardNode.id),
			userDelta: new UserDelta([]),
		});

		if (boardNode instanceof SubmissionContainerElement) {
			const students = course.getStudentIds().map((userId) => {
				return {
					userId,
					includedPermissions: [PermissionCrud.CREATE],
					excludedPermissions: [],
				};
			});

			permissionCtxEntity = new PermissionContextEntity({
				name: 'SubmissionContainerElement with course context',
				parentContext,
				contextReference: new ObjectId(boardNode.id),
				userDelta: new UserDelta(students),
			});
		}

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const elements = boardNode.children.filter((el) => !(el instanceof SubmissionItem));
		await Promise.all(
			elements.map((el) =>
				this.pocCreateOtherToPermissionContext(el, permissionCtxEntity, course, 'Element with course context')
			)
		);

		const { children } = await this.boardDoRepo.findById(boardNode.id, 10);

		const submissionItems = children.filter((el): el is SubmissionItem => el instanceof SubmissionItem);
		await Promise.all(
			submissionItems.map((submissionItem) =>
				this.pocCreateSubmissionItemToPermissionContext(submissionItem, permissionCtxEntity, course)
			)
		);

		return permissionCtxEntity;
	}

	protected async pocCreateSubmissionItemToPermissionContext(
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
					excludedPermissions: [
						PermissionCrud.UPDATE,
						PermissionCrud.DELETE,
						PermissionCrud.CREATE,
						PermissionCrud.READ,
					],
				};
			});

		const studentIds = [
			...otherStudentIds,
			{
				userId: boardNode.userId,
				includedPermissions: [PermissionCrud.UPDATE, PermissionCrud.DELETE],
				excludedPermissions: [],
			},
		];

		const permissionCtxEntity = new PermissionContextEntity({
			name: 'Submission item with course context',
			parentContext,
			contextReference: new ObjectId(boardNode.id),
			userDelta: new UserDelta([...studentIds]),
		});

		await this.permissionCtxRepo.save(permissionCtxEntity);

		const { children: submissionItemElements } = await this.boardDoRepo.findById(boardNode.id, 10);

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
