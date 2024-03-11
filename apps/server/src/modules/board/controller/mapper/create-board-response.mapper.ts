import { ColumnBoard } from '@shared/domain/domainobject';
import { CreateBoardResponse } from '../dto';

export class CreateBoardResponseMapper {
	static mapToResponse(board: ColumnBoard): CreateBoardResponse {
		const result = new CreateBoardResponse({
			id: board.id,
		});

		return result;
	}
}
