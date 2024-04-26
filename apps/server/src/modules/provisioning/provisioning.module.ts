import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AccountModule } from '@modules/account';
import { GroupModule } from '@modules/group';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system/system.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SchulconnexClientModule } from '@src/infra/schulconnex-client';
import { UserLicenseModule } from '../user-license';
import { ProvisioningConfigModule } from './provisioning-config.module';
import { ProvisioningService } from './service/provisioning.service';
import {
	IservProvisioningStrategy,
	OidcMockProvisioningStrategy,
	SanisProvisioningStrategy,
	SanisResponseMapper,
} from './strategy';
import {
	SchulconnexCourseSyncService,
	SchulconnexGroupProvisioningService,
	SchulconnexLicenseProvisioningService,
	SchulconnexSchoolProvisioningService,
	SchulconnexUserProvisioningService,
} from './strategy/oidc/service';

@Module({
	imports: [
		ProvisioningConfigModule,
		AccountModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		HttpModule,
		LoggerModule,
		GroupModule,
		LearnroomModule,
		SchulconnexClientModule.register({
			apiUrl: Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string,
			tokenEndpoint: Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string,
			clientId: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string,
			clientSecret: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string,
			personenInfoTimeoutInMs: Configuration.get('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS') as number,
		}),
		UserLicenseModule,
	],
	providers: [
		ProvisioningService,
		SanisResponseMapper,
		SchulconnexSchoolProvisioningService,
		SchulconnexUserProvisioningService,
		SchulconnexGroupProvisioningService,
		SchulconnexCourseSyncService,
		SchulconnexLicenseProvisioningService,
		SanisProvisioningStrategy,
		IservProvisioningStrategy,
		OidcMockProvisioningStrategy,
	],
	exports: [ProvisioningService],
})
export class ProvisioningModule {}
