# #BUIDL 101 with OpenZeppelin on Ethereum
###### *Last Update: September 2019*

## Intro
Student code content for a 1 day workshop I run, most recently for St Gallens (Switzerland) Summer school 2018 and 2019 (in collaboration with [Crypto Valley Society](https://www.cryptovalleysociety.com/)).

More info:
 - [Twitter](https://twitter.com/daveytea)
 - [LinkedIn](https://www.linkedin.com/in/daveytea/)

## Pre-setup
1. Open MetaMask extension and follow the instructions. We're not dealing with `real` money today, so you don't need to backup the seed words.
 - In the real world, you would definitely back them up.
 - Choose an easy to remember password for this lesson.

## Setting up
1. Install OpenZeppelin SDK, Ganache, and truffle
    ```
    sudo npm install -g truffle@5.0.2 ganache-cli@6.3.0 @openzeppelin/cli@2.5.1 --unsafe-perm
    ```
2. Setup the starter kit (takes a while to download)
    ```
    mkdir eth
    cd eth
    openzeppelin unpack starter
    ```

## Starting
1. Open a **new** terminal window and run a local blockchain
    ```
    ganache-cli --deterministic
    ```
2. Note: the available accounts. Select and copy the first entry under `Private Keys` and import it into Metamask
    1. Open MetaMask
    2. Select the localhost 8545 network
        - If it is not there, then select `Custom RPC`
        - Fill out the non-optional details and copy/paste `http://127.0.0.1:8545` into the `New RPC URL` box
    3. Click the top right hand circle icon --> Import Account --> Private Key, then paste your `Private Key` that you previously copied from the terminal into the box. Click `Import` button.
    4. You should now see the new account added, with 100 ETH. This is your **owner** address.

2. In your **original** terminal window, init the project and follow the prompts
    ```
    openzeppelin init
    ```

3. Next, in the same window, link the OpenZeppelin SDK (will be explained later)
    ```
    npx openzeppelin link @openzeppelin/contracts-ethereum-package
    ```
3. In another **new** terminal window, go to the `client` directory and start React app
    ```
    cd client
    npm run start
    ```
4. Your browser should open at `http://localhost:3000`. We'll explain what we're looking at.

## Developing on the 'Blockchain'
1. Look around the project directory. We'll go through what each section means and what it is for.

    ### ERC20
    1. Create your first Solidity contract by creating a new file in `contracts/` named `MyToken.sol`, and copy+paste the following:
        ```js
        pragma solidity ^0.5.0;

        import "@openzeppelin/upgrades/contracts/Initializable.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

        contract MyToken is Initializable, ERC20, ERC20Detailed, ERC20Mintable {

            function initialize() initializer public {
                ERC20Mintable.initialize(msg.sender);
                ERC20Detailed.initialize("MyName", "TKN", 18);
            }

        }
        ```
        - Replace `MyName` and `TKN` in the `initialize()` function to your name and initials.
        - We'll go through what each line means... and why we're using OpenZeppelin
    4. Compile your contract and publish it on your local blockchain
        ```
        openzeppelin compile
        ```
        Note: the new `build` folder and the .json files

    5. Migrate your compiled contracts to your local blockchain (this also compiles the contracts)
        ```
        openzeppelin create
        ```
        - Follow the prompts, selecting your `MyToken` contract, then selecting the `development` blockchain.
        - When asked `Do you want to call a function on the instance after creating it?`, selected Yes, and select `initialize()`
    6. You can now call `public` functions in your contract, straight from the terminal:
        ```
        openzeppelin call
        ```
         - Select the `development` network --> `MyToken` contract
         - Select `isMinter()` function --> Paste your address from MetaMask
    7. Experiment with the other functions shown when you use `openzeppelin call`. Where do these functions come from?

    ### ERC721
    1. Create another Solidity ocntract in `contracts/` named `MyLimitedToken.sol`:
        ```js
        pragma solidity ^0.5.0;

        import "@openzeppelin/upgrades/contracts/Initializable.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Enumerable.sol";
        import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721MetadataMintable.sol";

        contract MyLimitedToken is Initializable, ERC721, ERC721Enumerable, ERC721MetadataMintable {
            function initialize() public initializer {
                ERC721.initialize();
                ERC721Enumerable.initialize();
                ERC721Metadata.initialize("MyLimitedToken", "LTKN");
                ERC721MetadataMintable.initialize(msg.sender);
            }
        }
        ```
        - Replace `MyLimitedToken` and `LTKN` in the `initialize()` function to something of your choice.

    2. Similar to the ERC20 token, compile and publish your contract to your local blockchain
        ```
        openzeppelin create
        ```
        - Follow the prompts, selecting your `MyLimitedToken` contract, then selecting the `development` blockchain.
        - When asked `Do you want to call a function on the instance after creating it?`, selected Yes, and select `initialize()`

    3. You can now call `public` functions in your contract, straight from the terminal:
        ```
        openzeppelin call
        ```

## Developing the User Interface

1. Now we'll start developing the front end. Restart the React terminal window by either closing it or pressing `CTRL+C` in the terminal window.

### React introduction
1. Replace the contents of `client/src/app.js` with the following (we'll go over what it means):
```js
import React, { useState, useEffect } from 'react';

import { useWeb3Injected } from '@openzeppelin/network';
import Web3Info from './components/Web3Info/index.js';

import { Button, Card, Form, Image, PublicAddress, Select } from 'rimble-ui';
import styles from './App.module.scss';
import web3Styles from './components/Web3Info/Web3Info.module.scss';

function App() {
  const injected = useWeb3Injected();

  const [tokenInstance, setTokenInstance] = useState(0);
  const [tokenDetails, setTokenDetails] = useState(0);
  const [limitedTokenInstance, setLimitedTokenInstance] = useState(0);
  const [limitedTokenDetails, setLimitedTokenDetails] = useState(0);
  const [nftDetails, setNftDetails] = useState(0);

  const loadContracts = async () => {
    let MyToken = {};
    let MyLimitedToken = {};

    try {
      MyToken = require('../../contracts/MyToken.sol');
      MyLimitedToken = require('../../contracts/MyLimitedToken.sol');
    } catch (e) {
      console.log(e);
    }

    let networkId = await injected.networkId;
    let tokenInstance = null;
    let tokenDeployedNetwork = null;
    let limitedTokenInstance = null;
    let limitedTokenDeployedNetwork = null;

    if (MyToken.networks) {
      tokenDeployedNetwork = MyToken.networks[networkId];
      if (tokenDeployedNetwork) {
        tokenInstance = new injected.lib.eth.Contract(
          MyToken.abi,
          tokenDeployedNetwork && tokenDeployedNetwork.address,
        );
        setTokenInstance(tokenInstance);
        // await getDetails(tokenInstance);
      }
    }

    if (MyLimitedToken.networks) {
      limitedTokenDeployedNetwork = MyLimitedToken.networks[networkId];
      if (limitedTokenDeployedNetwork) {
        limitedTokenInstance = new injected.lib.eth.Contract(
          MyLimitedToken.abi,
          limitedTokenDeployedNetwork && limitedTokenDeployedNetwork.address,
        );
        setLimitedTokenInstance(limitedTokenInstance);
        // await getDetails(limitedTokenInstance, true);
      }
    }
  };

  useEffect(() => {
    loadContracts();
  }, [injected.accounts, injected.networkId]);

  // Insert ERC20 logic here

  // Insert ERC721 logic here

  return (
    <div className={styles.App}>
      <br />
      <h1>#BUIDL 101</h1>
      <div className={styles.wrapper}>
        <Web3Info title="Injected Web3" web3Context={injected} />
        <br />
        {/* Insert ERC20 render code here */}
        <br />
        {/* Insert ERC721 render code here */}
      </div>
      <br />
    </div>
  );
}

export default App;
```
2. In your React terminal, restart React again with `npm run start`.

### Interacting with the ERC20 token
3. In the code where it shows `// Insert ERC20 logic here`, insert the following (we'll go over what it means):
```js
  const getDetails = async (instance, isLimited = false) => {
    let name = await instance.methods.name().call();
    let symbol = await instance.methods.symbol().call();

    if (!isLimited) {
      let totalSupply = injected.lib.utils.fromWei(await instance.methods.totalSupply().call(), 'ether');
      let yourTokenBalance = injected.lib.utils.fromWei(
        await instance.methods.balanceOf(injected.accounts[0]).call(),
        'ether',
      );
      setTokenDetails({ name, symbol, totalSupply, yourTokenBalance });
    } else {
      let yourTokenBalance = await instance.methods.balanceOf(injected.accounts[0]).call();
      let totalSupply = await instance.methods.totalSupply().call();
      let nftDetails = await getNFTDetails(totalSupply, instance);
      setLimitedTokenDetails({ name, symbol, totalSupply, yourTokenBalance, nftDetails });
    }
  };

  const mintTokens = async e => {
    e.preventDefault();
    let amount = e.target.amount.value;
    let address = e.target.address.value;
    let amountInWei = injected.lib.utils.toWei(amount.toString(), 'ether');
    let success = await tokenInstance.methods.mint(address, amountInWei).send({ from: injected.accounts[0] });
    console.log(`Successfully minted: ${JSON.stringify(success)}`);
    loadContracts();
  };
```
3. In the `loadContracts()` function in your code, uncomment `// await getDetails(tokenInstance);` and `// await getDetails(limitedTokenInstance, true);`

4. In the `return()` function at the bottom, replace `{/* Insert ERC20 render code here */}` with the following (we'll go over what it means):
```html
        {tokenInstance &&
          <div className={web3Styles.web3}>
            <h3>
              {tokenDetails.name} ({tokenDetails.symbol})
            </h3>
            <div className={web3Styles.dataPoint}>
              <div className={web3Styles.label}>Current total supply of {tokenDetails.symbol}:</div>
              <div className={web3Styles.value}>{tokenDetails.totalSupply}</div>
              <div className={web3Styles.label}>Your balance of {tokenDetails.symbol}:</div>
              <div className={web3Styles.value}>{tokenDetails.yourTokenBalance}</div>
            </div>
            <br />
            <Form onSubmit={mintTokens}>
              <Form.Field label="Receiver Address" width={1}>
                <Form.Input type="address" required id="address" />
              </Form.Field>
              <Form.Field label="Amount" width={1}>
                <Form.Input type="amount" required id="amount" />
              </Form.Field>
              <Button type="Submit" width={1}>
                Mint {tokenDetails.symbol} Tokens
              </Button>
            </Form>
          </div>
        }
```
- You are now able to mint tokens (from your owner address) in your front end! Test it out!

### Interacting with the ERC721 tokens

5. In the code where it shows `// Insert ERC721 logic here`, insert the following (we'll go over what it means):
```js
  const mintNFTokens = async e => {
    e.preventDefault();
    let address = e.target.address.value;
    let tokenId = Number(e.target.id.value);
    let uri = e.target.uri.value;
    let success = await limitedTokenInstance.methods
      .mintWithTokenURI(address, tokenId, uri)
      .send({ from: injected.accounts[0] });
    console.log(`Successfully minted NFT: ${JSON.stringify(success)}`);
    loadContracts();
  };

  const getNFTInfo = async e => {
    e.preventDefault();
    let index = Number(e.target.id.value);
    let tokenId = Number(limitedTokenDetails.nftDetails[index].label);
    let owner = await limitedTokenInstance.methods.ownerOf(tokenId).call();
    let uri = await limitedTokenInstance.methods.tokenURI(tokenId).call();
    setNftDetails({ owner, uri })
  };

  const getNFTDetails = async (totalSupply, instance) => {
    let results = [...Array(Number(totalSupply))].map(async (_, index) => {
      let tokenId = await instance.methods.tokenByIndex(index).call();
      return { value: index, label: tokenId };
    });
    return await Promise.all(results);
  };
```

6. In the `return()` function at the bottom, replace `{/* Insert ERC721 render code here */}` with the following (we'll go over what it means):
```html
        {limitedTokenInstance &&
          <>
            <div className={web3Styles.web3}>
              <h3>
                {limitedTokenDetails.name} ({limitedTokenDetails.symbol})
              </h3>
              <div className={web3Styles.dataPoint}>
                <div className={web3Styles.label}>Current total supply of {limitedTokenDetails.symbol}:</div>
                <div className={web3Styles.value}>{limitedTokenDetails.totalSupply}</div>
                <div className={web3Styles.label}>Your balance of {limitedTokenDetails.symbol}:</div>
                <div className={web3Styles.value}>{limitedTokenDetails.yourTokenBalance}</div>
              </div>
              <br />
              {/* Insert NFT display code here */}
            </div>
            <br />
            <div className={web3Styles.web3}>
              <h3>Mint {limitedTokenDetails.symbol}</h3>
              <Form onSubmit={mintNFTokens}>
                <Form.Field label="Receiver address" width={1}>
                  <Form.Input type="address" required id="address" />
                </Form.Field>
                <Form.Field label="Token ID" width={1}>
                  <Form.Input type="id" required id="id" />
                </Form.Field>
                <Form.Field label="Token URI (message)" width={1}>
                  <Form.Input type="uri" required id="uri" />
                </Form.Field>
                <Button type="Submit" width={1}>
                  Mint Unique {limitedTokenDetails.symbol} Token
                </Button>
              </Form>
            </div>
          </>
        }
```
- You are now able to mint unique tokens, also known as NFTs (from your owner address) in your front end! Test it out!

### Viewing the ERC721 tokens

7. In the `return()` function at the bottom, replace `{/* Insert NFT display code here */}` with the following (we'll go over what it means):
```html
              <h3>Get Information</h3>
              <Form onSubmit={getNFTInfo}>
                <Form.Field label="Choose token ID" width={1}>
                  <Select options={limitedTokenDetails.nftDetails} id="id" />
                </Form.Field>
                <Button type="Submit" width={1}>
                  Get info
                </Button>
              </Form>
              <br />
              {nftDetails ? (
                <Card>
                  <PublicAddress label="Token Owner" address={nftDetails.owner} />
                  <PublicAddress label="Token URI" address={nftDetails.uri} />
                  <Image borderRadius={8} height="auto" src={nftDetails.uri} />
                </Card>
              ) : (
                <></>
              )}
```
- You are now able to view the NFTs in your front end! Test it out!

## Deploying
1. It's not much fun on your local blockchain, so lets try deploying to a public `testnet`

2. In the root of your code directory, replace the code in `truffle-config.js` with:
    ```js
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
    ```
3. Sign up for an [Infura account here](https://infura.io/register)
     - Create a new project, and copy the `PROJECT ID` code into your `truffle-config.js`, replacing `INSERT_YOUR_INFURA_KEY`

4. Open MetaMask, click on the top right corner icon --> Settings --> Security & Privacy --> Click `Reveal Seed Words` button
     - Enter your password to MetaMask
     - Copy your the private seed phrase into `truffle-config.js`, replacing `INSERT_YOUR_SEED_WORDS_FROM_METAMASK`

5. Save the changes you made to `truffle-config.js`

6. You will now have to fund your Rinkeby Ethereum account. Go to the [Rinkeby Faucet](https://www.rinkeby.io/#faucet) to get some free Rinkeby ETH.

6. Once you have some Rinkeby ETH in your MetaMask account, go back to your OpenZeppelin terminal window
     - Enter the command `openzeppelin create`
     - Select the `Rinkeby` network
     - Select your `MyToken` contract
     - Deploy the contract to Rinkeby
     - Make sure you `initalize()` **both** contracts once they are deployed
        - You can either do this by calling it after deploying (by selecting 'y' when prompted), or
        - You can enter the command `openzeppelin call` and select the relevant contracts

7. Open your React app, but select `Rinkeby` network in MetaMask. Congratulations, your contracts are now deployed.
 - You should now be able to mint and send your tokens and limited tokens (NFTs) to your friends. Ask for each other's MetaMask addresses.
 - You can also see the activity of all tokens by searching for either the contract address, or the person's ETH address on [Etherscan](https://rinkeby.etherscan.io)

## Extending
There are many more things you could do with this new foundation. Here are some ideas:
  - Basic:
     - Experiment with the other methods and contracts in the OpenZeppelin library (roles, etc)
     - Deploy your React frontend on [GitHub](https://pages.github.com/), so anyone in the world can interact with your contracts
     - Improve the user experience of the front end, by including loading indicators or hiding admin actions they don't have permission to perform

 - Advanced:
     - Accept ETH in exchange for your tokens (or NFTs)
     - Allow your tokens to be swapped for special NFTs
     - Allow others to mint tokens on your behalf
     - Build on top of other people's tokens (e.g. burn 4 of theirs to receive 1 of yours)

## Further study
 - [OpenZeppelin documentation](https://docs.openzeppelin.com/sdk/2.5/interacting)
 - [Ethereum Foundation](https://ethereum.org/)
