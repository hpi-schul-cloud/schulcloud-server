import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class FileRecordWithSizeResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiProperty()
	@IsBoolean()
	isDirectory: boolean;

	@ApiProperty()
	@IsOptional()
	parentId?: string;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	size?: number;

	constructor(props: FileRecordWithSizeResponse) {
		this.id = props.id;
		this.name = props.name;
		this.isDirectory = props.isDirectory;
		this.parentId = props.parentId;
		this.size = props.size;
	}
}
