import { ApiProperty } from '@nestjs/swagger';

export class RenameBodyParams {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	title!: string;
}
