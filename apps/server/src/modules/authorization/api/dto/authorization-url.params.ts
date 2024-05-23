import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { AuthorizableReferenceType } from '../../domain';

export class AuthorizationUrlParams {
	@IsEnum(AuthorizableReferenceType)
	@ApiProperty({
		enum: AuthorizableReferenceType,
		description: 'Define for which known entity, or domain object the operation should be peformend.',
		example: AuthorizableReferenceType.User,
	})
	referenceType!: AuthorizableReferenceType;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the entity/domain object of the defined referenceType.' })
	referenceId!: string;
}
