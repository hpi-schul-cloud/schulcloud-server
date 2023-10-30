import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolElement } from '@shared/domain/domainobject/board/external-tool-element.do';
import { contextExternalToolEntityFactory } from '@shared/testing/factory/context-external-tool-entity.factory';
import { externalToolElementFactory } from '@shared/testing/factory/domainobject/board/external-tool.do.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { ExternalToolElementNodeEntity, ExternalToolElementNodeEntityProps } from './external-tool-element-node.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

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
