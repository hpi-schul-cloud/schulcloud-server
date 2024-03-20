import { SystemType } from '../system-type.enum';
import { System, SystemProps } from '../system.do';
import { SystemFactory } from './system.factory';

describe('SystemFactory', () => {
	describe('build', () => {
		it('should return a system', () => {
			const props: SystemProps = {
				id: 'id',
				type: SystemType.ISERV,
			};

			const result = SystemFactory.build(props);

			expect(result).toBeInstanceOf(System);
		});
	});
});
