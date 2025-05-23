import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { H5PEditor } from '@lumieducation/h5p-server';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ENTITIES } from '../../h5p-editor.entity.exports';
import { H5pEditorContentDeletionSuccessfulLoggable } from '../../loggable';
import { H5pEditorConsumer } from './h5p-editor.consumer';

describe(H5pEditorConsumer.name, () => {
	let module: TestingModule;
	let consumer: H5pEditorConsumer;

	let logger: DeepMocked<Logger>;
	let h5pEditor: DeepMocked<H5PEditor>;

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
					provide: MikroORM,
					useValue: await setupEntities(ENTITIES),
				},
			],
		}).compile();

		consumer = module.get(H5pEditorConsumer);
		logger = module.get(Logger);
		h5pEditor = module.get(H5PEditor);
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

				expect(logger.info).not.toHaveBeenCalledWith(new H5pEditorContentDeletionSuccessfulLoggable(contentId));
			});
		});
	});
});
