import { ApiProperty } from '@nestjs/swagger';

export class ShareTokenUrlParams {
	@ApiProperty({ description: '', required: true, nullable: false }) token!: string;
}
