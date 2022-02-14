import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Course, Board, User, TaskWithStatusVo, Lesson, BoardElementType, BoardElement, Task } from '@shared/domain';
import { RoomsAuthorisationService } from '../uc/rooms.authorisation.service';
import { RoomBoardDTO, RoomBoardElementDTO } from '../types/room-board.types';

@Injectable()
export class RoomBoardDTOMapper {
	constructor(private readonly authorisationService: RoomsAuthorisationService) {}

	// TODO: Refactoring

	// is it more of a factory?
	mapDTO({ room, board, user }: { room: Course; board: Board; user: User }): RoomBoardDTO {
		const elements = board.getElements();
		const filtered = elements.filter((element) => {
			let result = false;
			if (element.boardElementType === BoardElementType.Task) {
				result = this.authorisationService.hasTaskReadPermission(user, element.target as Task);
			} else if (element.boardElementType === BoardElementType.Lesson) {
				result = this.authorisationService.hasLessonReadPermission(user, element.target as Lesson);
			}
			return result;
		});

		const elementDTOs = filtered.map((el) => this.mapToBoardElementDTO(el, user, this.isTeacher(user, room)));
		const dto = {
			roomId: room.id,
			displayColor: room.color,
			title: room.name,
			elements: elementDTOs,
		};
		return dto;
	}

	private isTeacher(user: User, course: Course): boolean {
		if (course.teachers.contains(user) || course.substitutionTeachers.contains(user)) {
			return true;
		}
		return false;
	}

	private mapToBoardElementDTO(element: BoardElement, user: User, isTeacher: boolean): RoomBoardElementDTO {
		let content: TaskWithStatusVo | Lesson;
		let type: string;
		if (element.boardElementType === BoardElementType.Task) {
			type = 'task';
			const task = element.target as Task;
			content = new TaskWithStatusVo(
				task,
				isTeacher ? task.createTeacherStatusForUser(user) : task.createStudentStatusForUser(user)
			);
		} else if (element.boardElementType === BoardElementType.Lesson) {
			type = 'lesson';
			content = element.target as Lesson;
		} else {
			throw new InternalServerErrorException('board element type not supported');
		}
		return { type, content };
	}
}
