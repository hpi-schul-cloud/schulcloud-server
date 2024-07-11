import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemDeletedEvent } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { schoolFactory } from '../../testing';
import { School } from '../do';
import { SchoolService } from '../service';
import { SystemDeletedHandler } from './system-deleted.handler';

describe(SystemDeletedHandler.name, () => {
	let module: TestingModule;
	let handler: SystemDeletedHandler;

	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemDeletedHandler,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		handler = module.get(SystemDeletedHandler);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		describe('when a non-ldap system is removed', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();
				const school = schoolFactory.build({
					systemIds: [system.id],
					ldapLastSync: new Date().toISOString(),
					externalId: 'schoolExternalId',
				});
				const event = new SystemDeletedEvent({ schoolId: school.id, system });

				schoolService.getSchoolById.mockResolvedValueOnce(new School({ ...school.getProps() }));

				return {
					school,
					event,
				};
			};

			it('should should remove the system and save the school', async () => {
				const { school, event } = setup();

				await handler.handle(event);

				expect(schoolService.save).toHaveBeenCalledWith(
					new School({
						...school.getProps(),
						systemIds: [],
						ldapLastSync: undefined,
					})
				);
			});
		});

		describe('when the last ldap system is removed', () => {
			const setup = () => {
				const system = systemFactory.withLdapConfig().build();
				const school = schoolFactory.build({
					systemIds: [system.id],
					ldapLastSync: new Date().toISOString(),
					externalId: 'schoolExternalId',
				});
				const event = new SystemDeletedEvent({ schoolId: school.id, system });

				schoolService.getSchoolById.mockResolvedValueOnce(new School({ ...school.getProps() }));

				return {
					school,
					event,
				};
			};

			it('should should remove the system and save the school', async () => {
				const { school, event } = setup();

				await handler.handle(event);

				expect(schoolService.save).toHaveBeenCalledWith(
					new School({
						...school.getProps(),
						systemIds: [],
						ldapLastSync: undefined,
						externalId: undefined,
					})
				);
			});
		});
	});
});
