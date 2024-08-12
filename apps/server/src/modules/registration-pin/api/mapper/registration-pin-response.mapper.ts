import { RegistrationPinEntity } from '../../entity';
import { GetRegistrationPinResponse } from '../dto';

export class RegistrationPinResponseMapper {
	public static mapRegistrationPinDoToRegistrationPinResponse(
		registrationPin: RegistrationPinEntity
	): GetRegistrationPinResponse {
		return new GetRegistrationPinResponse({
			username: registrationPin.email,
			registrationPin: registrationPin.pin,
			verified: registrationPin.verified,
			createdAt: registrationPin.createdAt,
		});
	}
}
