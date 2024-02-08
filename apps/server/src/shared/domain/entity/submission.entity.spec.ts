import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import {
	courseGroupFactory,
	schoolEntityFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { Submission } from './submission.entity';

describe('Submission entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor is called', () => {
		const setup = () => {
			const school = schoolEntityFactory.build();
			const student = userFactory.build();
			const task = taskFactory.buildWithId();
			const teamMember = userFactory.build();

			return { school, student, task, teamMember };
		};

		describe('when required pros are set', () => {
			it('should contains default props', () => {
				const { school, student, task } = setup();

				const submission = new Submission({
					school,
					student,
					task,
					comment: 'test',
				});

				expect(submission).toStrictEqual(
					expect.objectContaining({
						school,
						student,
						task,
						comment: 'test',
						graded: false,
						submitted: false,
					})
				);
			});
		});

		describe('when teamMembers are passed', () => {
			it('should contains teamMember', () => {
				const { school, student, task, teamMember } = setup();

				const submission = new Submission({
					school,
					student,
					task,
					comment: 'test',
					teamMembers: [teamMember],
				});

				expect(submission.teamMembers.contains(teamMember)).toBe(true);
			});
		});

		describe('when submitted is passed', () => {
			it('should return true', () => {
				const { school, student, task } = setup();

				const submission = new Submission({
					school,
					student,
					task,
					comment: 'test',
					submitted: true,
				});

				expect(submission.submitted).toBe(true);
			});
		});

		describe('when graded is passed', () => {
			it('should return true', () => {
				const { school, student, task } = setup();

				const submission = new Submission({
					school,
					student,
					task,
					comment: 'test',
					graded: true,
				});

				expect(submission.graded).toBe(true);
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
				const submission = submissionFactory.graded().buildWithId({ task, student, grade });

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
				const creatorId = submission.student?.id;

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
	describe('removeStudentById', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const submission = submissionFactory.buildWithId({ student: user });

			return { submission, user };
		};
		describe('when userId matches studentId', () => {
			it('should remove student', () => {
				const { user, submission } = setup();
				submission.removeStudentById(user.id);

				expect(submission.student).toBeUndefined();
			});
		});
		describe('when userId not matches studentId', () => {
			it('should not remove student', () => {
				const { user, submission } = setup();

				submission.removeStudentById(new ObjectId().toString());

				expect(submission.student).toEqual(user);
			});
		});
	});
	describe('removeUserFromTeamMembers', () => {
		const setup = () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const submission = submissionFactory.buildWithId({ student: user1, teamMembers: [user1, user2] });

			return { submission, user1, user2 };
		};
		describe('when userId matches teamMemberId', () => {
			it('should remove student', () => {
				const { user1, submission, user2 } = setup();
				submission.removeUserFromTeamMembers(user1.id);

				expect(submission.teamMembers.length).toEqual(1);
				expect(submission.teamMembers[0]).toEqual(user2);
			});
		});
		describe('when userId not matches teamMemberId', () => {
			it('should not remove student', () => {
				const { user1, submission, user2 } = setup();

				submission.removeUserFromTeamMembers(new ObjectId().toString());

				expect(submission.teamMembers.length).toEqual(2);
				expect(submission.teamMembers[0]).toEqual(user1);
				expect(submission.teamMembers[1]).toEqual(user2);
			});
		});
	});
});
