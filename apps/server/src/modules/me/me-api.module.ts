import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { MeController, MeUc } from './api';

@Module({
	imports: [SchoolModule, UserModule, SystemModule],
	controllers: [MeController],
	providers: [MeUc],
})
export class MeApiModule {}
