import { BoardTaskStatusDto } from '../dto';
import { BoardTaskStatusResponse } from '../room-api-client';

export class BoardTaskStatusMapper {
	public static mapBoardTaskStatusToDto(status: BoardTaskStatusResponse): BoardTaskStatusDto {
		return new BoardTaskStatusDto({
			submitted: status.submitted,
			maxSubmissions: status.maxSubmissions,
			graded: status.graded,
			isDraft: status.isDraft,
			isSubstitutionTeacher: status.isSubstitutionTeacher,
			isFinished: status.isFinished,
		});
	}
}
