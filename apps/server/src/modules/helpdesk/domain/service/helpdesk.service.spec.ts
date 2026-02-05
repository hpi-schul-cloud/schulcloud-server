import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MailService } from '@infra/mail';
import { Test, TestingModule } from '@nestjs/testing';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from '../../helpdesk-config';
import {
	helpdeskProblemPropsFactory,
	helpdeskWishPropsFactory,
	multerFileFactory,
	userContextPropsFactory,
	userDevicePropsFactory,
} from '../../testing';
import { HelpdeskService } from './helpdesk.service';
import { TextFormatter } from './text-formatter.helper';

describe('HelpdeskService', () => {
	let service: HelpdeskService;
	let mailService: DeepMocked<MailService>;
	let logger: DeepMocked<Logger>;
	let config: HelpdeskConfig;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HelpdeskService,
				{
					provide: MailService,
					useValue: createMock<MailService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HELPDESK_CONFIG_TOKEN,
					useValue: {
						problemEmailAddress: 'problem@example.com',
						wishEmailAddress: 'wish@example.com',
						shouldSendEmails: true,
					},
				},
			],
		}).compile();

		service = module.get(HelpdeskService);
		mailService = module.get(MailService);
		logger = module.get(Logger);
		config = module.get(HELPDESK_CONFIG_TOKEN);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createProblem', () => {
		describe('when creating a problem without files and device info', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const plainTextContent = TextFormatter.createProblemText(problem, userContext);

				return { problem, userContext, plainTextContent };
			};

			it('should call emailService.send with correct parameters', async () => {
				const { problem, userContext, plainTextContent } = setup();

				await service.createProblem(problem, userContext);

				expect(mailService.send).toHaveBeenCalledWith({
					recipients: [config.problemEmailAddress],
					mail: {
						subject: problem.subject,
						plainTextContent,
						attachments: undefined,
					},
					replyTo: [problem.replyEmail],
				});
			});

			it('should not call logger.debug', async () => {
				const { problem, userContext } = setup();

				await service.createProblem(problem, userContext);

				expect(logger.debug).not.toHaveBeenCalled();
			});
		});

		describe('when creating a problem with device info', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();
				const plainTextContent = TextFormatter.createProblemText(problem, userContext, userDevice);

				return { problem, userContext, userDevice, plainTextContent };
			};

			it('should call emailService.send with device info in content', async () => {
				const { problem, userContext, userDevice, plainTextContent } = setup();

				await service.createProblem(problem, userContext, userDevice);

				expect(mailService.send).toHaveBeenCalledWith({
					recipients: [config.problemEmailAddress],
					mail: {
						subject: problem.subject,
						plainTextContent,
						attachments: undefined,
					},
					replyTo: [problem.replyEmail],
				});
			});
		});

		describe('when creating a problem with files', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const files: Express.Multer.File[] = [
					multerFileFactory.create({
						originalname: 'screenshot.png',
						mimetype: 'image/png',
					}),
				];

				return { problem, userContext, files };
			};

			it('should call emailService.send with attachments', async () => {
				const { problem, userContext, files } = setup();

				await service.createProblem(problem, userContext, undefined, files);

				const callArgs = mailService.send.mock.calls[0][0];
				expect(callArgs.recipients).toEqual([config.problemEmailAddress]);
				expect(callArgs.mail.subject).toEqual(problem.subject);
				expect(callArgs.replyTo).toEqual([problem.replyEmail]);
				expect(callArgs.mail.attachments).toBeDefined();
				expect(callArgs.mail.attachments).toHaveLength(1);
				expect(callArgs.mail.attachments?.[0]).toMatchObject({
					mimeType: 'image/png',
					name: 'screenshot.png',
					contentDisposition: 'ATTACHMENT',
				});
			});
		});

		describe('when creating a problem with multiple files', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();

				const files: Express.Multer.File[] = [
					multerFileFactory.create({
						originalname: 'file1.pdf',
						mimetype: 'application/pdf',
						buffer: Buffer.from('file1 content'),
					}),
					multerFileFactory.create({
						originalname: 'file2.docx',
						mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						buffer: Buffer.from('file2 content'),
					}),
				];

				return { problem, userContext, files };
			};

			it('should call emailService.send with multiple attachments', async () => {
				const { problem, userContext, files } = setup();

				await service.createProblem(problem, userContext, undefined, files);

				const callArgs = mailService.send.mock.calls[0][0];
				expect(callArgs.mail.attachments).toBeDefined();
				expect(callArgs.mail.attachments).toHaveLength(2);
				expect(callArgs.mail.attachments?.[0]).toMatchObject({
					mimeType: 'application/pdf',
					name: 'file1.pdf',
				});
				expect(callArgs.mail.attachments?.[1]).toMatchObject({
					mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					name: 'file2.docx',
				});
			});

			it('should encode file content as base64', async () => {
				const { problem, userContext, files } = setup();

				await service.createProblem(problem, userContext, undefined, files);

				const callArgs = mailService.send.mock.calls[0][0];
				expect(callArgs.mail.attachments?.[0]).toMatchObject({
					base64Content: Buffer.from('file1 content').toString('base64'),
				});
				expect(callArgs.mail.attachments?.[1]).toMatchObject({
					base64Content: Buffer.from('file2 content').toString('base64'),
				});
			});
		});
	});

	describe('createWish', () => {
		describe('when creating a wish without files and device info', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create({
					acceptanceCriteria: undefined,
				});
				const userContext = userContextPropsFactory.create();
				const plainTextContent = TextFormatter.createWishText(wish, userContext);

				return { wish, userContext, plainTextContent };
			};

			it('should call emailService.send with correct parameters', async () => {
				const { wish, userContext, plainTextContent } = setup();

				await service.createWish(wish, userContext);

				expect(mailService.send).toHaveBeenCalledWith({
					recipients: [config.wishEmailAddress],
					mail: {
						subject: wish.subject,
						plainTextContent,
						attachments: undefined,
					},
					replyTo: [wish.replyEmail],
				});
			});

			it('should not call logger.debug', async () => {
				const { wish, userContext } = setup();

				await service.createWish(wish, userContext);

				expect(logger.debug).not.toHaveBeenCalled();
			});
		});

		describe('when creating a wish with acceptance criteria', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create({
					acceptanceCriteria: 'Should export to PDF and Excel',
				});
				const userContext = userContextPropsFactory.create();
				const plainTextContent = TextFormatter.createWishText(wish, userContext);

				return { wish, userContext, plainTextContent };
			};

			it('should call emailService.send with acceptance criteria in content', async () => {
				const { wish, userContext, plainTextContent } = setup();

				await service.createWish(wish, userContext);

				expect(mailService.send).toHaveBeenCalledWith({
					recipients: [config.wishEmailAddress],
					mail: {
						subject: wish.subject,
						plainTextContent,
						attachments: undefined,
					},
					replyTo: [wish.replyEmail],
				});
			});
		});

		describe('when creating a wish with device info', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();
				const plainTextContent = TextFormatter.createWishText(wish, userContext, userDevice);

				return { wish, userContext, userDevice, plainTextContent };
			};

			it('should call emailService.send with device info in content', async () => {
				const { wish, userContext, userDevice, plainTextContent } = setup();

				await service.createWish(wish, userContext, userDevice);

				expect(mailService.send).toHaveBeenCalledWith({
					recipients: [config.wishEmailAddress],
					mail: {
						subject: wish.subject,
						plainTextContent,
						attachments: undefined,
					},
					replyTo: [wish.replyEmail],
				});
			});
		});

		describe('when creating a wish with files', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const files: Express.Multer.File[] = [
					multerFileFactory.create({
						originalname: 'mockup.png',
						mimetype: 'image/png',
					}),
				];

				return { wish, userContext, files };
			};

			it('should call emailService.send with attachments', async () => {
				const { wish, userContext, files } = setup();

				await service.createWish(wish, userContext, undefined, files);

				const callArgs = mailService.send.mock.calls[0][0];
				expect(callArgs.recipients).toEqual([config.wishEmailAddress]);
				expect(callArgs.mail.subject).toEqual(wish.subject);
				expect(callArgs.replyTo).toEqual([wish.replyEmail]);
				expect(callArgs.mail.attachments).toBeDefined();
				expect(callArgs.mail.attachments).toHaveLength(1);
				expect(callArgs.mail.attachments?.[0]).toMatchObject({
					mimeType: 'image/png',
					name: 'mockup.png',
					contentDisposition: 'ATTACHMENT',
				});
			});
		});

		describe('when creating a wish with multiple problem areas', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create({
					problemArea: ['UI', 'Performance', 'Accessibility'],
				});

				const userContext = userContextPropsFactory.create();

				return { wish, userContext };
			};

			it('should call emailService.send successfully', async () => {
				const { wish, userContext } = setup();

				await service.createWish(wish, userContext);

				expect(mailService.send).toHaveBeenCalledWith(
					expect.objectContaining({
						recipients: [config.wishEmailAddress],
						replyTo: [wish.replyEmail],
					})
				);
			});
		});
	});
});
