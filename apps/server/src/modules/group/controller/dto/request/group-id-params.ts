import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class GroupIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	public groupId!: string;
}
