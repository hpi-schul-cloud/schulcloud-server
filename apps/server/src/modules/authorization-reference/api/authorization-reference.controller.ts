import { CurrentUser, ICurrentUser, JWT, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	Param,
	Post,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { AuthorizationReferenceUc } from './authorization-reference.uc';
import {
	AccessTokenParams,
	AccessTokenPayloadResponse,
	AccessTokenResponse,
	AuthorizationBodyParams,
	AuthorizationMultiReferenceBodyParams,
	AuthorizedResponse,
	CreateAccessTokenParams,
} from './dto';

@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationReferenceController {
	constructor(private readonly authorizationReferenceUc: AuthorizationReferenceUc) {}

	@ApiOperation({ summary: 'Checks if user is authorized to perform the given operation.' })
	@ApiResponse({ status: 200, type: AuthorizedResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('by-reference')
	@JwtAuthentication()
	public async authorizeByReference(
		@Body() body: AuthorizationBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<AuthorizedResponse> {
		const authorizationReponse = await this.authorizationReferenceUc.authorizeByReference(
			user.userId,
			body.referenceType,
			body.referenceId,
			body.context
		);

		return authorizationReponse;
	}

	@ApiOperation({ summary: 'Checks if user is authorized to perform the given operation.' })
	@ApiResponse({ status: 200, type: AuthorizedResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('by-references')
	@JwtAuthentication()
	public async authorizeByReferences(
		@Body() body: AuthorizationMultiReferenceBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<AuthorizedResponse> {
		const authorizationReponse = await this.authorizationReferenceUc.authorizeByReferences(
			user.userId,
			body.referenceTypes,
			body.referenceIds,
			body.context
		);

		return authorizationReponse;
	}

	@JwtAuthentication()
	@Post('create-token')
	public async createToken(
		@Body() body: CreateAccessTokenParams,
		@CurrentUser() currentUser: ICurrentUser,
		@JWT() jwt: string
	): Promise<AccessTokenResponse> {
		const response = await this.authorizationReferenceUc.createToken(currentUser, body, jwt);

		return response;
	}

	@Get('resolve-token/:token/ttl/:tokenTtlInSeconds')
	public async resolveToken(@Param() params: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const payload = await this.authorizationReferenceUc.resolveToken(params);

		return payload;
	}
}
