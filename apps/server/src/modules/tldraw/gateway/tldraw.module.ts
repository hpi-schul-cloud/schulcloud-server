import { Module } from '@nestjs/common';
import { TldrawGateway } from '@src/modules/tldraw/gateway/tldraw.gateway';

@Module({
	providers: [ TldrawGateway],
})
export class TldrawModule {}
