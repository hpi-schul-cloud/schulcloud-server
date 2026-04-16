import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { ROOM_CONFIG_TOKEN } from '@modules/room/room.config';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { RoomRepo } from '../../repo';
import { roomFactory } from '../../testing';
import { Room, RoomCreateProps, RoomUpdateProps } from '../do';
import { RoomDeletedEvent } from '../events/room-deleted.event';
import { RoomColor } from '../type';
import { RoomService } from './room.service';

describe('RoomService', () => {
	let module: TestingModule;
	let service: RoomService;
	let roomRepo: DeepMocked<RoomRepo>;
	let eventBus: DeepMocked<EventBus>;
	let mailService: DeepMocked<MailService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomService,
				{
					provide: RoomRepo,
					useValue: createMock<RoomRepo>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
				{
					provide: MailService,
					useValue: createMock<MailService>(),
				},
				{
					provide: ROOM_CONFIG_TOKEN,
					useValue: {
						hostUrl: 'http://localhost:3000',
						fromEmailAddress: 'example@sender.com',
						productName: 'dBildungscloud',
					},
				},
			],
		}).compile();

		service = module.get<RoomService>(RoomService);
		roomRepo = module.get(RoomRepo);
		eventBus = module.get(EventBus);
		mailService = module.get(MailService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('createRoom', () => {
		const setup = () => {
			const props: RoomCreateProps = {
				name: 'room #1',
				color: RoomColor.ORANGE,
				schoolId: new ObjectId().toHexString(),
				features: [],
			};
			return { props };
		};

		it('should call repo to save room', async () => {
			const { props } = setup();

			await service.createRoom(props);

			expect(roomRepo.save).toHaveBeenCalledWith(expect.objectContaining(props));
		});

		it('should throw validation error if start date is after end date', async () => {
			const { props } = setup();
			props.startDate = new Date('2024-12-31');
			props.endDate = new Date('2024-01-01');

			await expect(service.createRoom(props)).rejects.toThrowError(ValidationError);
		});
	});

	describe('getSingleRoom', () => {
		const setup = () => {
			const room = roomFactory.build();
			roomRepo.findById.mockResolvedValue(room);

			return { room };
		};

		it('should call repo to get room', async () => {
			const { room } = setup();

			await service.getSingleRoom(room.id);

			expect(roomRepo.findById).toHaveBeenCalledWith(room.id);
		});

		it('should return room', async () => {
			const { room } = setup();

			const result = await service.getSingleRoom(room.id);

			expect(result).toBe(room);
		});
	});

	describe('roomExists', () => {
		const setup = () => {
			const room = roomFactory.build();
			roomRepo.findById.mockResolvedValueOnce(room);

			return { room };
		};

		it('should return true if room exists', async () => {
			const { room } = setup();

			const result = await service.roomExists(room.id);

			expect(result).toBe(true);
		});

		it('should return false if repo throws an error', async () => {
			roomRepo.findById.mockRejectedValueOnce(new Error('Database error'));

			const result = await service.roomExists('id');

			expect(result).toBe(false);
		});
	});

	describe('updateRoom', () => {
		const setup = () => {
			const room = roomFactory.build({
				name: 'initial name',
				color: RoomColor.ORANGE,
			});

			const props: RoomUpdateProps = {
				name: 'updated name',
				color: RoomColor.BLUE_GREY,
				features: [],
			};

			return { props, room };
		};

		it('should update the room properties', async () => {
			const { props, room } = setup();

			await service.updateRoom(room, props);

			expect(room).toMatchObject(props);
		});

		it('should call repo to save room', async () => {
			const { props, room } = setup();

			await service.updateRoom(room, props);

			expect(roomRepo.save).toHaveBeenCalledWith(room);
		});

		it('should throw validation error if start date is after end date', async () => {
			const { props, room } = setup();
			props.startDate = new Date('2024-12-31');
			props.endDate = new Date('2024-01-01');

			await expect(service.updateRoom(room, props)).rejects.toThrowError(ValidationError);
		});
	});

	describe('deleteRoom', () => {
		it('should call repo to delete room', async () => {
			const room = roomFactory.build();

			await service.deleteRoom(room);

			expect(roomRepo.delete).toHaveBeenCalledWith(room);
		});

		it('should send an event', async () => {
			const room = roomFactory.build();

			await service.deleteRoom(room);

			expect(eventBus.publish).toHaveBeenCalledWith(new RoomDeletedEvent(room.id));
		});
	});

	describe('getRoomsByIds', () => {
		const setup = () => {
			const roomIds: EntityId[] = ['1', '2', '3'];
			const mockRooms: Room[] = [
				{ id: '1', name: 'Room 1' },
				{ id: '2', name: 'Room 2' },
				{ id: '3', name: 'Room 3' },
			] as Room[];

			roomRepo.findByIds.mockResolvedValue(mockRooms);

			return { roomIds, mockRooms };
		};

		it('should return all rooms for given ids', async () => {
			const { roomIds, mockRooms } = setup();

			const result = await service.getRoomsByIds(roomIds);

			expect(roomRepo.findByIds).toHaveBeenCalledWith(roomIds);
			expect(result).toEqual(mockRooms);
		});
	});

	describe('canEditorManageVideoconferences', () => {
		it('should return true if correct feature is present', () => {
			const room = roomFactory.build();

			const result = service.canEditorManageVideoconferences(room);

			expect(result).toEqual(true);
		});

		it('should return false if feature is not present', () => {
			const room = roomFactory.build({ features: [] });

			const result = service.canEditorManageVideoconferences(room);

			expect(result).toEqual(false);
		});
	});

	describe('sendRoomWelcomeMail', () => {
		const smtpSender = 'example@sender.com';
		const roomName = 'My Test Room';

		beforeEach(() => {
			const mockRoom = {
				getRoomName: () => roomName,
			} as Room;

			roomRepo.findById.mockResolvedValue(mockRoom);
		});

		it('should call mail service to send mail', async () => {
			const email = 'test@example.com';
			const roomId = 'room123';
			const title = `Benachrichtigung über Zugang zum Raum ${roomName}`;

			await service.sendRoomWelcomeMail(email, roomId);

			expect(mailService.send).toHaveBeenCalledTimes(1);
			expect(mailService.send).toHaveBeenCalledWith({
				recipients: [email],
				from: smtpSender,
				mail: expect.objectContaining({
					subject: `dBildungscloud: ${title}`,
					plainTextContent: expect.stringContaining(roomName) as unknown,
					htmlContent: '',
				}) as unknown,
			});
		});
	});
});
