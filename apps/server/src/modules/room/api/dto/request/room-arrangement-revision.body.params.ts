import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export abstract class RoomArrangementRevisionBodyParams {
	@IsInt()
	@Min(0)
	@ApiProperty({
		description: 'The revision of the arrangement the change is based on. A stale revision is rejected with 409.',
		required: true,
		nullable: false,
		minimum: 0,
	})
	expectedRevision!: number;
}
