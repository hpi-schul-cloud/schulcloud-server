import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ConsoleWriterModule } from '@shared/infra/console';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakModule } from '../keycloak.module';
import { KeycloakManagementController } from './keycloak-management.controller';

@Module({
	imports: [KeycloakModule, ConsoleWriterModule, LoggerModule],
	controllers: [KeycloakManagementController],
	providers: [KeycloakConsole],
	exports: [KeycloakConsole],
})
export class KeycloakControllerModule {}
