import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { H5PEditorController } from './controller';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5PEditorModule } from './h5p-editor.module';
import { H5PEditorUc } from './uc';

@Module({
	imports: [
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		CoreModule,
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig),
		LoggerModule,
		H5PEditorModule,
		UserModule,
	],
	controllers: [H5PEditorController],
	providers: [H5PEditorUc],
})
export class H5PEditorAppModule {}
