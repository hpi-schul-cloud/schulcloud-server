import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { h5pEditorCopyContentParamsFactory } from '@infra/rabbitmq/testing';
import { H5PEditor } from '@lumieducation/h5p-server';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ENTITIES } from '../../h5p-editor.entity.exports';
import { H5pEditorContentCopySuccessfulLoggable, H5pEditorContentDeletionSuccessfulLoggable } from '../../loggable';
import { H5pEditorContentService } from '../../service';
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
				const payload = h5pEditorCopyContentParamsFactory.build();

				await consumer.copyContent(payload);

				expect(h5pEditorContentService.copyH5pContent).toHaveBeenCalledWith(payload);
			});

			it('should log a success info', async () => {
				const payload = h5pEditorCopyContentParamsFactory.build();

				await consumer.copyContent(payload);

				expect(logger.info).toHaveBeenCalledWith(
					new H5pEditorContentCopySuccessfulLoggable(payload.sourceContentId, payload.copiedContentId)
				);
			});
		});

		describe('when copying fails', () => {
			const setup = () => {
				const payload = h5pEditorCopyContentParamsFactory.build();

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
