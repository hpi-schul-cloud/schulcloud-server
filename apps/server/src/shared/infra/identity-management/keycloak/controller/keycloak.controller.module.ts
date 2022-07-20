import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakModule } from '../keycloak.module';
import { KeycloakManagementController } from './keycloak-management.controller';

@Module({
	imports: [KeycloakModule, ConsoleWriterModule],
	controllers: [KeycloakManagementController],
	providers: [KeycloakConsole],
	exports: [KeycloakConsole],
})
export class KeycloakControllerModule {}
