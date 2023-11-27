import { ApiProperty } from '@nestjs/swagger';

export class ContextExternalToolCountPerContextResponse {
	@ApiProperty()
	course: number;

	@ApiProperty()
	boardElement: number;

	constructor(props: ContextExternalToolCountPerContextResponse) {
		this.course = props.course;
		this.boardElement = props.boardElement;
	}
}
