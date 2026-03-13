import { ReferencedEntityType } from '../../types';
import { ErwinIdentifierEntity, ErwinIdentifierEntityProps } from './erwin-identifier.entity';

describe(ErwinIdentifierEntity.name, () => {
	describe('constructor', () => {
		describe('when constructor is called without props', () => {
			it('should throw an error', () => {
				// @ts-expect-error: Test case
				const test = () => new ErwinIdentifierEntity();
				expect(test).toThrow();
			});
		});

		describe('when constructor is called with all properties', () => {
			const setup = () => {
				const props: ErwinIdentifierEntityProps = {
					id: 'entity-id',
					erwinId: 'erwin-id',
					type: ReferencedEntityType.USER,
					referencedEntityId: 'user-id',
				};

				return { props };
			};

			it('should create an entity with all properties', () => {
				const { props } = setup();
				const erwinIdentifierEntity = new ErwinIdentifierEntity(props);

				expect(erwinIdentifierEntity.id).toBe(props.id);
				expect(erwinIdentifierEntity.erwinId).toBe(props.erwinId);
				expect(erwinIdentifierEntity.type).toBe(props.type);
				expect(erwinIdentifierEntity.referencedEntityId).toBe(props.referencedEntityId);
			});

			it('should not set id if not provided', () => {
				const { props } = setup();
				const propsWithoutId = { ...props, id: undefined };
				const erwinIdentifierEntity = new ErwinIdentifierEntity(propsWithoutId);

				expect(erwinIdentifierEntity.id).toBe(propsWithoutId.id);
			});

			it('should allow type to be "school"', () => {
				const { props } = setup();
				const propsWithTypeSchool = { ...props, type: ReferencedEntityType.SCHOOL };
				const entity = new ErwinIdentifierEntity(propsWithTypeSchool);

				expect(entity.type).toBe('school');
			});
		});
	});
});
