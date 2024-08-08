import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtValidationAdapter } from './adapter';
import { JwtStrategy, WsJwtStrategy, XApiKeyStrategy } from './strategy';

@Module({
	imports: [PassportModule],
	providers: [JwtStrategy, WsJwtStrategy, JwtValidationAdapter, XApiKeyStrategy],
})
export class AuthGuardModule {}
