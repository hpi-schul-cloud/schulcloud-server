import { Test, TestingModule } from '@nestjs/testing';
import { TokenGenerator } from './token-generator.service';

describe('TokenGeneratorService', () => {
	let service: TokenGenerator;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [TokenGenerator],
		}).compile();
		service = await module.get(TokenGenerator);
	});

	describe('generateShareToken', () => {
		it('should generate a string with 12 characters', () => {
			const result = service.generateShareToken();
			expect(result.length).toEqual(12);
		});
	});
});
