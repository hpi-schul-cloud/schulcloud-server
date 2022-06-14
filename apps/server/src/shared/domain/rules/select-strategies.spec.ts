import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { SingleSelectStrategie, BaseSelectStrategie } from './select-strategies';

describe('ISelectStrategies', () => {
	describe('SingleSelectStrategie', () => {
		const strategie = new SingleSelectStrategie<string>();

		it('Should support the right interface', () => {
			expect(strategie).toBeInstanceOf(BaseSelectStrategie);
		});

		it('Should throw with NotImplemented if nothing is matched.', () => {
			expect(() => strategie.match([])).toThrowError(NotImplementedException);
		});

		it('Should throw with InternalServerErrorException if mutliple elements match.', () => {
			expect(() => strategie.match(['a', 'b'])).toThrowError(new InternalServerErrorException());
		});

		it('Should return a single match element if only one exist', () => {
			expect(strategie.match(['a'])).toEqual('a');
		});
	});
});
