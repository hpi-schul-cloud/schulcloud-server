import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class GetCollaborativeTextEditorForParentParams {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@IsMongoId()
	parentId!: string;

	@ApiProperty({
		required: true,
		nullable: false,
	})
	@IsMongoId()
	boardId!: string;
}
