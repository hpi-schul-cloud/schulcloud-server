import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
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
		describe('when files are passed', () => {
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
		describe('when submission is submitted and user is a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(true);
				const spyIsSubmitted = jest.spyOn(submission, 'isSubmitted').mockReturnValueOnce(true);

				return { submission, user, spyIsUserSubmitter, spyIsSubmitted };
			};

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsSubmitted } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsSubmitted).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return true.', () => {
				const { submission, user } = setup();

				const result = submission.isSubmittedForUser(user);

				expect(result).toBe(true);
			});
		});

		describe('when submission is not submitted and user is a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(true);
				const spyIsSubmitted = jest.spyOn(submission, 'isSubmitted').mockReturnValueOnce(false);

				return { submission, user, spyIsUserSubmitter, spyIsSubmitted };
			};

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsSubmitted } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsSubmitted).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isSubmittedForUser(user);

				expect(result).toBe(false);
			});
		});

		describe('when submission is submitted and user is no submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(false);
				const spyIsSubmitted = jest.spyOn(submission, 'isSubmitted').mockReturnValueOnce(true);

				return { submission, user, spyIsUserSubmitter, spyIsSubmitted };
			};

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsSubmitted } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsSubmitted).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isSubmittedForUser(user);

				expect(result).toBe(false);
			});
		});

		describe('when submission is not submitted and user is no submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(false);
				const spyIsSubmitted = jest.spyOn(submission, 'isSubmitted').mockReturnValueOnce(false);

				return { submission, user, spyIsUserSubmitter, spyIsSubmitted };
			};

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsSubmitted } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsSubmitted).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isSubmittedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isSubmittedForUser(user);

				expect(result).toBe(false);
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
		describe('when submission is graded and user is a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(true);
				const spyIsGraded = jest.spyOn(submission, 'isGraded').mockReturnValueOnce(true);

				return { submission, user, spyIsUserSubmitter, spyIsGraded };
			};

			it('should be called submission.spyIsGraded.', () => {
				const { submission, user, spyIsGraded } = setup();

				submission.isGradedForUser(user);

				expect(spyIsGraded).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isGradedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return true.', () => {
				const { submission, user } = setup();

				const result = submission.isGradedForUser(user);

				expect(result).toBe(true);
			});
		});

		describe('when submission is not graded and user is a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(true);
				const spyIsGraded = jest.spyOn(submission, 'isGraded').mockReturnValueOnce(false);

				return { submission, user, spyIsUserSubmitter, spyIsGraded };
			};

			it('should be called submission.spyIsGraded.', () => {
				const { submission, user, spyIsGraded } = setup();

				submission.isGradedForUser(user);

				expect(spyIsGraded).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isGradedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isGradedForUser(user);

				expect(result).toBe(false);
			});
		});

		describe('when submission is graded and user is not a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(false);
				const spyIsGraded = jest.spyOn(submission, 'isGraded').mockReturnValueOnce(true);

				return { submission, user, spyIsUserSubmitter, spyIsGraded };
			};

			it('should be called submission.spyIsGraded.', () => {
				const { submission, user, spyIsGraded } = setup();

				submission.isGradedForUser(user);

				expect(spyIsGraded).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isGradedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isGradedForUser(user);

				expect(result).toBe(false);
			});
		});

		describe('when submission is not graded and user is not a submitter of the submission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId();

				const spyIsUserSubmitter = jest.spyOn(submission, 'isUserSubmitter').mockReturnValueOnce(false);
				const spyIsGraded = jest.spyOn(submission, 'isGraded').mockReturnValueOnce(false);

				return { submission, user, spyIsUserSubmitter, spyIsGraded };
			};

			it('should be called submission.spyIsGraded.', () => {
				const { submission, user, spyIsGraded } = setup();

				submission.isGradedForUser(user);

				expect(spyIsGraded).toBeCalled();
			});

			it('should be called submission.isUserSubmitter.', () => {
				const { submission, user, spyIsUserSubmitter } = setup();

				submission.isGradedForUser(user);

				expect(spyIsUserSubmitter).toBeCalledWith(user);
			});

			it('should return false.', () => {
				const { submission, user } = setup();

				const result = submission.isGradedForUser(user);

				expect(result).toBe(false);
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

			it('should return the userId of the creator', () => {
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

			it('should return the userIds of the creator and of the teammembers.', () => {
				const { submission } = setup();

				const result = submission.getSubmitterIds();

				expect(result.length).toEqual(4);
			});
		});

		describe('when coursegroup is added', () => {
			const setup = () => {
				const studentId1 = new ObjectId().toHexString();
				const studentId2 = new ObjectId().toHexString();
				const studentId3 = new ObjectId().toHexString();
				const studentIds = [studentId1, studentId2, studentId3];

				const courseGroup = courseGroupFactory.build();
				const submission = submissionFactory.studentWithId().buildWithId({ courseGroup });
				const creatorId = submission.student.id;

				const spy = jest.spyOn(courseGroup, 'getStudentIds').mockReturnValueOnce(studentIds);

				return { submission, studentIds, creatorId, spy };
			};

			it('should call getStudentIds in coursegroup', () => {
				const { submission, spy } = setup();

				submission.getSubmitterIds();

				expect(spy).toBeCalled();
			});

			it('should return the userId of the creator and of the students of the coursegroup.', () => {
				const { submission, creatorId, studentIds } = setup();

				const result = submission.getSubmitterIds();

				expect(result.length).toEqual(4);
				expect(result).toContain(creatorId);
				expect(result).toContain(studentIds[0]);
				expect(result).toContain(studentIds[1]);
				expect(result).toContain(studentIds[2]);
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
		describe('when user is a submitter', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user });

				const spy = jest.spyOn(submission, 'getSubmitterIds').mockImplementationOnce(() => [user.id]);

				return { submission, user, spy };
			};

			it('should call getSubmitterIds in course', () => {
				const { submission, spy } = setup();

				submission.getSubmitterIds();

				expect(spy).toBeCalled();
			});

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

				const spy = jest.spyOn(submission, 'getSubmitterIds').mockImplementationOnce(() => []);

				return { submission, user, spy };
			};

			it('should call getSubmitterIds in course', () => {
				const { submission, spy } = setup();

				submission.getSubmitterIds();

				expect(spy).toBeCalled();
			});

			it('should return false', () => {
				const { submission, user } = setup();

				const result = submission.isUserSubmitter(user);

				expect(result).toBe(false);
			});
		});
	});
});
