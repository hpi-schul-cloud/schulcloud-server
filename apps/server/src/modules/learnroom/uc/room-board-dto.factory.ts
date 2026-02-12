import { Action, AuthorizationService } from '@modules/authorization';
import { CourseEntity } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repo';
import { TaskStatus } from '@modules/task';
import { Task, TaskWithStatusVo } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { ColumnBoardBoardElement, LegacyBoard, LegacyBoardElement, LegacyBoardElementType } from '../repo';
import {
	ColumnBoardMetaData,
	ColumnBoardNode,
	LessonMetaData,
	RoomBoardDTO,
	RoomBoardElementDTO,
	RoomBoardElementTypes,
} from '../types/room-board.types';
import { CourseRoomsAuthorisationService } from './course-rooms.authorisation.service';

class DtoCreator {
	public room: CourseEntity;

	public board: LegacyBoard;

	public user: User;

	public authorisationService: AuthorizationService;

	public roomsAuthorisationService: CourseRoomsAuthorisationService;

	private learnroomConfig: LearnroomConfig;

	constructor({
		room,
		board,
		user,
		authorisationService,
		roomsAuthorisationService,
		config,
	}: {
		room: CourseEntity;
		board: LegacyBoard;
		user: User;
		authorisationService: AuthorizationService;
		roomsAuthorisationService: CourseRoomsAuthorisationService;
		config: LearnroomConfig;
	}) {
		this.room = room;
		this.board = board;
		this.user = user;
		this.authorisationService = authorisationService;
		this.roomsAuthorisationService = roomsAuthorisationService;
		this.learnroomConfig = config;
	}

	public manufacture(): RoomBoardDTO {
		const elements = this.board.getElements();
		const filtered = this.filterByPermission(elements);

		const mappedElements = this.mapToElementDTOs(filtered);
		const dto = this.buildDTOWithElements(mappedElements);
		return dto;
	}

	private filterByPermission(elements: LegacyBoardElement[]): LegacyBoardElement[] {
		const filtered = elements.filter((element) => {
			let result = false;
			if (element.boardElementType === LegacyBoardElementType.Task) {
				result = this.roomsAuthorisationService.hasTaskReadPermission(this.user, element.target as Task);
			}

			if (element.boardElementType === LegacyBoardElementType.Lesson) {
				result = this.roomsAuthorisationService.hasLessonReadPermission(this.user, element.target as LessonEntity);
			}

			if (element instanceof ColumnBoardBoardElement && this.isColumnBoardFeatureFlagActive()) {
				result = this.authorisationService.hasPermission(this.user, this.room, {
					action: Action.read,
					requiredPermissions: [Permission.COURSE_VIEW],
				});
			}
			return result;
		});
		return filtered;
	}

	private isColumnBoardFeatureFlagActive(): boolean {
		const isActive = this.learnroomConfig.featureColumnBoardEnabled === true;

		return isActive;
	}

	private isTeacher(): boolean {
		if (this.room.teachers.contains(this.user) || this.room.substitutionTeachers.contains(this.user)) {
			return true;
		}
		return false;
	}

	private mapToElementDTOs(elements: LegacyBoardElement[]): RoomBoardElementDTO[] {
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
		private readonly roomsAuthorisationService: CourseRoomsAuthorisationService,
		@Inject(LEARNROOM_CONFIG_TOKEN) private readonly learnroomConfig: LearnroomConfig
	) {}

	public createDTO({ room, board, user }: { room: CourseEntity; board: LegacyBoard; user: User }): RoomBoardDTO {
		const worker = new DtoCreator({
			room,
			board,
			user,
			authorisationService: this.authorisationService,
			roomsAuthorisationService: this.roomsAuthorisationService,
			config: this.learnroomConfig,
		});
		const result = worker.manufacture();
		return result;
	}
}
