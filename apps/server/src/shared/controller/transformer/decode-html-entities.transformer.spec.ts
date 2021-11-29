import { plainToClass } from 'class-transformer';
import { DecodeHtmlEntities } from './decode-html-entities.transformer';

describe('DecodeHtmlEntities Decorator', () => {
	describe('when transforming a string', () => {
		class WithHtmlEntitiesDto {
			@DecodeHtmlEntities()
			stringProp!: string;

			@DecodeHtmlEntities()
			optionalStringProp?: string;
		}

		it('should transform from string `[ 1 &#x26; 2] &#x3C;&#x3E; 3 &#xA9;` to `[ 1 & 2] <> 3 ©`', () => {
			const encoded = {
				stringProp: '[ 1 &#x26; 2] &#x3C;&#x3E; 3 &#xA9;',
			};
			const instance = plainToClass(WithHtmlEntitiesDto, encoded);
			expect(instance.stringProp).toEqual('[ 1 & 2] <> 3 ©');
		});

		it('should ignore optional params when not given', () => {
			const encoded = {
				stringProp: '[ 1 &#x26; 2]',
			};
			const instance = plainToClass(WithHtmlEntitiesDto, encoded);
			expect(instance.optionalStringProp).toEqual(undefined);
		});

		it('should support optional params when given', () => {
			const encoded = { optionalStringProp: '&#x3C; x &#x26; y &#x3E;' };
			const instance = plainToClass(WithHtmlEntitiesDto, encoded);
			expect(instance.optionalStringProp).toEqual('< x & y >');
		});

		it('should decode undefined to empty string', () => {
			const encoded = {
				optionalStringProp: undefined,
			};
			const instance = plainToClass(WithHtmlEntitiesDto, encoded);
			expect(instance.optionalStringProp).toEqual('');
		});

		it('should decode null to empty string', () => {
			const encoded = {
				optionalStringProp: null,
			};
			const instance = plainToClass(WithHtmlEntitiesDto, encoded);
			expect(instance.optionalStringProp).toEqual('');
		});
	});
});
