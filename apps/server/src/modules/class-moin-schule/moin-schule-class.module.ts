import { Module } from '@nestjs/common';
import { MoinSchuleClassService } from './moin-schule-class.service';
import { GroupModule } from '@modules/group';

@Module({
	imports: [GroupModule],
	providers: [MoinSchuleClassService],
	exports: [MoinSchuleClassService],
})
export class MoinSchuleClassModule {}
