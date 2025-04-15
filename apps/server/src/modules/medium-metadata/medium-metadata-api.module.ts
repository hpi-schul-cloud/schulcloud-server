import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { MediumMetadataController } from './api/medium-metadata.controller';
import { MediumMetadataModule } from './medium-metadata.module';
import { MediumMetadataUc } from './uc';

@Module({
	imports: [MediumMetadataModule, AuthorizationModule],
	controllers: [MediumMetadataController],
	providers: [MediumMetadataUc],
})
export class MediumMetadataApiModule {}
