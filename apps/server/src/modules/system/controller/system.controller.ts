import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemFilterParams } from '@src/modules/system/controller/dto/system.filter.params';
import { SystemDto } from '../service';
import { SystemUc } from '../uc/system.uc';
import { PublicSystemListResponse } from './dto/public-system-list.response';
import { PublicSystemResponse } from './dto/public-system-response';
import { SystemIdParams } from './dto/system-id.params';
import { SystemResponseMapper } from './mapper/system-response.mapper';

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
		const systemDtos: SystemDto[] = await this.systemUc.findByFilter(filterParams.type, filterParams.onlyOauth);

		const mapped: PublicSystemListResponse = SystemResponseMapper.mapFromDtoToListResponse(systemDtos);

		return mapped;
	}

	/**
	 * This endpoint is used to get information about a possible login systems.
	 * No sensible data should be returned!
	 */
	@Get('public/:systemId')
	@ApiOperation({ summary: 'Finds a publicly available systems.' })
	@ApiResponse({ status: 200, type: PublicSystemResponse, description: 'Returns a system.' })
	async getSystem(@Param() params: SystemIdParams): Promise<PublicSystemResponse> {
		const systemDto: SystemDto = await this.systemUc.findById(params.systemId);

		const mapped: PublicSystemResponse = SystemResponseMapper.mapFromDtoToResponse(systemDto);

		return mapped;
	}
}
