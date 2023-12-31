const ProfileExecutor = require("../../lib/executor/ProfileExecutor");

jest.mock("../../lib/Executor");
const Executor = require("../../lib/Executor");

const interpreter = {
  interpret: jest.fn((command, action) => action)
};

const profileExecutorType = ProfileExecutor.with(null);
const profileExecutor = profileExecutorType(interpreter, null);

describe("profileExecutor", () => {
  let mockedExecutor;

  beforeEach(() => {
    mockedExecutor = {
      defineProfile: jest.fn(),
      execute: jest.fn()
    };
    Executor.mockReturnValue(mockedExecutor);
  });

  describe("execute", () => {
    let action, args, parameters, result;

    describe("when is not a profile", () => {
      beforeEach(async () => {
        action = "mkdir test";
        args = [];
        parameters = {};

        result = await profileExecutor.execute({}, action, args, parameters);
      });

      it("returns false", () => {
        expect(result).toBeFalsy();
      });
    });

    describe("when is a profile", () => {
      let profile;

      beforeEach(async () => {
        profile = "git";
        action = "profile:" + profile;
        args = ["push"];
        parameters = { params: {} };

        result = await profileExecutor.execute({}, action, args, parameters);
      });

      it('calls "executor.defineProfile" with the profile', () => {
        expect(mockedExecutor.defineProfile).toHaveBeenCalledWith(profile);
      });

      it('executes "executor.execute"', () => {
        expect(mockedExecutor.execute).toHaveBeenCalledWith(args, parameters.$params);
      });

      it("returns true", () => {
        expect(result).toBeTruthy();
      });
    });
  });
});
