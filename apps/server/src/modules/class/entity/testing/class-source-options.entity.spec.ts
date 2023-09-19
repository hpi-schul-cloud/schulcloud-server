import { ClassSourceOptionsEntity } from '../class-source-options.entity';

describe(ClassSourceOptionsEntity.name, () => {
	describe('constructor', () => {
		describe('When a contructor is called', () => {
			const setup = () => {
				const entity = new ClassSourceOptionsEntity({ tspUid: '12345' });

				return { entity };
			};

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
});
