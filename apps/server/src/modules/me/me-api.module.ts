import { Module } from '@nestjs/common';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { AuthenticationModule } from '@modules/authentication';
import { MeUc, MeController } from './api';

@Module({
	imports: [SchoolModule, UserModule, AuthenticationModule],
	controllers: [MeController],
	providers: [MeUc],
})
export class MeApiModule {}
