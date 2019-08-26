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
        await getDetails(tokenInstance);
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
        await getDetails(limitedTokenInstance, true);
      }
    }
  };

  useEffect(() => {
    loadContracts();
  }, [injected.accounts, injected.networkId]);

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

  // ERC721
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

  return (
    <div className={styles.App}>
      <br />
      <h1>#BUIDL 101</h1>
      <div className={styles.wrapper}>
        <Web3Info title="Injected Web3" web3Context={injected} />
        <br />
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
        <br />
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
      </div>
      <br />
    </div>
  );
}

export default App;
