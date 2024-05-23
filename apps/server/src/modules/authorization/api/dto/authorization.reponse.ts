import { Permission } from '@shared/domain/interface';
import { ApiProperty } from '@nestjs/swagger';
import { Action, AuthorizableReferenceType, AuthorizationContext } from '../../domain';

export class AuthorizedReponse implements AuthorizationContext {
	@ApiProperty({
		enum: Permission,
		isArray: true,
		description: 'Needed user permissions based on user role, that are needed to execute the operation.',
		example: [Permission.ACCOUNT_VIEW, Permission.BASE_VIEW],
	})
	requiredPermissions: Permission[];

	@ApiProperty()
	userId: string;

	@ApiProperty({
		enum: Action,
		description: 'Define for which action the operation is performend.',
		example: Action.read,
	})
	action: Action;

	@ApiProperty({
		enum: AuthorizableReferenceType,
		description: 'Define for which known entity, or domain object the operation is peformend.',
		example: AuthorizableReferenceType.User,
	})
	referenceType: AuthorizableReferenceType;

	@ApiProperty()
	refrenceId: string;

	@ApiProperty()
	isAuthorized: boolean;

	constructor(props: AuthorizedReponse) {
		this.requiredPermissions = props.requiredPermissions;
		this.userId = props.userId;
		this.action = props.action;
		this.referenceType = props.referenceType;
		this.refrenceId = props.refrenceId;
		this.isAuthorized = props.isAuthorized;
	}
}
