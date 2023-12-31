const colors = require("colors");

const ExecutorChain = require("../lib/ExecutorChain");

const out = require("../lib/Output");

jest.mock("../lib/executor/LogExecutor");
const LogExecutor = require("../lib/executor/LogExecutor");

const ProfileExecutor = require("../lib/executor/ProfileExecutor");

jest.mock("../lib/executor/CommandLineExecutor");
const CommandLineExecutor = require("../lib/executor/CommandLineExecutor");
const Interpreter = require("../lib/Interpreter");
const CommandParameters = require("../lib/CommandParameters");

describe("executorChain", () => {
  let executorChain, logExecutor, profileExecutor, commandLineExecutor, interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
    out.println = jest.fn();

    logExecutor = {
      execute: jest.fn()
    };
    LogExecutor.mockReturnValue(logExecutor);

    profileExecutor = {
      execute: jest.fn()
    };
    ProfileExecutor.with = jest.fn().mockReturnValue(jest.fn().mockReturnValue(profileExecutor));

    commandLineExecutor = {
      execute: jest.fn()
    };
    CommandLineExecutor.mockReturnValue(commandLineExecutor);

    executorChain = new ExecutorChain(interpreter);
    executorChain.register(LogExecutor);
    executorChain.register(ProfileExecutor.with(null));
    executorChain.register(CommandLineExecutor);
  });

  describe("when execute is not defined", () => {
    let command, args, parameters;

    beforeEach(() => {
      command = {};
      args = [];
      parameters = {};

      executorChain.execute(command, args, parameters);
    });

    it('prints "execute is not defined"', () => {
      expect(out.println).toHaveBeenCalledWith("execute is not defined".red);
    });
  });

  describe("when execute is a function", () => {
    let command, args, parameters, commandParameters;

    beforeEach(async () => {
      command = {
        execute: jest.fn()
      };
      args = [];
      parameters = {};

      await executorChain.execute(command, args, parameters);

      commandParameters = new CommandParameters(command, parameters);
    });

    it("calls execute", () => {
      expect(command.execute).toHaveBeenCalledWith(commandParameters, args, command, interpreter);
    });
  });

  describe("when there are only command line", () => {
    let command, args, parameters, commandParameters;

    beforeEach(async () => {
      logExecutor.execute = jest.fn().mockReturnValue(false);
      profileExecutor.execute = jest.fn().mockReturnValue(false);
      commandLineExecutor.execute = jest.fn().mockReturnValue(true);

      command = {
        execute: ["mkdir test", "cd test"]
      };
      args = [];
      parameters = {};
      await executorChain.execute(command, args, parameters);

      commandParameters = CommandParameters.newInstance().create(command, parameters);
    });

    it("executes logExecutor for each command", () => {
      expect(logExecutor.execute.mock.calls.length).toEqual(2);
      expect(logExecutor.execute.mock.calls[0][0]).toEqual(command);
      expect(logExecutor.execute.mock.calls[0][1]).toEqual("mkdir test");
      expect(logExecutor.execute.mock.calls[0][2]).toBe(args);
      expect(logExecutor.execute.mock.calls[0][3].toString()).toEqual(commandParameters.toString());
      expect(logExecutor.execute.mock.calls[1][0]).toEqual(command);
      expect(logExecutor.execute.mock.calls[1][1]).toEqual("cd test");
      expect(logExecutor.execute.mock.calls[1][2]).toBe(args);
      expect(logExecutor.execute.mock.calls[1][3].toString()).toEqual(commandParameters.toString());
    });

    it("executes profileExecutor for each command", () => {
      expect(profileExecutor.execute.mock.calls.length).toEqual(2);
      expect(profileExecutor.execute.mock.calls[0][0]).toEqual(command);
      expect(profileExecutor.execute.mock.calls[0][1]).toEqual("mkdir test");
      expect(profileExecutor.execute.mock.calls[0][2]).toBe(args);
      expect(profileExecutor.execute.mock.calls[0][3].toString()).toEqual(commandParameters.toString());
      expect(profileExecutor.execute.mock.calls[1][0]).toEqual(command);
      expect(profileExecutor.execute.mock.calls[1][1]).toEqual("cd test");
      expect(profileExecutor.execute.mock.calls[1][2]).toBe(args);
      expect(profileExecutor.execute.mock.calls[1][3].toString()).toEqual(commandParameters.toString());
    });

    it("executes commandLineExecutor for each command", () => {
      expect(commandLineExecutor.execute.mock.calls.length).toEqual(2);
      expect(commandLineExecutor.execute.mock.calls[0][0]).toEqual(command);
      expect(commandLineExecutor.execute.mock.calls[0][1]).toEqual("mkdir test");
      expect(commandLineExecutor.execute.mock.calls[0][2]).toBe(args);
      expect(commandLineExecutor.execute.mock.calls[0][3].toString()).toEqual(commandParameters.toString());
      expect(commandLineExecutor.execute.mock.calls[1][0]).toEqual(command);
      expect(commandLineExecutor.execute.mock.calls[1][1]).toEqual("cd test");
      expect(commandLineExecutor.execute.mock.calls[1][2]).toBe(args);
      expect(commandLineExecutor.execute.mock.calls[1][3].toString()).toEqual(commandParameters.toString());
    });
  });

  describe("when there is a profile command", () => {
    let command;

    beforeEach(async () => {
      logExecutor.execute = jest.fn().mockReturnValue(false);
      profileExecutor.execute = jest.fn().mockReturnValue(true);
      commandLineExecutor.execute = jest.fn().mockReturnValue(true);

      command = {
        execute: ["profile:git"]
      };
      await executorChain.execute(command);
    });

    it("executes logExecutor for each command", () => {
      expect(logExecutor.execute.mock.calls.length).toEqual(1);
      expect(logExecutor.execute.mock.calls[0][0]).toEqual(command);
      expect(logExecutor.execute.mock.calls[0][1]).toEqual("profile:git");
    });

    it("executes profileExecutor for each command", () => {
      expect(profileExecutor.execute.mock.calls.length).toEqual(1);
      expect(profileExecutor.execute.mock.calls[0][0]).toEqual(command);
      expect(profileExecutor.execute.mock.calls[0][1]).toEqual("profile:git");
    });

    it("executes commandLineExecutor for each command", () => {
      expect(commandLineExecutor.execute.mock.calls.length).toEqual(0);
    });
  });

  describe("when executor throws error", () => {
    let command;

    beforeEach(async () => {
      logExecutor.execute = jest.fn().mockImplementation(() => {
        throw new Error("error executing log");
      });
      profileExecutor.execute = jest.fn().mockReturnValue(true);
      commandLineExecutor.execute = jest.fn().mockReturnValue(true);

      command = {
        execute: ["profile:git"]
      };
    });

    it("throws error", () => {
      expect(() => executorChain.execute(command)).rejects.toThrow("error executing log");
    });
  });
});
