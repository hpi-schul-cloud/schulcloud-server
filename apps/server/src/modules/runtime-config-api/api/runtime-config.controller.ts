import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Patch, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RuntimeConfigUc } from './runtime-config.uc';
import { RuntimeConfigMapper } from './mapper/runtime-config.mapper';
import { RuntimeConfigListResponse } from './dto/response/runtime-config-list.response';
import { UpdateRuntimeConfigValueBodyParams } from './dto/request/update-runtime-config-value.body.params';
import { UpdateRuntimeConfigValueUrlParams } from './dto/request/update-runtime-config-value.url.params';

@Controller('runtime-config')
export class RuntimeConfigController {
	constructor(private readonly runtimeConfigUc: RuntimeConfigUc) {}

	@Get()
	@JwtAuthentication()
	public async getRuntimeConfig(): Promise<RuntimeConfigListResponse> {
		const objects = await this.runtimeConfigUc.getRuntimeConfig();
		const dto = RuntimeConfigMapper.mapToRuntimeConfigListResponse(objects);
		return dto;
	}

	@Patch('/:key')
	@JwtAuthentication()
	@HttpCode(HttpStatus.OK)
	public async updateRuntimeConfigValue(
		@Param() urlParams: UpdateRuntimeConfigValueUrlParams,
		@Body() body: UpdateRuntimeConfigValueBodyParams,
		@CurrentUser() user: ICurrentUser
	): Promise<void> {
		await this.runtimeConfigUc.updateRuntimeConfigValue(urlParams.key, body.value, user.userId);
	}
}
