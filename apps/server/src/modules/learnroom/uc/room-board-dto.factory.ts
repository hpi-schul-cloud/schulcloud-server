import { Injectable } from '@nestjs/common';
import { Course, Board, User, TaskWithStatusVo, Lesson, BoardElementType, BoardElement, Task } from '@shared/domain';
import { RoomsAuthorisationService } from './rooms.authorisation.service';
import { RoomBoardDTO, RoomBoardElementDTO } from '../types/room-board.types';

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
		const filtered = this.filterElements(elements);

		const mapped = this.mapToElementDTOs(filtered);
		const dto = this.buildDTOWithElements(mapped);
		return dto;
	}

	private filterElements(elements: BoardElement[]) {
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
				const type = 'task';
				const task = element.target as Task;
				const content = new TaskWithStatusVo(
					task,
					this.isTeacher() ? task.createTeacherStatusForUser(this.user) : task.createStudentStatusForUser(this.user)
				);
				results.push({ type, content });
			}
			if (element.boardElementType === BoardElementType.Lesson) {
				const type = 'lesson';
				const content = element.target as Lesson;
				results.push({ type, content });
			}
		});
		return results;
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

	// TODO: Refactoring

	createDTO({ room, board, user }: { room: Course; board: Board; user: User }): RoomBoardDTO {
		const worker = new DtoCreator({ room, board, user, authorisationService: this.authorisationService });
		const result = worker.manufacture();
		return result;
	}
}
