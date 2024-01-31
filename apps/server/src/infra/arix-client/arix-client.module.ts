import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { ArixTestClient } from './arix-test-client';
import { ArixController } from './arix.controller';

@Module({
	imports: [HttpModule],
	providers: [ArixTestClient, ConverterUtil],
	controllers: [ArixController],
})
export class ArixClientModule {}
