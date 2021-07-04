import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link, withRouter } from "react-router-dom";
import "antd/dist/antd.css";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import "./App.css";
import { Helmet } from "react-helmet";
import { ChakraProvider, extendTheme, Box } from "@chakra-ui/react"
import { Row, Col, Button, Menu, Input, Typography, Modal, Space } from "antd";
import { SettingOutlined } from '@ant-design/icons';
import WebFont from 'webfontloader';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { useExchangePrice, useGasPrice, useUserProvider, useContractLoader, useContractReader, useEventListener, useBalance, useExternalContractLoader } from "./hooks";
import { AppHeader, Footer, Account, Ramp, Contract, GasGauge, Swap } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { Home, About, Pool } from "./views";
import { dMoonTheme } from "./theme";


import { INFURA_ID, ETHERSCAN_KEY, DAI_ADDRESS, DAI_ABI } from "./constants";
const { Text, Title, Paragraph } = Typography;

// 😬 Sorry for all the console logging 🤡
const DEBUG = true

// 🔭 block explorer URL
const blockExplorer = "https://etherscan.io/" // for xdai: "https://blockscout.com/poa/xdai/"

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
const mainnetProvider = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID)

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = "http://localhost:8545"; // for xdai: https://dai.poa.network
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);



function App({ Component, props, pageProps }) {
  const [injectedProvider, setInjectedProvider] = useState();


  /* 💵 this hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(mainnetProvider); //1 for xdai

  /* 🔥 this hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice("fast"); //1000000000 for xdai

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice)

  const [showNetworkWarning, setShowNetworkWarning] = useState(false)

  if (window.ethereum) {
    window.ethereum.autoRefreshOnNetworkChange = false
  }

  const loadWeb3Modal = useCallback(async () => {

    const provider = await web3Modal.connect();

    const newInjectedNetwork = async (chainId) => {
      let localNetwork = await localProvider.getNetwork()
      if (localNetwork.chainId == chainId) {
        setShowNetworkWarning(false)
        return true
      } else {
        setShowNetworkWarning(true)
        return false
      }
    }

    const newWeb3Provider = async () => {
      let newWeb3Provider = new Web3Provider(provider)
      let newNetwork = await newWeb3Provider.getNetwork()
      newInjectedNetwork(newNetwork.chainId)
      setInjectedProvider(newWeb3Provider);
    }

    newWeb3Provider()

    provider.on("chainChanged", (chainId) => {
      let knownNetwork = newInjectedNetwork(chainId)
      if (knownNetwork) newWeb3Provider()
    });

    provider.on("accountsChanged", (accounts) => {
      console.log(accounts);
      newWeb3Provider()
    });

  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname)
  }, [setRoute]);

  const [tokenListURI, setTokenListURI] = useState('http://localhost:3000/dMoonPairs.tokenlist')
  let onLocalChain = localProvider && localProvider.connection && localProvider.connection.url && localProvider.connection.url.indexOf("localhost") >= 0 && !process.env.REACT_APP_PROVIDER

  return (
    <ChakraProvider theme={dMoonTheme}>
      <BrowserRouter>
        <Box className="App" d="flex" flexFlow="column wrap" minHeight="100vh" position="relative">

          {/* ✏️ Edit the header and change the title to your project name */}
          <AppHeader
            address={address}
            localProvider={localProvider}
            userProvider={userProvider}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
            setRoute={setRoute}
            route={route}
            gasPrice={gasPrice}
          />

          <Box d="flex" as="section" flex={1} alignItems="center" justifyContent="center" pb="50px">
            <Switch>
              <Route exact path="/" withRouter>
                <Helmet>
                  <meta charSet="utf-8" />
                  <title>Swap dMoon - DAOMoon</title>
                  <link rel="canonical" href="http://mysite.com/example" />
                </Helmet>
                <Row justify="center">
                  <Swap
                    selectedProvider={userProvider}
                    tokenListURI={tokenListURI}
                  />
                </Row>
              </Route>
              <Route path="/pool" withRouter>
                <Helmet>
                  <meta charSet="utf-8" />
                  <title>dMoon pools - DAOMoon</title>
                  <link rel="canonical" href="http://mysite.com/example" />
                </Helmet>
                <Row justify="center">
                  <Pool />
                </Row>
              </Route>
              <Route path="/about" withRouter>
                <Helmet>
                  <meta charSet="utf-8" />
                  <title>About dMoon - DAOMoon</title>
                  <link rel="canonical" href="http://mysite.com/example" />
                </Helmet>
                <Row justify="center">
                  <About />
                </Row>
              </Route>
            </Switch>
          </Box>

          <Footer />
        </Box>
      </BrowserRouter>
    </ChakraProvider >
  );
}


/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

export default App;
