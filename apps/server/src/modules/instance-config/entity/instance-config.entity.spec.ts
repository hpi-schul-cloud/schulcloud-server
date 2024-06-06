import { InstanceConfigEntity } from './instance-config.entity';

describe(InstanceConfigEntity.name, () => {
	describe('constructor', () => {
		describe('when creating an object', () => {
			it('should create the object', () => {
				expect(new InstanceConfigEntity({ name: 'dbc' })).toBeInstanceOf(InstanceConfigEntity);
			});
		});
	});
});
