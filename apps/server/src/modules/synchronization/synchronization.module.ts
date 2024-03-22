import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from './config';
import { UserModule } from '../user/user.module';
import { SynchronizationRepo } from './repo';
import { SynchronizationService } from './domain/service';

@Module({
	imports: [UserModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [SynchronizationRepo, SynchronizationService],
	exports: [SynchronizationService],
})
export class SynchronizationModule {}
