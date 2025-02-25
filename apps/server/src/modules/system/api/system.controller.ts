import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { System } from '../domain';
import { SystemFilterParams, SystemIdParams } from './dto/param';
import { PublicSystemListResponse, PublicSystemResponse } from './dto/response';
import { SystemResponseMapper } from './mapper';
import { SystemUc } from './system.uc';

@ApiTags('Systems')
@Controller('systems')
export class SystemController {
	constructor(private readonly systemUc: SystemUc) {}

	/**
	 * This endpoint is used to show users the possible login systems that exist.
	 * No sensible data should be returned!
	 */
	@Get('public')
	@ApiOperation({ summary: 'Finds all publicly available systems.' })
	@ApiResponse({ status: 200, type: PublicSystemListResponse, description: 'Returns a list of systems.' })
	async find(@Query() filterParams: SystemFilterParams): Promise<PublicSystemListResponse> {
		const systems: System[] = await this.systemUc.find(filterParams.types);

		const mapped: PublicSystemListResponse = SystemResponseMapper.mapFromDtoToListResponse(systems);

		return mapped;
	}

	/**
	 * This endpoint is used to get information about a possible login systems.
	 * No sensible data should be returned!
	 */
	@Get('public/:systemId')
	@ApiOperation({ summary: 'Finds a publicly available system.' })
	@ApiResponse({ status: 200, type: PublicSystemResponse, description: 'Returns a system.' })
	async getSystem(@Param() params: SystemIdParams): Promise<PublicSystemResponse> {
		const system: System = await this.systemUc.findById(params.systemId);

		const mapped: PublicSystemResponse = SystemResponseMapper.mapFromDtoToResponse(system);

		return mapped;
	}

	@JwtAuthentication()
	@Delete(':systemId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOperation({ summary: 'Deletes a system.' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteSystem(@CurrentUser() currentUser: ICurrentUser, @Param() params: SystemIdParams): Promise<void> {
		await this.systemUc.delete(currentUser.userId, currentUser.schoolId, params.systemId);
	}
}
