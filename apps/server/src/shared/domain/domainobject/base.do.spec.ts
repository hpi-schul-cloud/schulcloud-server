import { EntityId } from '../types';
import { BaseDO } from './base.do';

describe('BaseDO', () => {
	describe('when own class is extended', () => {
		const setup = () => {
			type MyProp = {
				id: EntityId;
				key: string;
			};

			class MyDO extends BaseDO<MyProp> {}

			const props = { id: '123', key: 'abc' };

			const myDO = new MyDO(props);

			return { myDO, props };
		};

		it('should create valid instance after call the constructor', () => {
			const { myDO, props } = setup();

			expect(myDO.props).toEqual(props);
		});

		it('should have a id getter per default', () => {
			const { myDO, props } = setup();

			expect(myDO.id).toEqual(props.id);
		});
	});
});
