import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { config } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';

@Module({
	imports: [CoreModule, HttpModule, ConfigModule.forRoot(createConfigModuleOptions(config)), CommonCartridgeModule],
	controllers: [CommonCartridgeController],
})
export class CommonCartridgeApiModule {}
