import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { ExternalToolElement } from '@shared/domain/domainobject';
import { externalToolElementFactory, setupEntities } from '@shared/testing';
import { ExternalToolElementNodeEntity, ExternalToolElementNodeEntityProps } from './external-tool-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

describe(ExternalToolElementNodeEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when trying to create a external tool element', () => {
		const setup = () => {
			const elementProps: ExternalToolElementNodeEntityProps = {
				contextExternalTool: contextExternalToolEntityFactory.buildWithId(),
			};
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a ExternalToolElementNode', () => {
			const { elementProps } = setup();

			const element = new ExternalToolElementNodeEntity(elementProps);

			expect(element.type).toEqual(BoardNodeType.EXTERNAL_TOOL);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new ExternalToolElementNodeEntity({
				contextExternalTool: contextExternalToolEntityFactory.buildWithId(),
			});
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo: ExternalToolElement = externalToolElementFactory.build();

			builder.buildExternalToolElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildExternalToolElement).toHaveBeenCalledWith(element);
		});

		it('should return ExternalToolElement', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
