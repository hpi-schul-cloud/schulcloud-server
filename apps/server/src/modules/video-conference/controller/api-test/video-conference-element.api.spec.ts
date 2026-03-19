import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { BoardExternalReferenceType } from '@modules/board';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	videoConferenceElementEntityFactory,
} from '@modules/board/testing';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { RoomFeatures } from '@modules/room';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { SchoolFeature } from '@modules/school/domain';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Response } from 'supertest';
import { VideoConferenceScope } from '../../domain';
import { VideoConferenceEntity, VideoConferenceTargetModels } from '../../repo';
import { videoConferenceFactory } from '../../testing';
import { VideoConferenceCreateParams, VideoConferenceJoinResponse } from '../dto';

describe('VideoConferenceController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let axiosMock: MockAdapter;
	let testApiClient: TestApiClient;
	let boardContextConfig: BoardContextPublicApiConfig;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		axiosMock = new MockAdapter(axios);
		testApiClient = new TestApiClient(app, 'videoconference2');
		boardContextConfig = app.get(BOARD_CONTEXT_PUBLIC_API_CONFIG);
		boardContextConfig.featureColumnBoardVideoconferenceEnabled = true;
		boardContextConfig.featureVideoconferenceEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		axiosMock = new MockAdapter(axios);
	});

	const mockBbbMeetingInfoFailed = (meetingId: string) => {
		axiosMock
			.onGet(new RegExp(`.*/bigbluebutton/api/getMeetingInfo?.*meetingID=${meetingId}.*`))
			.replyOnce<string>(
				HttpStatus.INTERNAL_SERVER_ERROR,
				'<?xml version="1.0" encoding="UTF-8" ?>\n' +
					'<response>\n' +
					'  <returncode>FAILED</returncode>\n' +
					'  <messageKey>notFound</messageKey>\n' +
					'  <message>We could not find a meeting with that meeting ID - perhaps the meeting is not yet running?</message>\n' +
					'</response>'
			);
	};

	const mockBbbMeetingInfoSuccess = (meetingId: string) => {
		axiosMock
			.onGet(new RegExp(`.*/bigbluebutton/api/getMeetingInfo?.*meetingID=${meetingId}.*`))
			.replyOnce<string>(
				HttpStatus.OK,
				'<?xml version="1.0"?>\n' +
					'<response>\n' +
					'<returncode>SUCCESS</returncode>\n' +
					'<meetingName>Mathe</meetingName>\n' +
					`<meetingID>${meetingId}</meetingID>\n` +
					'<internalMeetingID>c7ae0ac13ace99c8b2239ce3919c28e47d5bbd2a-1686648423698</internalMeetingID>\n' +
					'<createTime>1686648423698</createTime>\n' +
					'<createDate>Tue Jun 13 11:27:03 CEST 2023</createDate>\n' +
					'<voiceBridge>17878</voiceBridge>\n' +
					'<dialNumber>613-555-1234</dialNumber>\n' +
					'<attendeePW>VIEWER</attendeePW>\n' +
					'<moderatorPW>MODERATOR</moderatorPW>\n' +
					'<running>false</running>\n' +
					'<duration>0</duration>\n' +
					'<hasUserJoined>false</hasUserJoined>\n' +
					'<recording>false</recording>\n' +
					'<hasBeenForciblyEnded>false</hasBeenForciblyEnded>\n' +
					'<startTime>1686648423709</startTime>\n' +
					'<endTime>0</endTime>\n' +
					'<participantCount>0</participantCount>\n' +
					'<listenerCount>0</listenerCount>\n' +
					'<voiceParticipantCount>0</voiceParticipantCount>\n' +
					'<videoCount>0</videoCount>\n' +
					'<maxUsers>0</maxUsers>\n' +
					'<moderatorCount>0</moderatorCount>\n' +
					'<attendees>\n' +
					'</attendees>\n' +
					'<metadata>\n' +
					'<bbb-origin-server-name>localhost</bbb-origin-server-name>\n' +
					'</metadata>\n' +
					'<isBreakout>false</isBreakout>\n' +
					'</response>\n'
			);
	};

	const mockBbbCreateSuccess = (meetingId: string) => {
		axiosMock
			.onPost(new RegExp(`.*/bigbluebutton/api/create?.*meetingID=${meetingId}.*`))
			.replyOnce<string>(
				HttpStatus.OK,
				'<?xml version="1.0" encoding="UTF-8" ?>\n' +
					'<response>\n' +
					'  <returncode>SUCCESS</returncode>\n' +
					`  <meetingID>${meetingId}</meetingID>\n` +
					'  <internalMeetingID>c7ae0ac13ace99c8b2239ce3919c28e47d5bbd2a-1686646947283</internalMeetingID>\n' +
					'  <parentMeetingID>bbb-none</parentMeetingID>\n' +
					'  <createTime>1686646947283</createTime>\n' +
					'  <voiceBridge>37466</voiceBridge>\n' +
					'  <dialNumber>613-555-1234</dialNumber>\n' +
					'  <createDate>Tue Jun 13 11:02:27 CEST 2023</createDate>\n' +
					'  <hasUserJoined>false</hasUserJoined>\n' +
					'  <duration>0</duration>\n' +
					'  <hasBeenForciblyEnded>false</hasBeenForciblyEnded>\n' +
					'  <messageKey>messageKey</messageKey>\n' +
					'  <message>message</message>\n' +
					'</response>'
			);
	};

	const mockBbbEndSuccess = (meetingId: string) => {
		axiosMock
			.onGet(new RegExp(`.*/bigbluebutton/api/end?.*meetingID=${meetingId}.*`))
			.replyOnce<string>(
				HttpStatus.OK,
				'<?xml version="1.0"?>\n' +
					'<response>\n' +
					'<returncode>SUCCESS</returncode>\n' +
					'<messageKey>sentEndMeetingRequest</messageKey>\n' +
					'<message>A request to end the meeting was sent. Please wait a few seconds, and then use the getMeetingInfo or isMeetingRunning API calls to verify that it was ended.</message>\n' +
					'</response>\n'
			);
	};

	describe('[PUT] /videoconference2/:scope/:scopeId/start', () => {
		describe('when user is unauthorized', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.put('/anyScope/anyId/start');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the logoutUrl is from a wrong origin', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({ features: [] });

				const room = roomEntityFactory.build({
					schoolId: school.id,
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
				});
				const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ role: roomEditorRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

				await em
					.persist([
						columnBoardNode,
						columnNode,
						cardNode,
						elementNode,
						room,
						roomMembership,
						school,
						teacherAccount,
						teacherUser,
						userGroup,
						roomEditorRole,
						roomViewerRole,
					])
					.flush();
				em.clear();

				const params: VideoConferenceCreateParams = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
					logoutUrl: 'http://from.other.origin/',
				};

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					params,
				};
			};

			it('should return bad request', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.put(
					`${VideoConferenceScope.ROOM}/${new ObjectId().toHexString()}/start`,
					params
				);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when conference params are given', () => {
			describe('when school has not enabled the school feature videoconference', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId({ features: [] });

					const room = roomEntityFactory.build({
						schoolId: school.id,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2024-10-20'),
					});
					const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					const userGroup = groupEntityFactory.buildWithId({
						organization: school,
						users: [{ role: roomEditorRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();
					const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

					await em
						.persist([
							columnBoardNode,
							columnNode,
							cardNode,
							elementNode,
							room,
							roomMembership,
							school,
							teacherAccount,
							teacherUser,
							userGroup,
							roomEditorRole,
							roomViewerRole,
						])
						.flush();
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
					const scopeId: string = elementNode.id;

					const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

					mockBbbMeetingInfoFailed(scopeId);

					return { loggedInClient, scope, scopeId, params };
				};

				it('should return forbidden', async () => {
					const { loggedInClient, params, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has not the required permission as room viewer', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });
					const room = roomEntityFactory.build({
						schoolId: school.id,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2025-10-20'),
					});
					const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
					const userGroup = groupEntityFactory.buildWithId({
						organization: school,
						users: [{ role: roomViewerRole, user: studentUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();
					const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

					await em
						.persist([
							columnBoardNode,
							columnNode,
							cardNode,
							elementNode,
							room,
							roomMembership,
							school,
							studentAccount,
							studentUser,
							userGroup,
							roomEditorRole,
							roomViewerRole,
						])
						.flush();
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
					const scopeId: string = elementNode.id;

					const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

					mockBbbMeetingInfoFailed(scopeId);

					return { loggedInClient, scope, scopeId, params };
				};

				it('should return forbidden', async () => {
					const { loggedInClient, params, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has not the required permission as room editor', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });
					const room = roomEntityFactory.build({
						schoolId: school.id,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2025-10-20'),
					});
					const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					const userGroup = groupEntityFactory.buildWithId({
						organization: school,
						users: [{ role: roomEditorRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();
					const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

					await em
						.persist([
							columnBoardNode,
							columnNode,
							cardNode,
							elementNode,
							room,
							roomMembership,
							school,
							teacherAccount,
							teacherUser,
							userGroup,
							roomEditorRole,
							roomViewerRole,
						])
						.flush();
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
					const scopeId: string = elementNode.id;

					const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

					mockBbbMeetingInfoFailed(scopeId);

					return { loggedInClient, scope, scopeId, params };
				};

				it('should return forbidden', async () => {
					const { loggedInClient, params, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has the required permission in room scope as room editor', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const room = roomEntityFactory.build({
						schoolId: school.id,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2024-10-20'),
						features: [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE],
					});
					const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					const userGroup = groupEntityFactory.buildWithId({
						organization: school,
						users: [{ role: roomEditorRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();
					const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();
					await em
						.persist([
							columnBoardNode,
							columnNode,
							cardNode,
							elementNode,
							room,
							roomMembership,
							school,
							teacherAccount,
							teacherUser,
							userGroup,
							roomEditorRole,
							roomViewerRole,
						])
						.flush();
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
					const scopeId: string = elementNode.id;

					const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);
					mockBbbMeetingInfoFailed(scopeId);
					mockBbbCreateSuccess(scopeId);

					return { loggedInClient, scope, scopeId, params };
				};

				it('should create the conference successfully and return with ok', async () => {
					const { loggedInClient, params, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when user has the required permission in room scope as room admin', () => {
				const setup = async () => {
					const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const room = roomEntityFactory.build({
						schoolId: school.id,
						startDate: new Date('2024-10-01'),
						endDate: new Date('2024-10-20'),
						features: [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE],
					});
					const { roomAdminRole, roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					const userGroup = groupEntityFactory.buildWithId({
						organization: school,
						users: [{ role: roomAdminRole, user: teacherUser }],
					});
					const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

					const columnBoardNode = columnBoardEntityFactory.build({
						context: { id: room.id, type: BoardExternalReferenceType.Room },
					});
					const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
					const cardNode = cardEntityFactory.withParent(columnNode).build();
					const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();
					await em
						.persist([
							columnBoardNode,
							columnNode,
							cardNode,
							elementNode,
							room,
							roomMembership,
							school,
							teacherAccount,
							teacherUser,
							userGroup,
							roomAdminRole,
							roomEditorRole,
							roomViewerRole,
						])
						.flush();
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
					const scopeId: string = elementNode.id;

					const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);
					mockBbbMeetingInfoFailed(scopeId);
					mockBbbCreateSuccess(scopeId);

					return { loggedInClient, scope, scopeId, params };
				};

				it('should create the conference successfully and return with ok', async () => {
					const { loggedInClient, params, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});
		});

		describe('when conference is for scope and scopeId is already running', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

				const room = roomEntityFactory.build({
					schoolId: school.id,
					startDate: new Date('2024-10-01'),
					endDate: new Date('2024-10-20'),
				});
				const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const userGroup = groupEntityFactory.buildWithId({
					organization: school,
					users: [{ role: roomEditorRole, user: teacherUser }],
				});
				const roomMembership = roomMembershipEntityFactory.build({ roomId: room.id, userGroupId: userGroup.id });

				const columnBoardNode = columnBoardEntityFactory.build({
					context: { id: room.id, type: BoardExternalReferenceType.Room },
				});
				const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build();
				const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

				const videoConference = videoConferenceFactory.buildWithId({
					targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
					target: elementNode.id,
				});
				await em
					.persist([
						columnBoardNode,
						columnNode,
						cardNode,
						elementNode,
						room,
						roomMembership,
						school,
						teacherAccount,
						teacherUser,
						userGroup,
						roomEditorRole,
						roomViewerRole,
						videoConference,
					])
					.flush();
				em.clear();

				const params: VideoConferenceCreateParams = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const scopeId: string = elementNode.id;

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				mockBbbMeetingInfoSuccess(scopeId);

				return { loggedInClient, scope, scopeId, params };
			};

			it('should return ok', async () => {
				const { loggedInClient, params, scope, scopeId } = await setup();

				const response: Response = await loggedInClient.put(`${scope}/${scopeId}/start`, params);

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('[GET] /videoconference2/:scope/:scopeId/join', () => {
			describe('when user is unauthorized', () => {
				it('should return unauthorized', async () => {
					const response: Response = await testApiClient.get('/anyScope/anyId/join');

					expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when scope and scopeId are given', () => {
				describe('when school has not enabled the school feature videoconference', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});
						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoFailed(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/join`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when user has the required permission', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});
						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoSuccess(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return the conference', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/join`);

						expect(response.status).toEqual(HttpStatus.OK);
						expect(response.body).toEqual<VideoConferenceJoinResponse>({
							url: expect.any(String),
						});
					});
				});

				describe('when conference is not running', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});
						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoFailed(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return internal server error', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/join`);

						expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
					});
				});
			});
		});

		describe('[GET] /videoconference2/:scope/:scopeId/info', () => {
			describe('when user is unauthorized', () => {
				it('should return unauthorized', async () => {
					const response: Response = await testApiClient.get('/anyScope/anyId/info');

					expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when scope and scopeId are given', () => {
				describe('when school has not enabled the school feature videoconference', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);
						mockBbbMeetingInfoFailed(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/info`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when user has the required permission', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoSuccess(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return ok', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/info`);

						expect(response.status).toEqual(HttpStatus.OK);
					});
				});

				describe('when guest want meeting info of conference without waiting room', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const externalPersonRole = roleFactory.buildWithId({
							name: RoleName.EXTERNALPERSON,
							permissions: [Permission.JOIN_MEETING],
						});

						const externalPersonUser = userFactory.buildWithId({ school, roles: [externalPersonRole] });
						const externalPersonAccount = accountFactory.buildWithId({ userId: externalPersonUser.id });

						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: externalPersonRole, user: externalPersonUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
							options: { moderatorMustApproveJoinRequests: false },
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								externalPersonAccount,
								externalPersonUser,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(externalPersonAccount);

						mockBbbMeetingInfoSuccess(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/info`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when conference is not running', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoFailed(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return ok', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/info`);

						expect(response.status).toEqual(HttpStatus.OK);
					});
				});
			});
		});

		describe('[PUT] /videoconference2/:scope/:scopeId/end', () => {
			describe('when user is unauthorized', () => {
				it('should return unauthorized', async () => {
					const response: Response = await testApiClient.get('/anyScope/anyId/end');

					expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when scope and scopeId are given', () => {
				describe('when school has not enabled the school feature videoconference', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbMeetingInfoFailed(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when a user without required permission wants to end a conference as room viewer', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomViewerRole, user: studentUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								studentAccount,
								studentUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when a user without required permission wants to end a conference as room editor', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						return { loggedInClient, scope, scopeId };
					};

					it('should return forbidden', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

						expect(response.status).toEqual(HttpStatus.FORBIDDEN);
					});
				});

				describe('when a user with required permission wants to end a conference as room editor', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
							features: [RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE],
						});
						const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomEditorRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbEndSuccess(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return ok', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

						expect(response.status).toEqual(HttpStatus.OK);
					});
				});

				describe('when a user with required permission wants to end a conference as room admin', () => {
					const setup = async () => {
						const school = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

						const room = roomEntityFactory.build({
							schoolId: school.id,
							startDate: new Date('2024-10-01'),
							endDate: new Date('2024-10-20'),
						});
						const { roomAdminRole, roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
						const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
						const userGroup = groupEntityFactory.buildWithId({
							organization: school,
							users: [{ role: roomAdminRole, user: teacherUser }],
						});
						const roomMembership = roomMembershipEntityFactory.build({
							roomId: room.id,
							userGroupId: userGroup.id,
						});

						const columnBoardNode = columnBoardEntityFactory.build({
							context: { id: room.id, type: BoardExternalReferenceType.Room },
						});
						const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
						const cardNode = cardEntityFactory.withParent(columnNode).build();
						const elementNode = videoConferenceElementEntityFactory.withParent(cardNode).build();

						const videoConference: VideoConferenceEntity = videoConferenceFactory.buildWithId({
							targetModel: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
							target: elementNode.id,
						});

						await em
							.persist([
								columnBoardNode,
								columnNode,
								cardNode,
								elementNode,
								room,
								roomMembership,
								school,
								teacherAccount,
								teacherUser,
								userGroup,
								roomAdminRole,
								roomEditorRole,
								roomViewerRole,
								videoConference,
							])
							.flush();
						em.clear();

						const scope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
						const scopeId: string = elementNode.id;

						const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

						mockBbbEndSuccess(scopeId);

						return { loggedInClient, scope, scopeId };
					};

					it('should return ok', async () => {
						const { loggedInClient, scope, scopeId } = await setup();

						const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

						expect(response.status).toEqual(HttpStatus.OK);
					});
				});
			});
		});
	});
});
