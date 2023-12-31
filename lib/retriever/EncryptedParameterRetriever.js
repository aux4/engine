const ParameterRetriever = require("./ParameterRetriever");

class EncryptedParameterRetriever extends ParameterRetriever {
  async $lookup(command, parameters, name, args, proxy) {
    if (name.startsWith("encrypted")) return undefined;

    const encryptedParameterName = `encrypted${name.substring(0, 1).toUpperCase()}${name.substring(1)}`;
    const encryptedValue = await parameters[encryptedParameterName] || await proxy[encryptedParameterName];
    if (!encryptedValue) return undefined;

    const aux4EncryptModule = getModule();
    if (!aux4EncryptModule) return undefined;

    const Crypto = aux4EncryptModule.Crypto;
    const secret = await parameters.secret;
    const crypto = new Crypto(secret);

    return crypto.decrypt(encryptedValue);
  }
}

function getModule() {
  try {
    return require("@aux4/encrypt");
  } catch (e) {
    return undefined;
  }
}

module.exports = EncryptedParameterRetriever;
