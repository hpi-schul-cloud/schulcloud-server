import { ClassSourceOptionsEntity } from './class-source-options.entity';

describe('Class Source Options Entity', () => {
	describe('constructor', () => {
		const setup = () => {
			const entity = new ClassSourceOptionsEntity({ tspUid: '12345' });

			return { entity };
		};
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new ClassSourceOptionsEntity();

			expect(test).toThrow();
		});

		it('should create empty object', () => {
			const entity = new ClassSourceOptionsEntity({});

			expect(entity).toEqual(expect.objectContaining({}));
		});

		it('should contain valid tspUid ', () => {
			const { entity } = setup();

			const classSourceOptionsEntity: ClassSourceOptionsEntity = new ClassSourceOptionsEntity(entity);

			expect(classSourceOptionsEntity.tspUid).toEqual(entity.tspUid);
		});
	});
});
