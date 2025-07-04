import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CollaboraProxyController } from './collabora-proxy.controller';
import { CollaboraProxyService } from './collabora-proxy.service';

@Module({
	imports: [HttpModule],
	controllers: [CollaboraProxyController],
	providers: [CollaboraProxyService],
})
export class CollaboraProxyModule {}
