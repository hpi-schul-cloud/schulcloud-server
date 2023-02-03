import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemFilterParams } from '@src/modules/system/controller/dto/system.filter.params';
import { SystemUc } from '../uc/system.uc';
import { PublicSystemListResponse } from './dto/public-system-list.response';
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
		const systemDtos = await this.systemUc.findByFilter(filterParams.type, filterParams.onlyOauth);
		return SystemResponseMapper.mapFromDtoToResponse(systemDtos);
	}
}
