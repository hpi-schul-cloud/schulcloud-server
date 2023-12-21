import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LinkElement } from '@shared/domain/domainobject';
import { linkElementFactory, setupEntities } from '@shared/testing';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';

import { RecursiveCopyVisitor } from './recursive-copy.visitor';
import { SchoolSpecificFileCopyServiceFactory } from './school-specific-file-copy-service.factory';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

describe(RecursiveCopyVisitor.name, () => {
	let module: TestingModule;
	let fileCopyServiceFactory: DeepMocked<SchoolSpecificFileCopyServiceFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: SchoolSpecificFileCopyServiceFactory,
					useValue: createMock<SchoolSpecificFileCopyServiceFactory>(),
				},
				RecursiveCopyVisitor,
			],
		}).compile();

		fileCopyServiceFactory = module.get(SchoolSpecificFileCopyServiceFactory);

		await setupEntities();
	});

	describe('visitLinkElementAsync', () => {
		const setup = (options: { withFileCopy: boolean } = { withFileCopy: false }) => {
			const fileCopyServiceMock = createMock<SchoolSpecificFileCopyService>();
			fileCopyServiceFactory.build.mockReturnValue(fileCopyServiceMock);
			const sourceFileId = 'abe223e22134';
			const imageUrl = `https://abc.de/file/${sourceFileId}`;

			let newFileId: string | undefined;
			let copyResultMock: CopyFileDto[] = [];
			if (options?.withFileCopy) {
				newFileId = 'bbbbbbb123';
				copyResultMock = [
					{
						sourceId: sourceFileId,
						id: newFileId,
						name: 'myfile.jpg',
					},
				];
			}

			fileCopyServiceMock.copyFilesOfParent.mockResolvedValueOnce(copyResultMock);
			return { fileCopyServiceMock, imageUrl, newFileId };
		};

		describe('when copying a LinkElement without preview url', () => {
			it('should not call fileCopyService', async () => {
				const { fileCopyServiceMock } = setup();

				const linkElement = linkElementFactory.build();
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock);

				await visitor.visitLinkElementAsync(linkElement);

				expect(fileCopyServiceMock.copyFilesOfParent).not.toHaveBeenCalled();
			});
		});

		describe('when copying a LinkElement with preview image', () => {
			it('should call fileCopyService', async () => {
				const { fileCopyServiceMock, imageUrl } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock);

				await visitor.visitLinkElementAsync(linkElement);

				expect(fileCopyServiceMock.copyFilesOfParent).toHaveBeenCalledWith(
					expect.objectContaining({ sourceParentId: linkElement.id })
				);
			});

			it('should replace fileId in imageUrl', async () => {
				const { fileCopyServiceMock, imageUrl, newFileId } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock);

				await visitor.visitLinkElementAsync(linkElement);
				const copy = visitor.copyMap.get(linkElement.id) as LinkElement;

				expect(copy.imageUrl).toEqual(expect.stringContaining(newFileId as string));
			});
		});

		describe('when copying a LinkElement with an unmatched image url', () => {
			it('should remove the imageUrl', async () => {
				const { fileCopyServiceMock } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl: `https://abc.de/file/unknown-file-id` });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock);

				await visitor.visitLinkElementAsync(linkElement);
				const copy = visitor.copyMap.get(linkElement.id) as LinkElement;

				expect(copy.imageUrl).toEqual('');
			});
		});
	});
});
