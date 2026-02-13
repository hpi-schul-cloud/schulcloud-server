import { CoreModule } from '@core/core.module';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { User } from '@modules/user/repo/user.entity';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';

@Module({
	imports: [
		CoreModule,
		HttpModule,
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		ConfigurationModule.register(COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig),
		CommonCartridgeModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [User],
		}),
	],
	controllers: [CommonCartridgeController],
})
export class CommonCartridgeApiModule {}
