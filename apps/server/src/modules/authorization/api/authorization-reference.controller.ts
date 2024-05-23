import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, InternalServerErrorException, Param, Post, UnauthorizedException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { AuthorizationReferenceUc } from './authorization-reference.uc';
import { AuthorizationBodyParams, AuthorizationUrlParams, AuthorizedReponse } from './dto';

@Authenticate('jwt')
@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationController {
	constructor(private readonly authorizationReferenceUc: AuthorizationReferenceUc) {}

	@ApiResponse({ status: 200, type: AuthorizedReponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('authorize/referenceType/:referenceType/referenceId/:referenceId')
	public async authorizeByReference(
		@Param() urlParams: AuthorizationUrlParams,
		@Body() body: AuthorizationBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<AuthorizedReponse> {
		const successAuthorizationReponse = await this.authorizationReferenceUc.authorizeByReference(
			user.userId,
			urlParams.referenceType,
			urlParams.referenceId,
			body
		);

		return successAuthorizationReponse;
	}
}
