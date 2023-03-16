import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { Logger } from '@src/core/logger';
import { FwuController } from './controller/fwu.controller';
import { FwuUc } from './uc/fwu.uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [FwuController],
	providers: [FwuUc, Logger],
})
export class FwuModule {}
