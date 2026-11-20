import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsUrl } from 'class-validator';

export class CreateBoardImportJobBodyParams {
	@IsUrl({ protocols: ['https'], require_protocol: true, disallow_auth: true })
	@PrivacyProtect()
	@ApiProperty({ description: 'The share link of the board to import. Only https links are valid.' })
	link!: string;
}
