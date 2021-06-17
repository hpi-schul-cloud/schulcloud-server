import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import { NewsTargetModel } from '../../entity';

const TARGET_MODEL_VALUES = Object.values(NewsTargetModel);

/**
 * DTO for creating a news document.
 */
export class CreateNewsParams {
	@IsString()
	@ApiProperty({
		description: 'Title of the News entity',
	})
	title: string;

	@IsString()
	@ApiProperty({
		description: 'Content of the News entity',
	})
	content: string;

	@IsDate()
	@ApiProperty({
		description: 'The point in time from when the News entity schould be displayed',
	})
	displayAt: Date;

	@IsString()
	@ApiProperty({
		enum: TARGET_MODEL_VALUES,
		enumName: 'NewsTargetModel',
		description: 'Target model to which the News entity is related',
	})
	targetModel: string;

	@IsString()
	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'Specific target id to which the News entity is related',
	})
	targetId: string;
}
