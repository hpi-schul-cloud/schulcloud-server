import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { MediaSourceController } from './api/media-source.controller';
import { MediaSourceModule } from './media-source.module';
import { MediaSourceUc } from './uc';

@Module({
	imports: [MediaSourceModule, AuthorizationModule],
	controllers: [MediaSourceController],
	providers: [MediaSourceUc],
})
export class MediaSourceApiModule {}
