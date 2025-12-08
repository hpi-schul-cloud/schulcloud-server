import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { CompleteRegistrationBodyParams } from './dto/request/complete-registration.body.params';
import { CreateOrUpdateRegistrationBodyParams } from './dto/request/create-registration.body.params';
import { RegistrationByRoomIdUrlParams } from './dto/request/registration-by-room-id.url.params';
import { RegistrationBySecretUrlParams } from './dto/request/registration-by-secret.url.params';
import { RegistrationItemResponse } from './dto/response/registration-item.response';
import { RegistrationListResponse } from './dto/response/registration-list.response';
import { RegistrationMapper } from './mapper/registration.mapper';
import { RegistrationUc } from './registration.uc';

@ApiTags('Registration')
@Controller('registrations')
export class RegistrationController {
	constructor(private readonly registrationUc: RegistrationUc) {}

	@Post()
	@JwtAuthentication()
	@ApiOperation({ summary: 'Create a new registration' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the details of a registration',
		type: RegistrationItemResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createOrUpdateRegistration(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createRegistrationParams: CreateOrUpdateRegistrationBodyParams
	): Promise<RegistrationItemResponse> {
		const registration = await this.registrationUc.createOrUpdateRegistration(
			currentUser.userId,
			createRegistrationParams
		);

		const response = RegistrationMapper.mapToRegistrationItemResponse(registration);

		return response;
	}

	@Get('/by-secret/:registrationSecret')
	@ApiOperation({ summary: 'Get a registration by its secret' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the details of a registration',
		type: RegistrationItemResponse,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Invalid registration hash',
		type: NotFoundException,
	})
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getBySecret(@Param() urlParams: RegistrationBySecretUrlParams): Promise<RegistrationItemResponse> {
		const registration = await this.registrationUc.getSingleRegistrationBySecret(urlParams.registrationSecret);

		const response = RegistrationMapper.mapToRegistrationItemResponse(registration);

		return response;
	}

	@Post('/by-secret/:registrationSecret/complete')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Complete a registration by its secret' })
	@ApiResponse({ status: HttpStatus.OK })
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Invalid registration hash',
		type: NotFoundException,
	})
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async completeRegistration(
		@Param() urlParams: RegistrationBySecretUrlParams,
		@Body() bodyParams: CompleteRegistrationBodyParams
	): Promise<void> {
		await this.registrationUc.completeRegistration(
			urlParams.registrationSecret,
			bodyParams.language,
			bodyParams.password
		);
	}

	@Get('/by-room/:roomId')
	@JwtAuthentication()
	@ApiOperation({ summary: 'Get a list of registrations for specific roomId' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns all registrations for a specific roomId',
		type: RegistrationItemResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async findByRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RegistrationByRoomIdUrlParams
	): Promise<RegistrationListResponse> {
		const registrations = await this.registrationUc.getRegistrationsByRoomId(currentUser.userId, urlParams.roomId);

		const response = RegistrationMapper.mapToRegistrationListResponse(registrations);

		return response;
	}
}
