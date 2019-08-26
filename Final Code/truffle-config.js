const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = INSERT_YOUR_SEED_WORDS_FROM_METAMASK;
const infuraKey = INSERT_YOUR_INFURA_KEY

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/" + infuraKey),
      network_id: 4,
      gas: 7000000,
      gasPrice: 5000000000
    }
  }
};