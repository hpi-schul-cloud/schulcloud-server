import { Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

@Configuration()
export class TestEncryptionConfig {
	@IsString()
	aesKey = 'test-aes-key-1234';
}
