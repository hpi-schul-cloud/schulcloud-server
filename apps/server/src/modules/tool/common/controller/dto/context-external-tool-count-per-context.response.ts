import { ApiProperty } from '@nestjs/swagger';

export class ContextExternalToolCountPerContextResponse {
	@ApiProperty({ description: 'Amount of usages in courses' })
	public course: number;

	@ApiProperty({ description: 'Amount of usages in boards' })
	public boardElement: number;

	@ApiProperty({ description: 'Amount of usages in media boards' })
	public mediaBoard: number;

	constructor(props: ContextExternalToolCountPerContextResponse) {
		this.course = props.course;
		this.boardElement = props.boardElement;
		this.mediaBoard = props.mediaBoard;
	}
}
