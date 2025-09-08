import { Test, TestingModule } from '@nestjs/testing';
import { Authorization } from 'oauth-1.0a';
import { Lti11EncryptionService } from './lti11-encryption.service';

describe(Lti11EncryptionService.name, () => {
	let module: TestingModule;
	let service: Lti11EncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [Lti11EncryptionService],
		}).compile();

		service = module.get(Lti11EncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('sign', () => {
		describe('when signing with OAuth1', () => {
			const setup = () => {
				const mockKey = 'mockKey';
				const mockSecret = 'mockSecret';
				const mockUrl = 'https://mockurl.com/';
				const testPayload: Record<string, string> = {
					param1: 'test1',
				};

				return {
					mockKey,
					mockSecret,
					mockUrl,
					testPayload,
				};
			};

			it('should sign the payload with OAuth1', () => {
				const { mockKey, mockSecret, mockUrl, testPayload } = setup();

				const result: Authorization = service.sign(mockKey, mockSecret, mockUrl, testPayload);

				expect(result).toEqual<Authorization>({
					oauth_consumer_key: mockKey,
					oauth_nonce: expect.any(String),
					oauth_signature: expect.any(String),
					oauth_signature_method: 'HMAC-SHA1',
					oauth_timestamp: expect.any(Number),
					oauth_version: '1.0',
					...testPayload,
				});
			});
		});
	});

	describe('verify', () => {
		describe('when the OAuth1 signature is valid', () => {
			const setup = () => {
				const mockKey = 'mockKey';
				const mockSecret = 'mockSecret';
				const mockUrl = 'https://mockurl.com/';
				const testPayload: Record<string, string> = {
					param1: 'test1',
				};

				const signedPayload: Authorization = service.sign(mockKey, mockSecret, mockUrl, testPayload);

				return {
					mockKey,
					mockSecret,
					mockUrl,
					testPayload,
					signedPayload,
				};
			};

			it('should return true', () => {
				const { mockKey, mockSecret, mockUrl, signedPayload } = setup();

				const result = service.verify(mockKey, mockSecret, mockUrl, signedPayload);

				expect(result).toEqual(true);
			});
		});

		describe('when the OAuth1 signature is invalid', () => {
			const setup = () => {
				const mockKey = 'mockKey';
				const mockSecret = 'mockSecret';
				const mockUrl = 'https://mockurl.com/';
				const testPayload: Record<string, string> = {
					param1: 'test1',
				};

				const signedPayload: Authorization = service.sign(mockKey, mockSecret, mockUrl, testPayload);
				const tamperedPayload = { ...signedPayload, param1: 'test2' };

				return {
					mockKey,
					mockSecret,
					mockUrl,
					testPayload,
					tamperedPayload,
				};
			};

			it('should return false', () => {
				const { mockKey, mockSecret, mockUrl, tamperedPayload } = setup();

				const result = service.verify(mockKey, mockSecret, mockUrl, tamperedPayload);

				expect(result).toEqual(false);
			});
		});
	});
});
