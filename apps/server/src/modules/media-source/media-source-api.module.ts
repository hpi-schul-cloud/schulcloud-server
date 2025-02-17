import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { MediaSourceController } from './api/media-source.controller';
import { MediaSourceUc } from './uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [MediaSourceController],
	providers: [MediaSourceUc],
})
export class MediaSourceApiModule {}
