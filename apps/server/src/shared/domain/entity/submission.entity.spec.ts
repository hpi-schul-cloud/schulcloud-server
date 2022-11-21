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

	describe('constructor is called', () => {
		describe('when files are is passed', () => {
			it('create with studentFiles should be possible', () => {
				const task = taskFactory.buildWithId();
				const file = fileFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, studentFiles: [file] });

				expect(submission.studentFiles.contains(file)).toBe(true);
			});
		});
	});

	describe('isSubmitted is called', () => {
		describe('when submission is submitted', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.submitted().studentWithId().buildWithId({ task });

				return { submission };
			};

			it('should return true.', () => {
				const { submission } = setup();

				expect(submission.isSubmitted()).toEqual(true);
			});
		});
	});

	describe('isSubmittedForUser is called', () => {
		describe('when submission is submitted and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.submitted().studentWithId().buildWithId({ task, student: user });

				return { submission, user };
			};

			it('should return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission is submitted and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId({ task, teamMembers: [user] });

				return { submission, user };
			};

			it('should return true.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(true);
			});
		});

		describe('when submission is submitted and user is no member of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId({ task });

				return { submission, user };
			};

			it('should be return false.', () => {
				const { submission, user } = setup();

				expect(submission.isSubmittedForUser(user)).toEqual(false);
			});
		});
	});

	describe('isGraded is called', () => {
		describe('when submission is not graded', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ task, student });

				return submission;
			};

			it('should return false.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(false);
			});
		});

		describe('when grade exists', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const grade = 50;
				const submission = submissionFactory.buildWithId({ task, student, grade });

				return submission;
			};

			it('should return true.', () => {
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

			it('should return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});

		describe('when gradeFiles exist', () => {
			const setup = () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const file = fileFactory.buildWithId();
				const gradeFiles = [file];
				const submission = submissionFactory.buildWithId({ task, student, gradeFiles });

				return submission;
			};

			it('should return true.', () => {
				const submission = setup();

				expect(submission.isGraded()).toEqual(true);
			});
		});
	});

	describe('isGradedForUser is called', () => {
		describe('when submission is graded and user is creator of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ task, student: user });

				return { submission, user };
			};

			it('should return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when submission is graded and user is teamMember of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ task, teamMembers: [user] });

				return { submission, user };
			};

			it('should return true.', () => {
				const { submission, user } = setup();

				expect(submission.isGradedForUser(user)).toEqual(true);
			});
		});

		describe('when submission is graded and user is not a member of the submission', () => {
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

	describe('getSubmitterIds is called', () => {
		describe('when creator exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				return { submission, user };
			};

			it('should be return the userId of the creator', () => {
				const { submission, user } = setup();

				const result = submission.getSubmitterIds();

				expect(result.length).toEqual(1);
				expect(result.includes(user.id)).toBe(true);
			});
		});

		describe('when teamMembers exist', () => {
			const setup = () => {
				const submission = submissionFactory.studentWithId().teamMembersWithId(3).buildWithId();

				return { submission };
			};

			it('should be return the userIds of the creator and of the teammembers.', () => {
				const { submission } = setup();

				const result = submission.getSubmitterIds();

				expect(result.length).toEqual(4);
			});
		});

		describe('when coursegroup is added', () => {
			const setup = () => {
				const courseGroup = courseGroupFactory.studentsWithId(3).build();
				const submission = submissionFactory.studentWithId().buildWithId({ courseGroup });
				const creatorId = submission.student.id;
				const courseGroupStudentIdsObjectIds = courseGroup.students.getIdentifiers('_id');
				const courseGroupStudentIds = courseGroupStudentIdsObjectIds.map((id) => id.toString());

				const spy = jest.spyOn(courseGroup, 'getStudentIds');

				return { submission, courseGroupStudentIds, creatorId, spy };
			};

			it('should call getStudentIds in coursegroup', () => {
				const { submission, spy } = setup();

				submission.getSubmitterIds();

				expect(spy).toBeCalled();
			});

			it('should be return the userId of the creator and of the students of the coursegroup.', () => {
				const { submission, creatorId, courseGroupStudentIds } = setup();

				const result = submission.getSubmitterIds();

				expect(result.length).toEqual(4);
				expect(result.includes(creatorId)).toBe(true);
				expect(result.includes(courseGroupStudentIds[0])).toBe(true);
				expect(result.includes(courseGroupStudentIds[1])).toBe(true);
				expect(result.includes(courseGroupStudentIds[2])).toBe(true);
			});
		});

		describe('when submission is not populated', () => {
			const setup = () => {
				const submission = submissionFactory.studentWithId().buildWithId({});
				Object.assign(submission, { teamMembers: undefined });

				return { submission };
			};

			it('should throw a internal server exception.', () => {
				const { submission } = setup();

				expect(() => {
					submission.getSubmitterIds();
				}).toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('isUserSubmitter is called', () => {
		describe('when user is a member', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				jest.spyOn(submission, 'getSubmitterIds').mockImplementationOnce(() => [user.id]);

				return { submission, user };
			};

			it('should return true', () => {
				const { submission, user } = setup();

				const result = submission.isUserSubmitter(user);

				expect(result).toBe(true);
			});
		});

		describe('when user is not a submitter', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				jest.spyOn(submission, 'getSubmitterIds').mockImplementationOnce(() => []);

				return { submission, user };
			};

			it('should return false', () => {
				const { submission, user } = setup();

				const result = submission.isUserSubmitter(user);

				expect(result).toBe(false);
			});
		});
	});
});
