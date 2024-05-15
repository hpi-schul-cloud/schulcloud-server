import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { externalToolElementFactory } from '@shared/testing/factory';
import { ExternalToolElement } from './external-tool-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(ExternalToolElement.name, () => {
	describe('when trying to add a child to a external tool element', () => {
		it('should throw an error ', () => {
			const externalToolElement = externalToolElementFactory.build();
			const externalToolElementChild = externalToolElementFactory.build();

			expect(() => externalToolElement.addChild(externalToolElementChild)).toThrow();
		});
	});

	describe('update contextExternalToolId', () => {
		it('should be able to update contextExternalToolId', () => {
			const externalToolElement = externalToolElementFactory.build();
			const contextExternalToolId = new ObjectId().toHexString();

			externalToolElement.contextExternalToolId = contextExternalToolId;

			expect(externalToolElement.contextExternalToolId).toEqual(contextExternalToolId);
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const externalToolElement = externalToolElementFactory.build();

			externalToolElement.accept(visitor);

			expect(visitor.visitExternalToolElement).toHaveBeenCalledWith(externalToolElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const externalToolElement = externalToolElementFactory.build();

			await externalToolElement.acceptAsync(visitor);

			expect(visitor.visitExternalToolElementAsync).toHaveBeenCalledWith(externalToolElement);
		});
	});
});
