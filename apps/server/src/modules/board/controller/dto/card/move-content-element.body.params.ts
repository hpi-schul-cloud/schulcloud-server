import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class MoveContentElementBody {
	@IsMongoId()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toCardId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		required: true,
		nullable: false,
	})
	toIndex!: number;
}
