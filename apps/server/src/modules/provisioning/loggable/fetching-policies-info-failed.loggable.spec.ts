import { ExternalUserDto } from '../dto';
import { FetchingPoliciesInfoFailedLoggable } from './fetching-policies-info-failed.loggable';

describe(FetchingPoliciesInfoFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUserDto: ExternalUserDto = {
				externalId: 'someId',
			};
			const policiesInfoEndpoint = 'someEndpoint';

			const loggable = new FetchingPoliciesInfoFailedLoggable(externalUserDto, policiesInfoEndpoint);

			return { loggable, externalUserDto, policiesInfoEndpoint };
		};

		it('should return a loggable message', () => {
			const { loggable, externalUserDto, policiesInfoEndpoint } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Could not fetch policies info for user. The provisioning of licenses will be skipped.',
				data: {
					externalUserId: externalUserDto.externalId,
					policiesInfoEndpoint,
				},
			});
		});
	});
});
