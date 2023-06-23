import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AncestorEntityType {
	'COURSE' = 'course',
	'COLUMN_BOARD' = 'columnboard',
}

export class AncestorResponse {
	constructor({ type, text, id }: AncestorResponse) {
		this.id = id;
		this.type = type;
		this.text = text;
	}

	@ApiProperty({
		enum: AncestorEntityType,
	})
	@IsEnum(AncestorEntityType)
	type!: AncestorEntityType;

	@ApiProperty({ required: true })
	id!: string;

	@ApiProperty({ required: false, nullable: true })
	@IsOptional()
	text?: string;
}
