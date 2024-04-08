import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Role, SchoolEntity, TargetModels, User, VideoConference } from '@shared/domain/entity';
import { Permission, RoleName, VideoConferenceScope } from '@shared/domain/interface';
import { SchoolFeature } from '@shared/domain/types';
import {
	accountFactory,
	cleanupCollections,
	courseFactory,
	roleFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AccountEntity } from '@modules/account/entity/account.entity';
import { Response } from 'supertest';
import { VideoConferenceCreateParams, VideoConferenceJoinResponse } from '../dto';

describe('VideoConferenceController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let axiosMock: MockAdapter;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		axiosMock = new MockAdapter(axios);
		testApiClient = new TestApiClient(app, 'videoconference2');
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
				const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [] });

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.START_MEETING,
					Permission.JOIN_MEETING,
				]);

				await em.persistAndFlush([school, teacherAccount, teacherUser]);
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
					`${VideoConferenceScope.COURSE}/${new ObjectId().toHexString()}/start`,
					params
				);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when conference params are given', () => {
			describe('when school has not enabled the school feature videoconference', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

					await em.persistAndFlush([school, teacherAccount, teacherUser, course]);
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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

			describe('when user has not the required permission', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });
					const studentRole: Role = roleFactory.buildWithId({
						name: RoleName.STUDENT,
						permissions: [Permission.JOIN_MEETING],
					});

					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school }, [
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, students: [studentUser] });

					await em.persistAndFlush([school, studentRole, studentAccount, studentUser, course]);
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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

			describe('when user has the required permission', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

					await em.persistAndFlush([school, teacherAccount, teacherUser, course]);
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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

			describe('when conference is for scope and scopeId is already running', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

					await em.persistAndFlush([school, teacherAccount, teacherUser, course]);
					em.clear();

					const params: VideoConferenceCreateParams = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const expertRole: Role = roleFactory.buildWithId({
						name: RoleName.EXPERT,
						permissions: [Permission.JOIN_MEETING],
					});

					const expertUser: User = userFactory.buildWithId({ school, roles: [expertRole] });
					const expertAccount: AccountEntity = accountFactory.buildWithId({ userId: expertUser.id });

					const course: Course = courseFactory.buildWithId({ school, students: [expertUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
						options: { moderatorMustApproveJoinRequests: false },
					});

					await em.persistAndFlush([school, expertRole, expertAccount, expertUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

					const loggedInClient: TestApiClient = await testApiClient.login(expertAccount);

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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

			describe('when a user without required permission wants to end a conference', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school }, [
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, students: [studentUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, studentAccount, studentUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

					const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

					return { loggedInClient, scope, scopeId };
				};

				it('should return forbidden', async () => {
					const { loggedInClient, scope, scopeId } = await setup();

					const response: Response = await loggedInClient.get(`${scope}/${scopeId}/end`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when a user with required permission wants to end a conference', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId({ features: [SchoolFeature.VIDEOCONFERENCE] });

					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.START_MEETING,
						Permission.JOIN_MEETING,
					]);

					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });
					const videoConference: VideoConference = videoConferenceFactory.buildWithId({
						targetModel: TargetModels.COURSES,
						target: course.id,
					});

					await em.persistAndFlush([school, teacherAccount, teacherUser, course, videoConference]);
					em.clear();

					const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
					const scopeId: string = course.id;

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
