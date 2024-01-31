import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { ArixRestClient } from './arix-rest-client';
import { ArixController } from './arix.controller';

@Module({
	imports: [HttpModule],
	providers: [ArixRestClient, ConverterUtil],
	controllers: [ArixController],
})
export class ArixClientModule {}
