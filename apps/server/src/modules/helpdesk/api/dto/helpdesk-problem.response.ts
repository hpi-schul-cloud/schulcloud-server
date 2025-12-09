import { ApiProperty } from '@nestjs/swagger';
import { HelpdeskProblemState } from '../../domain/type';

export class HelpdeskProblemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	subject: string;

	@ApiProperty({ required: false })
	currentState?: string;

	@ApiProperty({ required: false })
	targetState?: string;

	@ApiProperty({ enum: HelpdeskProblemState })
	state: HelpdeskProblemState;

	@ApiProperty({ required: false })
	notes?: string;

	@ApiProperty({ required: false })
	order?: number;

	@ApiProperty({ required: false })
	userId?: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty({ required: false })
	forwardedAt?: Date;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	constructor(props: HelpdeskProblemResponse) {
		this.id = props.id;
		this.subject = props.subject;
		this.currentState = props.currentState;
		this.targetState = props.targetState;
		this.state = props.state;
		this.notes = props.notes;
		this.order = props.order;
		this.userId = props.userId;
		this.schoolId = props.schoolId;
		this.forwardedAt = props.forwardedAt;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}
