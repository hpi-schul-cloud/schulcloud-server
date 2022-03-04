import { Injectable } from '@nestjs/common';
import {
	Course,
	Board,
	User,
	TaskWithStatusVo,
	Lesson,
	BoardElementType,
	BoardElement,
	Task,
	ITaskStatus,
} from '@shared/domain';
import { RoomsAuthorisationService } from './rooms.authorisation.service';
import { RoomBoardDTO, RoomBoardElementDTO, LockedTaskDTO, RoomBoardElementTypes } from '../types/room-board.types';

class DtoCreator {
	room: Course;

	board: Board;

	user: User;

	authorisationService: RoomsAuthorisationService;

	constructor({
		room,
		board,
		user,
		authorisationService,
	}: {
		room: Course;
		board: Board;
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
				result = this.authorisationService.hasTaskListPermission(this.user, element.target as Task);
			} else if (element.boardElementType === BoardElementType.Lesson) {
				result = this.authorisationService.hasLessonListPermission(this.user, element.target as Lesson);
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

		const hasReadPermission = this.authorisationService.hasTaskReadPermission(this.user, task);
		if (hasReadPermission) {
			return this.mapTaskWithStatusVO(task);
		}

		return this.mapTaskMetadataOnly(task);
	}

	private mapTaskWithStatusVO(task: Task): RoomBoardElementDTO {
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

	private mapTaskMetadataOnly(task: Task): RoomBoardElementDTO {
		const content: LockedTaskDTO = {
			id: task.id,
			name: task.name,
		};
		const result = { type: RoomBoardElementTypes.LOCKEDTASK, content };
		return result;
	}

	private mapLessonElement(element: BoardElement): RoomBoardElementDTO {
		const type = RoomBoardElementTypes.LESSON;
		const content = element.target as Lesson;
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

	createDTO({ room, board, user }: { room: Course; board: Board; user: User }): RoomBoardDTO {
		const worker = new DtoCreator({ room, board, user, authorisationService: this.authorisationService });
		const result = worker.manufacture();
		return result;
	}
}
