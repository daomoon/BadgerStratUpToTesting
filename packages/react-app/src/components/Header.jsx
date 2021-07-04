import React from "react";
import { PageHeader } from "antd";

export default function Header() {
  return (
    <a href="https://github.com/austintgriffith/scaffold-eth/tree/uniswapper" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="🌓 DAOMoon"
        subTitle="unstoppable liquidity for unstoppable organizations"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
