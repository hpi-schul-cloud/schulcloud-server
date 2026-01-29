import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { StatusAdapter } from './adapter';
import { ALERT_CONFIG, AlertConfig } from './alert.config';
import { AlertController } from './controller';
import { AlertCacheService } from './service';
import { AlertUc } from './uc';

@Module({
	imports: [HttpModule, ConfigurationModule.register(ALERT_CONFIG, AlertConfig)],
	controllers: [AlertController],
	providers: [AlertUc, AlertCacheService, StatusAdapter],
})
export class AlertModule {}
