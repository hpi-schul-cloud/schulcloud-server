import { ApiProperty } from '@nestjs/swagger';
import { CreateBoardBodyParams } from './create-board.body.params';

export class ManyBoards {
	@ApiProperty({
		type: [CreateBoardBodyParams],
		description: 'Array of created board responses',
	})
	public boards: CreateBoardBodyParams[] = [];
}
