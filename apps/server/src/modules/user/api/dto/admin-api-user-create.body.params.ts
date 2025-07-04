import { RoleName } from '@modules/role';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminApiUserCreateBodyParams {
	@IsEmail()
	@ApiProperty({
		description: 'The mail adress of the new user. Will also be used as username.',
		required: true,
		nullable: false,
	})
	public email!: string;

	@IsString()
	@ApiProperty({
		description: '',
		required: true,
		nullable: false,
	})
	public firstName!: string;

	@IsString()
	@ApiProperty({
		description: '',
		required: true,
		nullable: false,
	})
	public lastName!: string;

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
	public roleNames!: RoleName[];

	@IsMongoId()
	@ApiProperty({
		description: 'id of the school the user should be created in',
		required: true,
		nullable: false,
	})
	public schoolId!: EntityId;

	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Id of the course the user should be assigned to',
	})
	public courseId?: EntityId;
}
