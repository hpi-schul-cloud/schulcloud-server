import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeConfigResponse } from './dto/common-cartridge-config.response';

@ApiTags('common-cartridge/config')
@Controller('common-cartridge/config')
export class CommonCartridgeConfigController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@ApiOperation({ summary: 'Public configuration for clients' })
	@ApiResponse({ status: 200, type: CommonCartridgeConfigResponse })
	@Get('public')
	public publicConfig(): CommonCartridgeConfigResponse {
		const response = this.commonCartridgeUC.getPublicConfig();

		return response;
	}
}
