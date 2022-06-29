import { Module } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemUc } from '@src/modules/system/uc/system.uc';

@Module({
	imports: [],
	providers: [SystemRepo, SystemService, SystemUc],
	controllers: [SystemController],
	exports: [SystemService],
})
export class SystemModule {}
