import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsString } from 'class-validator';

export class ShareTokenImportBodyParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'the new name of the imported object.',
		required: true,
		nullable: false,
	})
	newName!: string;

	@IsString()
	@ApiProperty({
		description: 'Id of the course to which the lesson/task will be added',
		required: false,
		nullable: true,
	})
	destinationCourseId?: string;
}
