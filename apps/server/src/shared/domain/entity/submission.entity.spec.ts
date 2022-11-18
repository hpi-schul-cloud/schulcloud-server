import { MikroORM } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import {
	userFactory,
	taskFactory,
	submissionFactory,
	fileFactory,
	setupEntities,
	courseGroupFactory,
} from '@shared/testing';

describe('Submission entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('isSubmitted is called', () => {
		describe('when submission exists', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.studentWithId().buildWithId({ task });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isSubmitted()).toEqual(true);
			});
		});
	});

	describe('isSubmittedForUser is called', () => {
		describe('when submission exists and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.studentWithId().buildWithId({ task, student: user });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission exists and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, teamMembers: [user] });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission exists and user is no member of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task });

				return { submission, user };
			};

			it('should be return false.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(false);
			});
		});
	});

	describe('isGraded is called', () => {
		describe('when no grades exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student });

				return submission;
			};

			it('should be return false.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(false);
			});
		});

		describe('when grade exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.graded().buildWithId({ task, student, grade });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});

		describe('when gradeComment exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const gradeComment = 'Very good!';
				const submission = submissionFactory.buildWithId({ task, student, gradeComment });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});

		describe('when gradeFiles exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const file = fileFactory.buildWithId();
				const gradeFiles = [file];
				const submission = submissionFactory.buildWithId({ task, student, gradeFiles });

				return submission;
			};

			it('should be return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});
	});

	describe('isGradedForUser is called', () => {
		describe('when grade exists and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ task, student: user });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when grade exists and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ task, teamMembers: [user] });

				return { submission, user };
			};

			it('should be return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when grade exists and user is not a member of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ task });

				return { submission, user };
			};

			it('should be return false.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(false);
			});
		});
	});

	describe('getMemberUserIds is called', () => {
		describe('when creator exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				return { submission, user };
			};

			it('should be return the userId of the creator', () => {
				const { submission, user } = setup();

				const result = submission.getMemberIds();

				expect(result.length).toEqual(1);
				expect(result.includes(user.id)).toBe(true);
			});
		});

		describe('when teamMembers exists', () => {
			const setup = () => {
				const submission = submissionFactory.studentWithId().teamMembersWithId(3).buildWithId();

				return { submission };
			};

			it('should be return the userIds of the creator and of the teammembers.', () => {
				const { submission } = setup();

				const result = submission.getMemberIds();

				expect(result.length).toEqual(4);
			});
		});

		describe('when coursegroup is added', () => {
			const setup = () => {
				const courseGroup = courseGroupFactory.studentsWithId(3).build();
				const submission = submissionFactory.studentWithId().buildWithId({ courseGroup });

				return { submission };
			};

			it('should be return the userId of the creator and of the students of the coursegroup.', () => {
				const { submission } = setup();

				const result = submission.getMemberIds();

				expect(result.length).toEqual(4);
			});
		});

		describe('when submission is not populated', () => {
			const setup = () => {
				const submission = submissionFactory.studentWithId().buildWithId({});
				Object.assign(submission, { teamMembers: undefined });

				return { submission };
			};

			it('should be return the userId of the creator and of the students of the coursegroup.', () => {
				const { submission } = setup();

				expect(() => {
					submission.getMemberIds();
				}).toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('userIsMember is called', () => {
		describe('when user is a member', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				jest.spyOn(submission, 'getMemberIds').mockImplementationOnce(() => [user.id]);

				return { submission, user };
			};

			it('should be return true', () => {
				const { submission, user } = setup();

				const result = submission.userIsMember(user);

				expect(result).toBe(true);
			});
		});

		describe('when user is not a member', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				jest.spyOn(submission, 'getMemberIds').mockImplementationOnce(() => []);

				return { submission, user };
			};

			it('should be return true', () => {
				const { submission, user } = setup();

				const result = submission.userIsMember(user);

				expect(result).toBe(false);
			});
		});
	});
});
