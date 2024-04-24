import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlertController } from './controller';
import { AlertUc } from './uc';
import { AlertCacheService } from './service';
import { StatusAdapter } from './adapter';
import { ToolConfigModule } from '../tool/tool-config.module';

@Module({
	imports: [HttpModule, ToolConfigModule],
	controllers: [AlertController],
	providers: [AlertUc, AlertCacheService, StatusAdapter],
})
export class AlertModule {}
