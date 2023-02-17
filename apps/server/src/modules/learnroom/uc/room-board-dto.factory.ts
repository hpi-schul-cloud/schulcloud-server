import { Injectable } from '@nestjs/common';
import {
	BoardElement,
	BoardElementType,
	Course,
	ITaskStatus,
	Lesson,
	SingleColumnBoard,
	Task,
	TaskWithStatusVo,
	User,
} from '@shared/domain';
import { LessonMetaData, RoomBoardDTO, RoomBoardElementDTO, RoomBoardElementTypes } from '../types/room-board.types';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

class DtoCreator {
	room: Course;

	board: SingleColumnBoard;

	user: User;

	authorisationService: RoomsAuthorisationService;

	constructor({
		room,
		board,
		user,
		authorisationService,
	}: {
		room: Course;
		board: SingleColumnBoard;
		user: User;
		authorisationService: RoomsAuthorisationService;
	}) {
		this.room = room;
		this.board = board;
		this.user = user;
		this.authorisationService = authorisationService;
	}

	manufacture(): RoomBoardDTO {
		const elements = this.board.getElements();
		const filtered = this.filterByPermission(elements);

		const mappedElements = this.mapToElementDTOs(filtered);
		const dto = this.buildDTOWithElements(mappedElements);
		return dto;
	}

	private filterByPermission(elements: BoardElement[]) {
		const filtered = elements.filter((element) => {
			let result = false;
			if (element.boardElementType === BoardElementType.Task) {
				result = this.authorisationService.hasTaskReadPermission(this.user, element.target as Task);
			} else if (element.boardElementType === BoardElementType.Lesson) {
				result = this.authorisationService.hasLessonReadPermission(this.user, element.target as Lesson);
			}
			return result;
		});
		return filtered;
	}

	private isTeacher(): boolean {
		if (this.room.teachers.contains(this.user) || this.room.substitutionTeachers.contains(this.user)) {
			return true;
		}
		return false;
	}

	private mapToElementDTOs(elements: BoardElement[]) {
		const results: RoomBoardElementDTO[] = [];
		elements.forEach((element) => {
			if (element.boardElementType === BoardElementType.Task) {
				const mapped = this.mapTaskElement(element);
				results.push(mapped);
			}
			if (element.boardElementType === BoardElementType.Lesson) {
				const mapped = this.mapLessonElement(element);
				results.push(mapped);
			}
		});
		return results;
	}

	private mapTaskElement(element: BoardElement): RoomBoardElementDTO {
		const task = element.target as Task;
		const status = this.createTaskStatus(task);

		const content = new TaskWithStatusVo(task, status);
		return { type: RoomBoardElementTypes.TASK, content };
	}

	private createTaskStatus(task: Task): ITaskStatus {
		let status: ITaskStatus;
		if (this.isTeacher()) {
			status = task.createTeacherStatusForUser(this.user);
		} else {
			status = task.createStudentStatusForUser(this.user);
		}
		return status;
	}

	private mapLessonElement(element: BoardElement): RoomBoardElementDTO {
		const type = RoomBoardElementTypes.LESSON;
		const lesson = element.target as Lesson;
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

	private buildDTOWithElements(elements: RoomBoardElementDTO[]): RoomBoardDTO {
		const dto = {
			roomId: this.room.id,
			displayColor: this.room.color,
			title: this.room.name,
			elements,
		};
		return dto;
	}
}

@Injectable()
export class RoomBoardDTOFactory {
	constructor(private readonly authorisationService: RoomsAuthorisationService) {}

	createDTO({ room, board, user }: { room: Course; board: SingleColumnBoard; user: User }): RoomBoardDTO {
		const worker = new DtoCreator({ room, board, user, authorisationService: this.authorisationService });
		const result = worker.manufacture();
		return result;
	}
}
