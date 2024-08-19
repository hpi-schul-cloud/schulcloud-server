import { ApiKeyGuard } from '@infra/auth-guard';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetRegistrationPinResponse } from './dto';
import { RegistrationPinUc } from './registration-pin.uc';

@ApiTags('AdminRegistrationPin')
@UseGuards(ApiKeyGuard)
@Controller('registration-pin')
export class AdminApiRegistrationPinController {
	constructor(private readonly uc: RegistrationPinUc) {}

	@Get(':email')
	async getRegistrationPinsForEmail(@Param('email') email: string): Promise<GetRegistrationPinResponse[]> {
		const response = await this.uc.findForEmail(email);

		return response;
	}
}
