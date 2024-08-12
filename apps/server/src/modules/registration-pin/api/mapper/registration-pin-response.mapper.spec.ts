import { registrationPinEntityFactory } from '../../entity/testing';
import { GetRegistrationPinResponse } from '../dto';
import { RegistrationPinResponseMapper } from './registration-pin-response.mapper';

describe('RegistrationPinResponseMapper', () => {
	describe('mapRegistrationPinDoToRegistrationPinResponse', () => {
		describe('when mapping DO to response', () => {
			it('should map correctly', () => {
				const registrationPin = registrationPinEntityFactory.build();

				const result = RegistrationPinResponseMapper.mapRegistrationPinDoToRegistrationPinResponse(registrationPin);

				expect(result).toEqual<GetRegistrationPinResponse>({
					username: registrationPin.email,
					registrationPin: registrationPin.pin,
					verified: registrationPin.verified,
					createdAt: registrationPin.createdAt,
				});
			});
		});
	});
});
