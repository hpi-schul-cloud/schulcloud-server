import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common';
import { CoreModule } from '@src/core';
import { authorizationClientConfig } from '../files-storage/files-storage.config';
import { config } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';

@Module({
	imports: [
		CoreModule,
		HttpModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		CommonCartridgeModule,
	],
	controllers: [CommonCartridgeController],
})
export class CommonCartridgeApiModule {}
