import { Inject, Injectable } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '../../registration.config';

@Injectable()
export class RegistrationFeatureService {
	constructor(@Inject(REGISTRATION_PUBLIC_API_CONFIG_TOKEN) private readonly config: RegistrationPublicApiConfig) {}

	public checkFeatureRegistrationEnabled(): void {
		if (!this.config.featureExternalPersonRegistrationEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED');
		}
	}
}
