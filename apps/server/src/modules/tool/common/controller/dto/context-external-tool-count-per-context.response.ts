import { ApiProperty } from '@nestjs/swagger';

export class ContextExternalToolCountPerContextResponse {
	@ApiProperty({ description: 'Amount of usages in courses' })
	course: number;

	@ApiProperty({ description: 'Amount of usages in boards' })
	boardElement: number;

	@ApiProperty({ description: 'Amount of usages in media boards' })
	mediaBoard: number;

	constructor(props: ContextExternalToolCountPerContextResponse) {
		this.course = props.course;
		this.boardElement = props.boardElement;
		this.mediaBoard = props.mediaBoard;
	}
}
