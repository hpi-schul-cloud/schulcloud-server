import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AlertController } from './controller';
import { AlertUc } from './uc';
import { AlertCacheService } from './service';
import { StatusAdapter } from './adapter';
import { AlertConfig } from './alert.config';

@Module({
	imports: [HttpModule],
	controllers: [AlertController],
	providers: [AlertUc, AlertCacheService, StatusAdapter, ConfigService<AlertConfig, true>],
})
export class AlertModule {}
