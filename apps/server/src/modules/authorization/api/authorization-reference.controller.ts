import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, InternalServerErrorException, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { AuthorizationReferenceUc } from './authorization-reference.uc';
import { AuthorizationBodyParams, AuthorizedReponse } from './dto';
import { AuthorizationContext } from '../domain';

@Authenticate('jwt')
@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationReferenceController {
	constructor(private readonly authorizationReferenceUc: AuthorizationReferenceUc) {}

	@ApiOperation({ summary: 'Checks if user is authorized to perform the given operation.' })
	@ApiResponse({ status: 200, type: AuthorizedReponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('by-reference')
	public async authorizeByReference(
		@Body() body: AuthorizationBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<AuthorizedReponse> {
		const context: AuthorizationContext = {
			action: body.action,
			requiredPermissions: body.requiredPermissions,
		};

		const authorizationReponse = await this.authorizationReferenceUc.authorizeByReference(
			user.userId,
			body.referenceType,
			body.referenceId,
			context
		);

		return authorizationReponse;
	}
}
