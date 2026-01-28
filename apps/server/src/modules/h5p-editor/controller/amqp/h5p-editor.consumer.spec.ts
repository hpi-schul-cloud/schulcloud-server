import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CopyContentParentType, H5P_EXCHANGE_CONFIG_TOKEN, H5pEditorEvents } from '@infra/h5p-editor-client';
import { h5pEditorExchangeCopyContentParamsFactory } from '@infra/h5p-editor-client/testing';
import { H5PEditor } from '@lumieducation/h5p-server';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ENTITIES } from '../../h5p-editor.entity.exports';
import {
	H5pEditorContentCopySuccessfulLoggable,
	H5pEditorContentDeletionSuccessfulLoggable,
	H5pEditorExchangeInvalidParamsLoggableException,
} from '../../loggable';
import { H5pEditorContentService } from '../../service';
import { h5pCopyContentParamsFactory } from '../../testing';
import { H5PContentParentType } from '../../types';
import { H5pEditorConsumer } from './h5p-editor.consumer';

describe(H5pEditorConsumer.name, () => {
	let module: TestingModule;
	let consumer: H5pEditorConsumer;

	let logger: DeepMocked<Logger>;
	let h5pEditor: DeepMocked<H5PEditor>;
	let h5pEditorContentService: DeepMocked<H5pEditorContentService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pEditorConsumer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: H5PEditor,
					useValue: createMock<H5PEditor>(),
				},
				{
					provide: H5pEditorContentService,
					useValue: createMock<H5pEditorContentService>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities(ENTITIES),
				},
				{
					provide: H5P_EXCHANGE_CONFIG_TOKEN,
					useValue: {
						exchangeName: 'h5p-exchange',
						exchangeType: 'direct',
					},
				},
			],
		}).compile();

		consumer = module.get(H5pEditorConsumer);
		logger = module.get(Logger);
		h5pEditor = module.get(H5PEditor);
		h5pEditorContentService = module.get(H5pEditorContentService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteContent', () => {
		describe('when deleting content', () => {
			const setup = () => {
				const contentId = new ObjectId().toHexString();

				return {
					contentId,
				};
			};

			it('should delete content', async () => {
				const { contentId } = setup();

				await consumer.deleteContent({
					contentId,
				});

				expect(h5pEditor.deleteContent).toHaveBeenCalledWith(contentId, {
					email: '',
					id: '',
					name: '',
					type: '',
				});
			});

			it('should log a success info', async () => {
				const { contentId } = setup();

				await consumer.deleteContent({
					contentId,
				});

				expect(logger.info).toHaveBeenCalledWith(new H5pEditorContentDeletionSuccessfulLoggable(contentId));
			});
		});

		describe('when deletion fails', () => {
			const setup = () => {
				const contentId = new ObjectId().toHexString();

				h5pEditor.deleteContent.mockRejectedValue(new Error());

				return {
					contentId,
				};
			};

			it('should not log a success info', async () => {
				const { contentId } = setup();

				await expect(
					consumer.deleteContent({
						contentId,
					})
				).rejects.toThrow();

				expect(logger.info).not.toHaveBeenCalled();
			});
		});
	});

	describe('copyContent', () => {
		describe('when copying a content', () => {
			it('should call the copy method of the h5p content service', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build({
					parentType: CopyContentParentType.BoardElement,
				});
				const params = h5pCopyContentParamsFactory.build({
					...payload,
					creatorId: payload.userId,
					parentType: H5PContentParentType.BoardElement,
				});

				await consumer.copyContent(payload);

				expect(h5pEditorContentService.copyH5pContent).toHaveBeenCalledWith(params);
			});

			it('should log a success info', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build();

				await consumer.copyContent(payload);

				expect(logger.info).toHaveBeenCalledWith(
					new H5pEditorContentCopySuccessfulLoggable(payload.sourceContentId, payload.copiedContentId)
				);
			});
		});

		describe('when the parent type from the payload is invalid', () => {
			it('it should throw an H5pEditorExchangeInvalidParamsLoggableException', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build({ parentType: undefined });

				const promise = consumer.copyContent(payload);

				await expect(promise).rejects.toThrow(
					new H5pEditorExchangeInvalidParamsLoggableException(H5pEditorEvents.COPY_CONTENT, payload)
				);
			});
		});

		describe('when copying fails', () => {
			const setup = () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build();

				h5pEditorContentService.copyH5pContent.mockRejectedValueOnce(new Error());

				return { payload };
			};

			it('should not log a success info', async () => {
				const { payload } = setup();

				const promise = consumer.copyContent(payload);

				await expect(promise).rejects.toThrow();
				expect(logger.info).not.toHaveBeenCalled();
			});
		});
	});
});
