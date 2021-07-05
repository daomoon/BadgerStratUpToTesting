import React, { useState } from "react";
import { WalletOutlined, QrcodeOutlined, SendOutlined, KeyOutlined } from "@ant-design/icons";
import { Tooltip, Drawer, Statistic } from "antd";
import { Box, Heading, Text, Button, List, OrderedList, UnorderedList, ListItem, HStack, Image } from "@chakra-ui/react";
import QR from "qrcode.react";
import { parseEther } from "@ethersproject/units";
import { useUserAddress } from "eth-hooks";
import { Transactor } from "../helpers";
import Address from "./Address";
import Account from "./Account";
import Balance from "./Balance";
import AddressInput from "./AddressInput";
import EtherInput from "./EtherInput";
import { ethers } from "ethers";


/*

  Wallet UI for sending, receiving, and extracting the burner wallet

  <Wallet
    address={address}
    provider={userProvider}
    ensProvider={mainnetProvider}
    price={price}
  />

*/

export default function Wallet(props) {
  const signerAddress = useUserAddress(props.provider);
  const selectedAddress = props.address || signerAddress;

  const [open, setOpen] = useState();
  const [qr, setQr] = useState();
  const [amount, setAmount] = useState();
  const [userAccountData, setUserAccountData] = useState()
  const [toAddress, setToAddress] = useState();
  const [pk, setPK] = useState()
  const [walletOpen, setWalletOpen] = useState(false)
  const [showUsdPrice, setShowUsdPrice] = useState(true)

  const providerSend = props.provider ? (
    <Tooltip title="Wallet">
      <WalletOutlined
        onClick={() => {
          setOpen(!open);
        }}
        style={{
          padding: 7,
          color: props.color ? props.color : "black",
          cursor: "pointer",
          fontSize: 21,
          verticalAlign: "middle",
          transform: "rotate(-90deg)",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "rotate(0deg)"
          }
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  function toggleWallet() {
    setWalletOpen(!walletOpen);
  }

  let display;
  let qrDisplay;
  let pkDisplay;
  let receiveButton;
  let privateKeyButton;
  let pkReceiveButton;
  let qrReceiveButton;
  let pkPrivateKeyButton;
  let qrPrivateKeyButton;
  let daoTokensList;
  let yieldInfo;
  let walletFooter = [];
  let userStats;

  if (qr) {
    qrDisplay = (
      <Box maxWidth="300px">
        <Box>
          <Text copyable={{ text: selectedAddress }}>{selectedAddress}</Text>
        </Box>
        <QR
          value={selectedAddress}
          size="300"
          level="H"
          includeMargin
          renderAs="svg"
          imageSettings={{ excavate: false }}
        />
      </Box>
    );
    qrReceiveButton = (
      <Button
        key="hide"
        onClick={() => {
          setQr("");
        }}
      >
        <QrcodeOutlined /> Hide
      </Button>
    );
    qrPrivateKeyButton = (
      <Button key="hide" onClick={() => { setPK(selectedAddress); setQr("") }}>
        <KeyOutlined /> Private Key
      </Button>
    )
  } else if (pk) {

    let pk = localStorage.getItem("metaPrivateKey")
    let wallet = new ethers.Wallet(pk)

    if (wallet.address !== selectedAddress) {
      pkDisplay = (
        <Box>
          <Text>*injected account*, private key unknown</Text>
        </Box>
      )
    } else {

      let extraPkDisplayAdded = {}
      let extraPkDisplay = []
      extraPkDisplayAdded[wallet.address] = true
      extraPkDisplay.push(
        <div style={{ fontSize: 16, padding: 2, backgroundStyle: "#89e789" }}>
          <a href={"/pk#" + pk}>
            <Address minimized={true} value={wallet.address} ensProvider={props.ensProvider} /> {wallet.address.substr(0, 6)}
          </a>
        </div>
      )
      for (var key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          console.log(key)
          let pastpk = localStorage.getItem(key)
          let pastwallet = new ethers.Wallet(pastpk)
          if (!extraPkDisplayAdded[pastwallet.address] /*&& selectedAddress!=pastwallet.address*/) {
            extraPkDisplayAdded[pastwallet.address] = true
            extraPkDisplay.push(
              <div style={{ fontSize: 16 }}>
                <a href={"/pk#" + pastpk}>
                  <Address minimized={true} value={pastwallet.address} ensProvider={props.ensProvider} /> {pastwallet.address.substr(0, 6)}
                </a>
              </div>
            )
          }
        }
      }


      pkDisplay = (
        <Box maxWidth="300px">
          <b>Private Key:</b>

          <div>
            <Text copyable>{pk}</Text>
          </div>

          <hr />

          <i>Point your camera phone at qr code to open your {" "}
            <a target="_blank" href={"https://etherscan.io/address/" + pk} rel="noopener noreferrer">burner wallet</a>:
         </i>
          <QR value={"https://etherscan.io/address/" + pk} size={"300"} level={"H"} includeMargin={true} renderAs={"svg"} imageSettings={{ excavate: false }} />

          <Text style={{ fontSize: "16" }} copyable>{"https://etherscan.io/address/" + pk}</Text>

          {extraPkDisplay ? (
            <div>
              <h3>
                Known Private Keys:
             </h3>
              {extraPkDisplay}
              <Button onClick={() => {
                let currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
                if (currentPrivateKey) {
                  window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
                }
                const randomWallet = ethers.Wallet.createRandom()
                const privateKey = randomWallet._signingKey().privateKey
                window.localStorage.setItem("metaPrivateKey", privateKey);
                window.location.reload()
              }}>
                Generate
             </Button>
            </div>
          ) : ""}

        </Box>
      )
    }

    pkReceiveButton = (
      <Button key="receive" onClick={() => { setQr(selectedAddress); setPK("") }}>
        <QrcodeOutlined /> Receive
      </Button>
    )
    pkPrivateKeyButton = (
      <Button key="hide" onClick={() => { setPK(""); setQr("") }}>
        <KeyOutlined /> Hide
      </Button>
    )
  }
  const inputStyle = {
    padding: 0,
  };

  display = (
    <Box backgroundColor="white">
      <div style={inputStyle}>
        <AddressInput
          autoFocus
          ensProvider={props.ensProvider}
          placeholder="to address"
          value={toAddress}
          onChange={setToAddress}
        />
      </div>
      <div style={inputStyle}>
        <EtherInput
          price={props.price}
          value={amount}
          onChange={value => {
            setAmount(value);
          }}
        />
      </div>
    </Box>
  );
  receiveButton = (
    <Button
      key="receive"
      onClick={() => {
        setQr(selectedAddress);
        setPK("");
      }}
    >
      <QrcodeOutlined /> Receive
    </Button>
  );
  privateKeyButton = (
    <Button key="hide" onClick={() => { setPK(selectedAddress); setQr("") }}>
      <KeyOutlined /> Private Key
    </Button>
  );
  const daoTokens = [
    {
      "chainId": 1,
      "address": "0x30cf203b48edaa42c3b4918e955fed26cd012a3f",
      "name": "MetaGame",
      "symbol": "SEED",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/13099/small/V8phEz8V.png?1612854078"
    },
    {
      "chainId": 1,
      "address": "0xfb5453340c03db5ade474b27e68b6a9c6b2823eb",
      "name": "MetaFactory",
      "symbol": "ROBOT",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/13517/small/MF_Robot_200px.png?1609312481"
    },
    {
      "name": "DAOHaus",
      "address": "0xf2051511b9b121394fa75b8f7d4e7424337af687",
      "symbol": "HAUS",
      "decimals": 18,
      "chainId": 1,
      "logoURI": "https://assets.coingecko.com/coins/images/14551/small/jN3kkqke_400x400.png?1616990048"
    },
    {
      "name": "Opolis",
      "address": "0x1482295Df16e7761d128B9823B61785D43CA038B",
      "symbol": "WORK",
      "decimals": 18,
      "chainId": 1,
      "logoURI": "https://pbs.twimg.com/profile_images/1350145905438175234/ojsHt9O6_400x400.jpg"
    },
    {
      "chainId": 1,
      "address": "0xd56dac73a4d6766464b38ec6d91eb45ce7457c44",
      "name": "Panvala",
      "symbol": "PAN",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/9543/small/pan-logo.png?1568674599"
    },
    {
      "name": "GitCoin",
      "address": "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
      "symbol": "GTC",
      "decimals": 18,
      "chainId": 1,
      "logoURI": "https://assets.coingecko.com/coins/images/15810/small/gitcoin.png?1621992929"
    },
    {
      "name": "DeepWork",
      "address": "0xf15401e41b3c2f84a7dc8d90ba5889cbeb4475a3",
      "symbol": "DEEP",
      "decimals": 18,
      "chainId": 1,
      "logoURI": "https://deepwork.studio/wp-content/uploads/2020/07/deep-work-logo.svg"
    },
    {
      "name": "DAOMoon",
      "address": "0xf15401e41b3c2f84a7dc8d90ba5889cbeb4475a3",
      "symbol": "dMOON",
      "decimals": 18,
      "chainId": 1,
      "logoURI": "https://deepwork.studio/wp-content/uploads/2020/07/deep-work-logo.svg"
    }
  ]


  daoTokensList = (
    <Box mt={4} >
      <Heading as="h3" size="md" variant="brand">Your tokens</Heading>
      <OrderedList sx={{
        listStyle: "none",
        ml: 0,
        "li": {
          d: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "gray.500",
          fontSize: "14px",
          py: 4,
          px: 3,
          ml: 0,
          "&:first-of-type": {
            fontSize: "18px"
          }
        }
      }}>
        <ListItem>
          <Box maxW="50px" flex="0" mr="15px" fontSize="25px" >🌖</Box>
          <Box as="span" flex="1">{"dMOON"}</Box>
          <Box as="span" flex="0">300</Box>
        </ListItem>
        {daoTokens && daoTokens.map((token, i) => (
          token.symbol !== "dMOON" && (
            <ListItem key={i}>
              <Image src={token.logoURI} alt={token.name} maxW="30px" flex="0" mr="15px" />
              <Box as="span" flex="1">{token.symbol}</Box>
              <Box as="span" flex="0">300</Box>
            </ListItem>
          )
        ))}
      </OrderedList>
    </Box>
  );


  userStats = (
    <Box>
      <Box d="flex" flexFlow="row nowrap" alignItems="flex-start" justifyContent="space-between" sx={{
        "span, div": { color: "gray.200" }, ".ant-statistic-content-suffix": {
          fontSize: "14px"
        }, py: 5
      }}>
        <Box>
          <Statistic title={"Staked"} value={6000} suffix={showUsdPrice ? "USD" : "ETH"} valueStyle={{
            color: "gray.200"
          }} />
        </Box>
        <Box>
          <Statistic title={"Token balances"} value={"15,000"} suffix={"USD"} valueStyle={{
            color: "gray.200"
          }} />
        </Box>
        <Box>
          <Statistic title={"TVL"} value={"1.7million"} suffix={"USD"} valueStyle={{
            color: "gray.200"
          }} />
        </Box>
      </Box>
    </Box>
  )
  yieldInfo = (
    <Box mt={8}>
      <Heading as="h3" size="md" variant="brand">Your positions</Heading>
      {userStats}
    </Box>
  );

  walletFooter = [
    <Box width="100%" key="display">
      {display}
    </Box>,
    <Button
      key="submit"
      type="primary"
      width="100%"
      pb="10px"
      disabled={!amount || !toAddress || qr}
      loading={false}
      onClick={() => {
        const tx = Transactor(props.provider);

        let value;
        try {
          value = parseEther("" + amount);
        } catch (e) {
          // failed to parseEther, try something else
          value = parseEther("" + parseFloat(amount).toFixed(8));
        }

        tx({
          to: toAddress,
          value,
        });
        setOpen(!open);
        setQr();
      }}
    >
      <SendOutlined /> Send
    </Button>,
    privateKeyButton, receiveButton,
  ];



  return (
    <Box as="span">
      {providerSend}
      <Drawer
        visible={open}
        onClose={() => { setOpen(false) }}
        width={500}
        closable
        onClose={() => {
          setQr();
          setPK();
          setOpen(!open);
        }}
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(7px)",
          transform: "translate3d(0, 0, 0)"
        }}
        headerStyle={{
          color: "black",
          ".antDrawerHeaderNoTitle .antDrawerClose": {
            color: "silver",
          },
        }}
        bodyStyle={{
          position: "relative",
          backgroundColor: "rgba(0, 0, 0, 1)",
          color: "silver",
          padding: 0,
          overflow: "hidden"
        }}
      >
        <Box d="flex" flexFlow="column wrap" alignContent="stretch" h="100vh" overflowX="hidden">
          <HStack backgroundColor="rgba(255,255,255,1)" flex={0} borderBottom="1px solid silver" minH="60px" w="100%" pl="25px">
            {props.address ? <Address value={props.address} ensProvider={props.mainnetProvider} blockExplorer={props.blockExplorer} color="black" /> : "Connecting..."}
            <Balance address={props.address} color="black" provider={props.localProvider} dollarMultiplier={props.price} />
          </HStack>
          <Box d="flex" flexFlow="column wrap" flex={1} h="auto" padding="24px" minW="100%">
            {daoTokensList}
            {yieldInfo}
          </Box>

          <Button onClick={toggleWallet} flex={0} minHeight="50px" mb={0} py="25px">Open wallet</Button>


        </Box>
        <Drawer
          title="dMOON Wallet"
          placement="right"
          closable
          onClose={() => {
            setWalletOpen(false)
            setQr("")
            setPK("")
          }}
          visible={walletOpen}
          getContainer={false}
          width={walletOpen ? 350 : 0}
          transition="all 0.3s"
          style={{ position: 'absolute', right: 0, backgroundColor: "rgba(0,0,0,0.1)", transform: walletOpen && "translate3d(0,0,0)" }}
        >
          <Box d="flex" flexFlow="column wrap">
            {walletFooter && walletFooter.map(item => item)}
            {pk && pkDisplay}
            {pk && pkPrivateKeyButton}

            {qr && qrDisplay}
            {qr && qrReceiveButton}
          </Box>
        </Drawer>
      </Drawer>
    </Box>
  );
}
