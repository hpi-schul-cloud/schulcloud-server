import { LoggerModule } from '@infra/logger';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { MetaTagExtractorController } from './controller';
import { MetaTagExtractorModule } from './meta-tag-extractor.module';
import { MetaTagExtractorUc } from './uc';

@Module({
	imports: [MetaTagExtractorModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [MetaTagExtractorController],
	providers: [MetaTagExtractorUc],
})
export class MetaTagExtractorApiModule {}
