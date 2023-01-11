import { Module } from '@nestjs/common';
import { CopyHelperService } from './copy-helper.service';

@Module({
	providers: [CopyHelperService],
	exports: [CopyHelperService],
})
export class CopyHelperModule {}
