/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { formatEther } from "@ethersproject/units";
import { Row, Col, Button, Menu, Input, Typography, Modal, Space } from "antd";
import { Swap, Address, AddressInput } from "../components";
import { useUserProvider } from "../hooks";

export default function Home(injectedProvider, localProvider) {
  const [tokenListURI, setTokenListURI] = useState('https://gateway.ipfs.io/ipns/tokens.uniswap.org')
  const userProvider = useUserProvider(injectedProvider, localProvider);

  return (
    <Row justify="center">
      <Swap
        selectedProvider={userProvider}
        tokenListURI={tokenListURI}
      />
    </Row>
  );
}
