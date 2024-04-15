import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlertController } from './controller';
import { AlertUc } from './uc';
import { CacheService } from './service';
import { StatusAdapter } from './adapter';
import { ToolConfigModule } from '../tool/tool-config.module';

@Module({
	imports: [HttpModule, ToolConfigModule],
	controllers: [AlertController],
	providers: [AlertUc, CacheService, StatusAdapter],
})
export class AlertModule {}
