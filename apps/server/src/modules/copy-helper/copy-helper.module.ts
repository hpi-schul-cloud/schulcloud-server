import { Module } from '@nestjs/common';
import { CopyHelperService } from './service/copy-helper.service';

@Module({
	providers: [CopyHelperService],
	exports: [CopyHelperService],
})
export class CopyHelperModule {}
