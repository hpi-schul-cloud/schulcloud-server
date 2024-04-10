import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateCollaborativeTextEditorBodyParams {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@IsMongoId()
	parentId!: string;
}
