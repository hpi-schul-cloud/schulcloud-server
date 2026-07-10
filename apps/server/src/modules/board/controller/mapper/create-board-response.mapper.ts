import { type ColumnBoard } from '../../domain';
import { CreateBoardResponse } from '../dto';

export class CreateBoardResponseMapper {
	public static mapToResponse(board: ColumnBoard): CreateBoardResponse {
		const result = new CreateBoardResponse({
			id: board.id,
		});

		return result;
	}
}
