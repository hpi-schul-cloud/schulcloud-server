import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateColumnBodyParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'The title of the column.',
		type: [String],
		required: true,
		nullable: false,
	})
	public titles: string[];

	constructor(props: Readonly<CreateColumnBodyParams>) {
		this.titles = props.titles;
	}
}
