import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OauthAdapterService } from './service';

@Module({
	imports: [HttpModule],
	providers: [OauthAdapterService],
	exports: [OauthAdapterService],
})
export class OauthAdapterModule {}
