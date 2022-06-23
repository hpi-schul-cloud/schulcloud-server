import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';
import { SystemFilterParams } from '@src/modules/system/controller/dto/system.filter.params';
import { SystemOauthResponseMapper } from '@src/modules/system/controller/mapper/system-oauth-response.mapper';
import { SystemUc } from '../uc/system.uc';

@ApiTags('System')
@Controller('system')
export class SystemController {
	constructor(private readonly systemUc: SystemUc) {}

	@Get()
	@ApiOperation({ summary: 'Finds all systems.' })
	@ApiResponse({ status: 200, type: SystemOauthResponse, description: 'Returns an SystemOauthResponse.' })
	async find(@Query() filterParams: SystemFilterParams): Promise<SystemOauthResponse> {
		const systemDtos = await this.systemUc.findByFilter(filterParams.type, filterParams.onlyOauth === 'true');
		return SystemOauthResponseMapper.mapFromDtoToResponse(systemDtos);
	}
}
