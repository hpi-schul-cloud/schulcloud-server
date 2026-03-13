import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifier } from '../do';
import { ErwinIdentifierRepo } from '../interface';
import { erwinIdentifierFactoryWithSchool, erwinIdentifierFactoryWithUser } from '../testing';
import { ErwinIdentifierEntry, ErwinIdentifierService } from './erwin-identifier.service';

describe(ErwinIdentifierService.name, () => {
	let module: TestingModule;
	let sut: ErwinIdentifierService;
	let loggerMock: DeepMocked<Logger>;
	let erwinIdentifierRepoMock: DeepMocked<ErwinIdentifierRepo>;
	const ERWIN_IDENTIFIER_REPO = Symbol('ERWIN_IDENTIFIER_REPO');

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ERWIN_IDENTIFIER_REPO,
					useValue: createMock<ErwinIdentifierRepo>(),
				},
				{
					provide: ErwinIdentifierService,
					useFactory: (logger: Logger, erwinIdentifierRepo: ErwinIdentifierRepo) =>
						new ErwinIdentifierService(logger, erwinIdentifierRepo),
					inject: [Logger, ERWIN_IDENTIFIER_REPO],
				},
			],
		}).compile();

		sut = module.get(ErwinIdentifierService);
		loggerMock = module.get(Logger);
		erwinIdentifierRepoMock = module.get(ERWIN_IDENTIFIER_REPO);
	});

	afterEach(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createErwinIdentifier', () => {
		describe('when an erwinIdentifier is created', () => {
			const setup = () => {
				const entry: ErwinIdentifierEntry = {
					erwinId: 'some-erwin-id',
					type: ReferencedEntityType.USER,
					referencedEntityId: 'referenced-entity-id',
				};

				return { entry };
			};

			it('should create an erwinIdentifier and log an information', async () => {
				const { entry } = setup();

				const result: ErwinIdentifier = await sut.createErwinIdentifier(entry);

				expect(erwinIdentifierRepoMock.create).toHaveBeenCalledTimes(1);
				expect(result.id).toEqual(expect.any(String));
				expect(result.erwinId).toBe(entry.erwinId);
				expect(result.type).toBe(entry.type);
				expect(result.referencedEntityId).toBe(entry.referencedEntityId);
				expect(loggerMock.info).toHaveBeenCalledTimes(1);
			});
		});

		describe('findByErwinId', () => {
			describe('when an erwinIdentifier exists for the erwinId', () => {
				it('should return the erwinIdentifier and log an information', async () => {
					const erwinIdentifier: ErwinIdentifier = erwinIdentifierFactoryWithUser.build();
					erwinIdentifierRepoMock.findByErwinId.mockResolvedValueOnce(erwinIdentifier);

					const result: ErwinIdentifier | null = await sut.findByErwinId(erwinIdentifier.erwinId);

					expect(erwinIdentifierRepoMock.findByErwinId).toHaveBeenCalledWith(erwinIdentifier.erwinId);
					expect(result).toStrictEqual(erwinIdentifier);
					expect(loggerMock.info).toHaveBeenCalledTimes(1);
				});
			});

			describe('when no erwinIdentifier exists for the erwinId', () => {
				it('should return null and not log', async () => {
					const erwinId = 'non-existing-erwin-id';
					erwinIdentifierRepoMock.findByErwinId.mockResolvedValue(null);

					const result: ErwinIdentifier | null = await sut.findByErwinId(erwinId);

					expect(erwinIdentifierRepoMock.findByErwinId).toHaveBeenCalledWith(erwinId);
					expect(result).toBeNull();
					expect(loggerMock.info).not.toHaveBeenCalled();
				});
			});
		});

		describe('findByReferencedEntityId', () => {
			describe('when an erwinIdentifier exists for the referencedEntityId', () => {
				it('should return the erwinIdentifier and log an information', async () => {
					const erwinIdentifier: ErwinIdentifier = erwinIdentifierFactoryWithSchool.build();
					erwinIdentifierRepoMock.findByReferencedEntityId.mockResolvedValueOnce(erwinIdentifier);

					const result: ErwinIdentifier | null = await sut.findByReferencedEntityId(erwinIdentifier.referencedEntityId);

					expect(erwinIdentifierRepoMock.findByReferencedEntityId).toHaveBeenCalledWith(
						erwinIdentifier.referencedEntityId
					);
					expect(result).toStrictEqual(erwinIdentifier);
					expect(loggerMock.info).toHaveBeenCalledTimes(1);
				});
			});

			describe('when no erwinIdentifier exists for the referencedEntityId', () => {
				it('should return null and not log', async () => {
					const referencedEntityId = 'non-existing-referenced-entity-id';
					erwinIdentifierRepoMock.findByReferencedEntityId.mockResolvedValueOnce(null);

					const result: ErwinIdentifier | null = await sut.findByReferencedEntityId(referencedEntityId);

					expect(erwinIdentifierRepoMock.findByReferencedEntityId).toHaveBeenCalledWith(referencedEntityId);
					expect(result).toBeNull();
					expect(loggerMock.info).not.toHaveBeenCalled();
				});
			});
		});
	});
});
