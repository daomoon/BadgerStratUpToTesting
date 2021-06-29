## Ideally, they have one file with the settings for the strat and deployment
## This file would allow them to configure so they can test, deploy and interact with the strategy

BADGER_DEV_MULTISIG = "0x910e0adAb9591487bE7679FCC323E2C839D1b58B"

WANT = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" ## wBTC
LP_COMPONENT = "0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656" ## awBTC
REWARD_TOKEN = "0x4da27a545c0c5b758a6ba100e3a049001de870f5" ## stkAave

PROTECTED_TOKENS = [WANT, LP_COMPONENT, REWARD_TOKEN]
## Fees in Basis Points
DEFAULT_GOV_PERFORMANCE_FEE = 1000
DEFAULT_PERFORMANCE_FEE = 1000
DEFAULT_WITHDRAWAL_FEE = 75

FEES = [DEFAULT_GOV_PERFORMANCE_FEE, DEFAULT_PERFORMANCE_FEE, DEFAULT_WITHDRAWAL_FEE]