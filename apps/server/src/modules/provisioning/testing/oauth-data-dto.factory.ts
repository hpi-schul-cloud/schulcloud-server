import { OauthDataDto } from '@modules/provisioning';
import { Factory } from 'fishery';
import { externalUserDtoFactory } from './external-user-dto.factory';
import { provisioningSystemDtoFactory } from './provisioning-system-dto.factory';

export const oauthDataDtoFactory = Factory.define<OauthDataDto, OauthDataDto>(() => {
	const system = provisioningSystemDtoFactory.build();
	const externalUser = externalUserDtoFactory.build();
	const oauthDataDto = new OauthDataDto({
		system,
		externalUser,
	});

	return oauthDataDto;
});
