const colors = require("colors");
const Profile = require("./Profile");
const Help = require("./Help");
const Suggester = require("./Suggester");

class Executor {
  constructor(config, executorChain, suggester = new Suggester(), help = new Help()) {
    this.profiles = {};
    this.selectedProfile = "main";
    this.executorChain = executorChain;
    this.suggester = suggester;
    this.help = help;

    const cfg = config.get();
    const cfgProfiles = cfg.profiles;

    const self = this;
    cfgProfiles.forEach(cfgProfile => {
      self.profiles[cfgProfile.name] = new Profile(config, cfgProfile.name);
    });
  }

  profile(name) {
    return this.profiles[name];
  }

  defineProfile(name) {
    if (this.profiles[name] === undefined) {
      throw new Error(`profile ${name} does not exists`);
    }
    this.selectedProfile = name;
  }

  currentProfile() {
    return this.selectedProfile;
  }

  async execute(args, parameters = {}) {
    const profile = this.profiles[this.selectedProfile];

    const help = this.help;

    if (args.length === 0) {
      const length = maxLength(profile.commands());
      profile.commands().forEach(command => {
        help.print(command, length + 2);
      });
      return;
    }

    const command = profile.command(args[0]);
    if (!command) {
      this.suggester.suggest(profile, args[0]);
      return;
    }

    const showHelp = await parameters.help;
    if (args.length === 1 && showHelp) {
      help.print(command, command.name.length + 2);
      return;
    }

    await this.executorChain.execute(command, args.splice(1), parameters);
  }
}

function maxLength(commands) {
  let maxLength = 0;

  commands.forEach(command => {
    if (command.name.length > maxLength) {
      maxLength = command.name.length;
    }
  });

  return maxLength;
}

module.exports = Executor;
