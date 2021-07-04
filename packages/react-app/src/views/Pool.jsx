/* eslint-disable jsx-a11y/accessible-emoji */

import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { formatEther } from "@ethersproject/units";
import { Address, AddressInput } from "../components";


export default function Pool({ yourLocalBalance, mainnetProvider, price, address }) {

  return (
    <Box>
      <Heading as="h2">dMoon Pools (coming soon)</Heading>
    </Box>
  );
}
