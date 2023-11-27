import { Test, TestingModule } from '@nestjs/testing';
import { TokenGenerator } from './token-generator.service';

describe('TokenGeneratorService', () => {
	let module: TestingModule;
	let service: TokenGenerator;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [TokenGenerator],
		}).compile();
		service = await module.get(TokenGenerator);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('generateShareToken', () => {
		it('should generate a string with 12 characters', () => {
			const result = service.generateShareToken();
			expect(result.length).toEqual(12);
		});
	});
});
