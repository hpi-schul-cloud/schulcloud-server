import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { H5PEditorController } from './controller';
import { coreConfig } from './h5p-editor-timeout.config';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { H5PEditorModule } from './h5p-editor.module';
import { H5PEditorUc } from './uc';

@Module({
	imports: [
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(coreConfig)),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig),
		LoggerModule,
		H5PEditorModule,
		UserModule,
	],
	controllers: [H5PEditorController],
	providers: [H5PEditorUc],
})
export class H5PEditorAppModule {}
