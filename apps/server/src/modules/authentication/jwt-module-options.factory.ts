import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';

/*
	TODO: look at existing keys, vs implemented keys
	support: true,
	supportUserId,
	accountId,
	userId,
	iat,
	exp,
	aud: this.aud,
	iss: 'feathers',
	sub: accountId,
	jti: `support_${ObjectId()}`,
*/

export class JwtModuleOptionsFactory implements JwtOptionsFactory {
	constructor(private readonly configService: ConfigService) {}

	public createJwtOptions(): JwtModuleOptions {
		// const privateKey = TypeGuard.checkString(privateKeyInput);
		// const publicKey = TypeGuard.checkString(publicKeyInput);
		// // Should we add length check for secrets and that it is NOT secrets like for local?

		// const jwtOptions = TypeGuard.checkKeysInObject(jwtOptionsInput, ['audience', 'issuer', 'expiresIn']);
		// const audience = TypeGuard.checkString(jwtOptions.audience);
		// const issuer = TypeGuard.checkString(jwtOptions.issuer);
		// const expiresIn = TypeGuard.checkString(jwtOptions.expiresIn);

		const algorithm = 'RS256';

		const signOptions: SignOptions = {
			algorithm,
			audience: Configuration.get('JWT_AUD') as string,
			expiresIn: Configuration.get('JWT_LIFETIME') as string,
			issuer: 'feathers',
			header: { typ: 'JWT', alg: algorithm },
		};

		// Node's process.env escapes newlines. We need to reverse it for the keys to work.
		// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
		const privateKey = (Configuration.get('JWT_PRIVATE_KEY') as string).replace(/\\n/g, '\n');
		const publicKey = (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n');

		const options = {
			privateKey,
			publicKey,
			signOptions,
			verifyOptions: signOptions,
		};

		return options;
	}
}
