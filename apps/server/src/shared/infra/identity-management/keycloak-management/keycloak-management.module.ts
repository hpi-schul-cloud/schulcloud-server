import { Module } from '@nestjs/common';
import { SystemModule } from '@src/modules/system/system.module';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakManagementController } from './controller/keycloak-management.controller';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

@Module({
	imports: [SystemModule],
	controllers: [KeycloakManagementController],
	providers: [KeycloakConsole, KeycloakAdministrationService, KeycloakConfigurationService, KeycloakSeedService],
	exports: [KeycloakConsole, KeycloakAdministrationService, KeycloakConfigurationService, KeycloakSeedService],
})
export class KeycloakManagementModule {}
