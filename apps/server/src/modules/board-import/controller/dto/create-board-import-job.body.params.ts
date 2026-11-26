import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsEnum, IsMongoId, IsUrl } from 'class-validator';
import { BoardImportTargetType } from '../../domain';

export class CreateBoardImportJobBodyParams {
	@IsUrl({ protocols: ['https'], require_protocol: true, disallow_auth: true })
	@PrivacyProtect()
	@ApiProperty({
		description: 'The share link of the board to import. Only https links to a supported source are valid.',
	})
	link!: string;

	@IsEnum(BoardImportTargetType)
	@ApiProperty({
		description: 'The type of the target that gets the imported board.',
		enum: BoardImportTargetType,
		enumName: 'BoardImportTargetType',
	})
	targetType!: BoardImportTargetType;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the room or course that gets the imported board.' })
	targetId!: string;
}
