import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { FormerMembershipType } from '../../repo/entity/school-material-transfer-request.entity';

export class FormerMembershipUrlParams {
	@ApiProperty({ enum: ['course', 'room'], enumName: 'FormerMembershipType' })
	@IsIn(['course', 'room'])
	type!: FormerMembershipType;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	refId!: string;
}
