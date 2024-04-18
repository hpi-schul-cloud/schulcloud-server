import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Action, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import {
	ColumnboardBoardElement,
	ColumnBoardNode,
	Course,
	LegacyBoard,
	LegacyBoardElement,
	LegacyBoardElementType,
	LessonEntity,
	Task,
	TaskWithStatusVo,
	User,
} from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { TaskStatus } from '@shared/domain/types';
import {
	ColumnBoardMetaData,
	LessonMetaData,
	RoomBoardDTO,
	RoomBoardElementDTO,
	RoomBoardElementTypes,
} from '../types/room-board.types';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

class DtoCreator {
	room: Course;

	board: LegacyBoard;

	user: User;

	authorisationService: AuthorizationService;

	roomsAuthorisationService: RoomsAuthorisationService;

	constructor({
		room,
		board,
		user,
		authorisationService,
		roomsAuthorisationService,
	}: {
		room: Course;
		board: LegacyBoard;
		user: User;
		authorisationService: AuthorizationService;
		roomsAuthorisationService: RoomsAuthorisationService;
	}) {
		this.room = room;
		this.board = board;
		this.user = user;
		this.authorisationService = authorisationService;
		this.roomsAuthorisationService = roomsAuthorisationService;
	}

	manufacture(): RoomBoardDTO {
		const elements = this.board.getElements();
		const filtered = this.filterByPermission(elements);

		const mappedElements = this.mapToElementDTOs(filtered);
		const dto = this.buildDTOWithElements(mappedElements);
		return dto;
	}

	private filterByPermission(elements: LegacyBoardElement[]) {
		const filtered = elements.filter((element) => {
			let result = false;
			if (element.boardElementType === LegacyBoardElementType.Task) {
				result = this.roomsAuthorisationService.hasTaskReadPermission(this.user, element.target as Task);
			}

			if (element.boardElementType === LegacyBoardElementType.Lesson) {
				result = this.roomsAuthorisationService.hasLessonReadPermission(this.user, element.target as LessonEntity);
			}

			if (element instanceof ColumnboardBoardElement && this.isColumnBoardFeatureFlagActive()) {
				result = this.authorisationService.hasPermission(this.user, this.room, {
					action: Action.read,
					requiredPermissions: [Permission.COURSE_VIEW],
				});
			}
			return result;
		});
		return filtered;
	}

	private isColumnBoardFeatureFlagActive() {
		const isActive = (Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean) === true;

		return isActive;
	}

	private isTeacher(): boolean {
		if (this.room.teachers.contains(this.user) || this.room.substitutionTeachers.contains(this.user)) {
			return true;
		}
		return false;
	}

	private mapToElementDTOs(elements: LegacyBoardElement[]) {
		const results: RoomBoardElementDTO[] = [];
		elements.forEach((element) => {
			if (element.boardElementType === LegacyBoardElementType.Task) {
				const mapped = this.mapTaskElement(element);
				results.push(mapped);
			}
			if (element.boardElementType === LegacyBoardElementType.Lesson) {
				const mapped = this.mapLessonElement(element);
				results.push(mapped);
			}
			if (element.boardElementType === LegacyBoardElementType.ColumnBoard) {
				const mapped = this.mapColumnBoardElement(element);
				results.push(mapped);
			}
		});
		return results;
	}

	private mapTaskElement(element: LegacyBoardElement): RoomBoardElementDTO {
		const task = element.target as Task;
		const status = this.createTaskStatus(task);

		const content = new TaskWithStatusVo(task, status);
		return { type: RoomBoardElementTypes.TASK, content };
	}

	private createTaskStatus(task: Task): TaskStatus {
		let status: TaskStatus;
		if (this.isTeacher()) {
			status = task.createTeacherStatusForUser(this.user);
		} else {
			status = task.createStudentStatusForUser(this.user);
		}
		return status;
	}

	private mapLessonElement(element: LegacyBoardElement): RoomBoardElementDTO {
		const type = RoomBoardElementTypes.LESSON;
		const lesson = element.target as LessonEntity;
		const content: LessonMetaData = {
			id: lesson.id,
			name: lesson.name,
			hidden: lesson.hidden,
			createdAt: lesson.createdAt,
			updatedAt: lesson.updatedAt,
			courseName: lesson.course.name,
			numberOfPublishedTasks: lesson.getNumberOfPublishedTasks(),
		};
		if (this.isTeacher()) {
			content.numberOfDraftTasks = lesson.getNumberOfDraftTasks();
			content.numberOfPlannedTasks = lesson.getNumberOfPlannedTasks();
		}
		return { type, content };
	}

	private mapColumnBoardElement(element: LegacyBoardElement): RoomBoardElementDTO {
		const type = RoomBoardElementTypes.COLUMN_BOARD;
		const columnBoardNode = element.target as ColumnBoardNode;
		const content: ColumnBoardMetaData = {
			id: columnBoardNode.id,
			columnBoardId: columnBoardNode.id,
			title: columnBoardNode.title || '',
			createdAt: columnBoardNode.createdAt,
			updatedAt: columnBoardNode.updatedAt,
			published: columnBoardNode.isVisible,
			layout: columnBoardNode.layout,
		};

		return { type, content };
	}

	private buildDTOWithElements(elements: RoomBoardElementDTO[]): RoomBoardDTO {
		const dto: RoomBoardDTO = {
			roomId: this.room.id,
			displayColor: this.room.color,
			title: this.room.name,
			elements,
			isArchived: this.room.isFinished(),
			isSynchronized: !!this.room.syncedWithGroup,
		};
		return dto;
	}
}

@Injectable()
export class RoomBoardDTOFactory {
	constructor(
		private readonly authorisationService: AuthorizationService,
		private readonly roomsAuthorisationService: RoomsAuthorisationService
	) {}

	createDTO({ room, board, user }: { room: Course; board: LegacyBoard; user: User }): RoomBoardDTO {
		const worker = new DtoCreator({
			room,
			board,
			user,
			authorisationService: this.authorisationService,
			roomsAuthorisationService: this.roomsAuthorisationService,
		});
		const result = worker.manufacture();
		return result;
	}
}
