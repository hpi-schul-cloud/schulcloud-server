import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { config } from './common-cartridge.config';

@Module({
	imports: [CoreModule, HttpModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
})
export class CommonCartridgeApiModule {}
