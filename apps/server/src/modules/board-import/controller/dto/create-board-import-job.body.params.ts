import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CreateBoardImportJobBodyParams {
	@IsUrl({ protocols: ['https'], require_protocol: true })
	@ApiProperty({ description: 'The share link of the board to import. Only https links are valid.' })
	link!: string;
}
