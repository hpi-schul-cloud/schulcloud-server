import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { RegistrationConfig } from '../../registration.config';

@Injectable()
export class RegistrationFeatureService {
	constructor(private readonly configService: ConfigService<RegistrationConfig, true>) {}

	public checkFeatureRegistrationEnabled(): void {
		if (!this.configService.get('FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED');
		}
	}
}
