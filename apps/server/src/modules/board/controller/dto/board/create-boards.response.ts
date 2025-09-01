import { ApiProperty } from '@nestjs/swagger';
import { CreateBoardsBodyParams } from './create-boards.body.params';

export class ManyBoards {
	@ApiProperty({
		type: [CreateBoardsBodyParams],
		description: 'Array of created board responses',
	})
	public boards: CreateBoardsBodyParams[] = [];
}
