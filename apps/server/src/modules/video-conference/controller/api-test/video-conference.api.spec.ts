import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import MockAdapter from 'axios-mock-adapter';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import axios from 'axios';
import {
	cleanupCollections,
	courseFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { ICurrentUser } from '@src/modules/authentication';
import request, { Response } from 'supertest';
import {
	Course,
	Permission,
	Role,
	RoleName,
	School,
	SchoolFeatures,
	TargetModels,
	User,
	VideoConference,
	VideoConferenceScope,
} from '@shared/domain';
import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';
import { VideoConferenceCreateParams, VideoConferenceJoinResponse } from '../dto';

describe('VideoConferenceController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser | undefined;
	let axiosMock: MockAdapter;
	const BASE_URL = '/videoconference2';

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		axiosMock = new MockAdapter(axios);
		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		axiosMock.reset();
	});

	const mockBbbMeetingInfoFailed = () => {
		axiosMock
			.onGet(/.*\/bigbluebutton\/api\/getMeetingInfo*/)
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

	const mockBbbMeetingInfoSuccess = () => {
		axiosMock
			.onGet(/.*\/bigbluebutton\/api\/getMeetingInfo*/)
			.replyOnce<string>(
				HttpStatus.OK,
				'<?xml version="1.0"?>\n' +
					'<response>\n' +
					'<returncode>SUCCESS</returncode>\n' +
					'<meetingName>Mathe</meetingName>\n' +
					'<meetingID>0000dcfbfb5c7a3f00bf21ab</meetingID>\n' +
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

	const mockBbbCreateSuccess = () => {
		axiosMock
			.onPost(/.*\/bigbluebutton\/api\/create/)
			.replyOnce<string>(
				HttpStatus.OK,
				'<?xml version="1.0" encoding="UTF-8" ?>\n' +
					'<response>\n' +
					'  <returncode>SUCCESS</returncode>\n' +
					'  <meetingID>0000dcfbfb5c7a3f00bf21ab</meetingID>\n' +
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

	const mockBbbEndSuccess = () => {
		axiosMock
			.onGet(/.*\/bigbluebutton\/api\/end/)
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
			const setup = () => {
				currentUser = undefined;
			};

			it('should return unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer()).put(`${BASE_URL}/anyScope/anyId/start`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when conference params are given', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] });
				const studentRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.JOIN_MEETING],
				});
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.START_MEETING, Permission.JOIN_MEETING],
				});

				const student: User = userFactory.buildWithId({ school, roles: [studentRole] });
				const teacher: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, students: [student], teachers: [teacher] });

				await em.persistAndFlush([school, studentRole, teacherRole, student, teacher, course]);
				em.clear();

				const params: VideoConferenceCreateParams = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
				const scopeId: string = course.id;

				return { scope, scopeId, params, teacher, student, school };
			};

			describe('when school has not enabled the school feature videoconference', () => {
				it('should return forbidden', async () => {
					const { params, scope, scopeId, teacher, school } = await setup();
					school.features = [];
					await em.persistAndFlush(school);
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer())
						.put(`${BASE_URL}/${scope}/${scopeId}/start`)
						.send(params);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has not the required permission', () => {
				it('should return forbidden', async () => {
					const { params, scope, scopeId, student } = await setup();
					currentUser = mapUserToCurrentUser(student);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer())
						.put(`${BASE_URL}/${scope}/${scopeId}/start`)
						.send(params);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has the required permission', () => {
				it('should create the conference successfully and return with ok', async () => {
					const { params, scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();
					mockBbbCreateSuccess();

					const response: Response = await request(app.getHttpServer())
						.put(`${BASE_URL}/${scope}/${scopeId}/start`)
						.send(params);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when conference is for scope and scopeId is already running', () => {
				it('should return ok', async () => {
					const { params, scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoSuccess();

					const response: Response = await request(app.getHttpServer())
						.put(`${BASE_URL}/${scope}/${scopeId}/start`)
						.send(params);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});
		});
	});

	describe('[GET] /videoconference2/:scope/:scopeId/join', () => {
		describe('when user is unauthorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/anyScope/anyId/join`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when scope and scopeId are given', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] });
				const studentRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.JOIN_MEETING],
				});
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.START_MEETING, Permission.JOIN_MEETING],
				});

				const student: User = userFactory.buildWithId({ school, roles: [studentRole] });
				const teacher: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, students: [student], teachers: [teacher] });
				const videoConference: VideoConference = videoConferenceFactory.buildWithId({
					targetModel: TargetModels.COURSES,
					target: course.id,
				});

				await em.persistAndFlush([school, studentRole, teacherRole, student, teacher, course, videoConference]);
				em.clear();

				const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
				const scopeId: string = course.id;

				return { scope, scopeId, teacher, student, school };
			};

			describe('when school has not enabled the school feature videoconference', () => {
				it('should return forbidden', async () => {
					const { scope, scopeId, teacher, school } = await setup();
					school.features = [];
					await em.persistAndFlush(school);
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/join`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has the required permission', () => {
				it('should return the conference', async () => {
					const { scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoSuccess();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/join`);

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual<VideoConferenceJoinResponse>({
						url: expect.any(String),
					});
				});
			});

			describe('when conference is not running', () => {
				it('should return internal server error', async () => {
					const { scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/join`);

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});
		});
	});

	describe('[GET] /videoconference2/:scope/:scopeId/info', () => {
		describe('when user is unauthorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/anyScope/anyId/info`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when scope and scopeId are given', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] });
				const expertRole: Role = roleFactory.buildWithId({
					name: RoleName.EXPERT,
					permissions: [Permission.JOIN_MEETING],
				});
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.START_MEETING, Permission.JOIN_MEETING],
				});

				const expert: User = userFactory.buildWithId({ school, roles: [expertRole] });
				const teacher: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, teachers: [teacher], students: [expert] });
				const videoConference: VideoConference = videoConferenceFactory.buildWithId({
					targetModel: TargetModels.COURSES,
					target: course.id,
				});

				await em.persistAndFlush([school, expertRole, teacherRole, expert, teacher, course, videoConference]);
				em.clear();

				const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
				const scopeId: string = course.id;

				return { scope, scopeId, teacher, expert, school, videoConference };
			};

			describe('when school has not enabled the school feature videoconference', () => {
				it('should return forbidden', async () => {
					const { scope, scopeId, teacher, school } = await setup();
					school.features = [];
					await em.persistAndFlush(school);
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/info`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when user has the required permission', () => {
				it('should return ok', async () => {
					const { scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoSuccess();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/info`);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when guest want meeting info of conference without waiting room', () => {
				it('should return forbidden', async () => {
					const { scope, scopeId, expert, videoConference } = await setup();
					currentUser = mapUserToCurrentUser(expert);
					mockBbbMeetingInfoSuccess();
					videoConference.options.moderatorMustApproveJoinRequests = false;
					await em.persistAndFlush(videoConference);

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/info`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when conference is not running', () => {
				it('should return ok', async () => {
					const { scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/info`);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});
		});
	});

	describe('[PUT] /videoconference2/:scope/:scopeId/end', () => {
		describe('when user is unauthorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/anyScope/anyId/end`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when scope and scopeId are given', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] });
				const studentRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.JOIN_MEETING],
				});
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.START_MEETING, Permission.JOIN_MEETING],
				});

				const student: User = userFactory.buildWithId({ school, roles: [studentRole] });
				const teacher: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, students: [student], teachers: [teacher] });
				const videoConference: VideoConference = videoConferenceFactory.buildWithId({
					targetModel: TargetModels.COURSES,
					target: course.id,
				});

				await em.persistAndFlush([school, studentRole, teacherRole, student, teacher, course, videoConference]);
				em.clear();

				const scope: VideoConferenceScope = VideoConferenceScope.COURSE;
				const scopeId: string = course.id;

				return { scope, scopeId, teacher, student, school };
			};

			describe('when school has not enabled the school feature videoconference', () => {
				it('should return forbidden', async () => {
					const { scope, scopeId, teacher, school } = await setup();
					school.features = [];
					await em.persistAndFlush(school);
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbMeetingInfoFailed();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/end`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when a user without required permission wants to end a conference', () => {
				it('should return forbidden', async () => {
					const { scope, scopeId, student } = await setup();
					currentUser = mapUserToCurrentUser(student);

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/end`);

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when a user with required permission wants to end a conference', () => {
				it('should return ok', async () => {
					const { scope, scopeId, teacher } = await setup();
					currentUser = mapUserToCurrentUser(teacher);
					mockBbbEndSuccess();

					const response: Response = await request(app.getHttpServer()).get(`${BASE_URL}/${scope}/${scopeId}/end`);

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});
		});
	});
});
