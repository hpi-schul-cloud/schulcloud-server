import { ITaskStatus } from '@shared/domain';
import { BoardTaskStatusResponse } from '../controller/dto/roomBoardResponse-taskStatus';

export class BoardTaskStatusMapper {
	static mapToResponse(status: ITaskStatus): BoardTaskStatusResponse {
		const dto = new BoardTaskStatusResponse(status);

		return dto;
	}
}
