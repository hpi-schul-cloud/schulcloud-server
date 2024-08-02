import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { GetRegistrationPinResponse } from './dto';
import { RegistrationPinUc } from './registration-pin.uc';

@ApiTags('AdminRegistrationPin')
@UseGuards(AuthGuard('api-key'))
@Controller('registration-pin')
export class AdminApiRegistrationPinController {
	constructor(private readonly uc: RegistrationPinUc) {}

	@Get(':email')
	async createRegistrationPin(@Param('email') email: string): Promise<GetRegistrationPinResponse[]> {
		const response = await this.uc.findForEmail(email);

		return response;
	}
}
