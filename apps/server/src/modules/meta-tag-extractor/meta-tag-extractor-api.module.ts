import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { MetaTagExtractorController } from './controller';
import { MetaTagExtractorModule } from './meta-tag-extractor.module';
import { MetaTagExtractorUc } from './uc';

@Module({
	imports: [MetaTagExtractorModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [MetaTagExtractorController],
	providers: [MetaTagExtractorUc],
})
export class MetaTagExtractorApiModule {}
