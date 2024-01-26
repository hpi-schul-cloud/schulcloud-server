import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AdminApiUserCreateBodyParams {
	@IsEmail()
	@ApiProperty({
		description: 'The mail adress of the new user. Will also be used as username.',
		required: true,
		nullable: false,
	})
	email!: string;

	@IsString()
	@ApiProperty({
		description: '',
		required: true,
		nullable: false,
	})
	firstName!: string;

	@IsString()
	@ApiProperty({
		description: '',
		required: true,
		nullable: false,
	})
	lastName!: string;

	@IsEnum(RoleName, { each: true })
	@IsNotEmpty()
	@ApiProperty({
		description: 'The roles of the new user',
		isArray: true,
		enum: RoleName,
		required: true,
		nullable: false,
		enumName: 'RoleName',
	})
	roleNames!: RoleName[];

	@IsMongoId()
	@ApiProperty({
		description: 'id of the school the user should be created in',
		required: true,
		nullable: false,
	})
	schoolId!: EntityId;
}
