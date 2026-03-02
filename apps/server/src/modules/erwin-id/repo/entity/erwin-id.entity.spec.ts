import { ErwinIdReferencedEntityType } from '../../types';
import { ErwinIdEntity, ErwinIdEntityProps } from './erwin-id.entity';

describe(ErwinIdEntity.name, () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const props: ErwinIdEntityProps = {
			id: 'entity-id',
			erwinId: 'erwin-id',
			type: ErwinIdReferencedEntityType.USER,
			erwinIdReferencedEntityId: 'user-id',
		};

		return { props };
	};

	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new ErwinIdEntity();
				expect(test).toThrow();
			});

			it('should create an entity with all properties', () => {
				const { props } = setup();
				const erwinIdEntity = new ErwinIdEntity(props);

				expect(erwinIdEntity.id).toBe(props.id);
				expect(erwinIdEntity.erwinId).toBe(props.erwinId);
				expect(erwinIdEntity.type).toBe(props.type);
				expect(erwinIdEntity.erwinIdReferencedEntityId).toBe(props.erwinIdReferencedEntityId);
			});

			it('should not set id if not provided', () => {
				const { props } = setup();
				const propsWithoutId = { ...props, id: undefined };
				const erwinIdEntity = new ErwinIdEntity(propsWithoutId);

				expect(erwinIdEntity.id).toBe(propsWithoutId.id);
			});

			it('should allow type to be "school"', () => {
				const { props } = setup();
				const propsWithTypeSchool = { ...props, type: ErwinIdReferencedEntityType.SCHOOL };
				const entity = new ErwinIdEntity(propsWithTypeSchool);

				expect(entity.type).toBe('school');
			});
		});
	});
});
