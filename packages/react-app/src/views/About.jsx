/* eslint-disable jsx-a11y/accessible-emoji */

import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { formatEther } from "@ethersproject/units";
import { Address, AddressInput } from "../components";


export default function About({ yourLocalBalance, mainnetProvider, price, address }) {

  return (
    <Box maxW="33%" sx={{
      textAlign: "center",
      "p": {
        textAlign: "left"
      }
    }}>
      <Heading as="h1" size="2xl">About DAOMoon</Heading>

      <Heading as="h3">Mission</Heading>
      <Text>Codename DAOMoon ($dMoon) is a DAO2DAO project designed to establish long-term “unstoppable liquidity for unstoppable organizations”. It is specifically designed to support the alliance of DAOs in the Metacartel and DaoHaus Ecosystems or DAOs that directly support the creative commons.</Text>

      <Heading as="h3" size="xl">Problem</Heading>
      <Text>One problem with experimentation and research based DAOs: it’s difficult to create deep and long term liquidity. Since many DAOs are designed to reward ownership through sweat equity; and are not for transient “moon boys”, it’s very hard for a DAO to justify token emissions as liquidity provider incentives. This becomes even more difficult for projects that purely support creative commons.</Text>

      <Heading as="h3" size="xl">Solutions</Heading>
      <Text>A liquidity machine powered by a novel token contract (Reflect.sol), arbitrage, Balancer_v2 smart pools and BadgerDAO want yield strategies.</Text>
      <Text>The Reflect token contract has a native “tax” function inbuilt that is called along with any transfer functions. Each time a transfer is made, there’s a 1% (default) tax which is redistributed to all other token holders. It can also exclude addresses from eligibility to earn this tax. The tax also doesn’t require a transaction to claim, as it’s built directly into the token’s transfer override. It produces real time compounding yield.</Text>
      <Text>This functionality, when coupled with a static treasury, allows us to retain some of the liquidity that passes through the platform. This liquidity will be provided and locked into the protocol by the treasury.</Text>

      <Heading as="h3" size="xl">Tokenomics</Heading>
      <Text>DAOMoon retains 50% of the total supply in it’s treasury. This is designed to be principle, and enables the DAOMoon treasury to retain half of the Reflect function fees. It also means that there’s constant funding for the treasury; the majority of that yield will be locked into two excluded liquidity pools: dMoon/DAI and dMoon/wETH. We’ve now exposed a natural arbitrage. Whenever the price of ETH fluctuates, there’s an incentive to balance the pools. This will naturally generate volume over time.</Text>
      <Text>25% of the token is traded over the counter for DAO tokens from the set below. We now create a scenario where the dMoon token is scarce; and the only way to buy it on the open market is through a basket of our partner DAO tokens. Each partner DAO pairs their own token with dMoon 50/50. The DAO tokens received by dMoon are provided as liquidity to a Balancer smart pool. These LP tokens ($ZORD) now acts as an automatically rebalancing index basket of the underlying token set.</Text>
      <Text>Because our treasury vault owns more of the supply than any other individual party - we can execute optimal arbitrage swaps through Badger yield want strategies. Other actors will require larger margins to swap successfully and profit.</Text>
    </Box>
  );
}
