import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { ContextExternalToolDeletedEvent } from '../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolRef } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { CommonToolDeleteService } from './common-tool-delete.service';

describe(CommonToolDeleteService.name, () => {
	let module: TestingModule;
	let service: CommonToolDeleteService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonToolDeleteService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
			],
		}).compile();

		service = module.get(CommonToolDeleteService);
		externalToolRepo = module.get(ExternalToolRepo);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		eventBus = module.get(EventBus);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('deleteExternalTool', () => {
		describe('when deleting an external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const displayName = 'test';
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: new SchoolExternalToolRef({
						schoolToolId: schoolExternalTool.id,
					}),
					displayName,
				});

				externalToolRepo.findById.mockResolvedValueOnce(externalTool);
				schoolExternalToolRepo.findByExternalToolId.mockResolvedValueOnce([schoolExternalTool]);
				contextExternalToolRepo.find.mockResolvedValueOnce([contextExternalTool]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					displayName,
				};
			};

			it('should delete the external tool', async () => {
				const { externalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(externalToolRepo.deleteById).toHaveBeenCalledWith(externalTool.id);
			});

			it('should delete the school external tools', async () => {
				const { externalTool, schoolExternalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(schoolExternalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalTool.id);
			});

			it('should delete the context external tools', async () => {
				const { externalTool, contextExternalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should use the correct school external tools', async () => {
				const { externalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(schoolExternalToolRepo.findByExternalToolId).toHaveBeenCalledWith(externalTool.id);
			});

			it('should use the correct context external tools', async () => {
				const { externalTool, schoolExternalTool } = setup();

				await service.deleteExternalTool(externalTool);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					schoolToolRef: { schoolToolId: schoolExternalTool.id },
				});
			});

			it('should publish a delete event for the context external tools', async () => {
				const { externalTool, contextExternalTool, displayName } = setup();

				await service.deleteExternalTool(externalTool);

				expect(eventBus.publish).toHaveBeenCalledWith(
					new ContextExternalToolDeletedEvent({
						id: contextExternalTool.id,
						title: displayName,
					})
				);
			});
		});
	});

	describe('deleteSchoolExternalTool', () => {
		describe('when deleting a school external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: new SchoolExternalToolRef({
						schoolToolId: schoolExternalTool.id,
					}),
					displayName: undefined,
				});

				externalToolRepo.findById.mockResolvedValueOnce(externalTool);
				contextExternalToolRepo.find.mockResolvedValueOnce([contextExternalTool]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should delete the school external tool', async () => {
				const { schoolExternalTool } = setup();

				await service.deleteSchoolExternalTool(schoolExternalTool);

				expect(schoolExternalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalTool.id);
			});

			it('should delete the context external tools', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				await service.deleteSchoolExternalTool(schoolExternalTool);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should use the correct context external tools', async () => {
				const { schoolExternalTool } = setup();

				await service.deleteSchoolExternalTool(schoolExternalTool);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					schoolToolRef: { schoolToolId: schoolExternalTool.id },
				});
			});

			it('should publish a delete event for the context external tools', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.deleteSchoolExternalTool(schoolExternalTool);

				expect(eventBus.publish).toHaveBeenCalledWith(
					new ContextExternalToolDeletedEvent({
						id: contextExternalTool.id,
						title: externalTool.name,
					})
				);
			});
		});
	});

	describe('deleteContextExternalTool', () => {
		describe('when deleting a context external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: new SchoolExternalToolRef({
						schoolToolId: schoolExternalTool.id,
					}),
					displayName: undefined,
				});

				schoolExternalToolRepo.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolRepo.findById.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should delete the context external tool', async () => {
				const { contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should use the correct school external tools', async () => {
				const { contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(schoolExternalToolRepo.findById).toHaveBeenCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
			});

			it('should publish a delete event for the context external tools', async () => {
				const { externalTool, contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(eventBus.publish).toHaveBeenCalledWith(
					new ContextExternalToolDeletedEvent({
						id: contextExternalTool.id,
						title: externalTool.name,
					})
				);
			});
		});
	});
});
