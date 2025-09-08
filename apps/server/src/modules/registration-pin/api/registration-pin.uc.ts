import { Injectable } from '@nestjs/common';
import { RegistrationPinService } from '../service';
import { GetRegistrationPinResponse } from './dto';
import { RegistrationPinResponseMapper } from './mapper';

@Injectable()
export class RegistrationPinUc {
	constructor(private readonly registrationPinService: RegistrationPinService) {}

	public async findForEmail(email: string): Promise<GetRegistrationPinResponse[]> {
		const registrationPin = await this.registrationPinService.findByEmail(email);
		const response = registrationPin.map((pin) =>
			RegistrationPinResponseMapper.mapRegistrationPinDoToRegistrationPinResponse(pin)
		);

		return response;
	}
}
