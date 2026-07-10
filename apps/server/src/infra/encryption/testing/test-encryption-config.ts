import { Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

@Configuration()
export class TestEncryptionConfig {
	@IsString()
	public aesKey = 'test-aes-key-1234';
}
