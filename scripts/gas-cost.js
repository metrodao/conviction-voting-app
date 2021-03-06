// Fetches the gas cost of all transactions occurried in a contract from a specific block (including failed transactions)
// Usage: npx truffle exec script/gas-cost.js --network <network> [--proxy <proxy-addr>] [--from-block <block>] [--to-block <block>] [--expanded true]

/* global web3  */
const PROXY_ARG = '--proxy'
const FROM_BLOCK_ARG = '--from-block'
const TO_BLOCK_ARG = '--to-block'
const EXPANDED_ARG = '--expanded'

const DEFAULT_PROXY = '0xe00b7b05c163e96923dfba4189c03b075a7d2849' // Conviction Voting Pilot
const DEFAULT_INIT_BLOCK = 10736632 // Conviction Voting Pilot

const argValue = (arg, defaultValue) =>
  process.argv.includes(arg)
    ? process.argv[process.argv.indexOf(arg) + 1]
    : defaultValue

module.exports = async callback => {
  web3.eth.getBlockNumber().then(currentBlock => {
    const proxy = argValue(PROXY_ARG, DEFAULT_PROXY)
    const fromBlock = argValue(FROM_BLOCK_ARG, DEFAULT_INIT_BLOCK)
    const toBlock = argValue(TO_BLOCK_ARG, currentBlock)
    const expanded = argValue(EXPANDED_ARG, false)

    web3.eth
      .getPastLogs({
        fromBlock,
        toBlock,
        address: proxy,
      })
      .then(transactions => {
        console.log(`> Processing ${transactions.length} transactionsâ€¦`)
        return Promise.all(
          transactions.map(({ transactionHash }) =>
            Promise.all([
              web3.eth.getTransaction(transactionHash),
              web3.eth.getTransactionReceipt(transactionHash),
            ]).then(([{ hash, from, gasPrice }, { gasUsed }]) => ({
              hash,
              from,
              gasPrice,
              gasUsed,
            }))
          )
        )
      })
      .then(transactions => {
        console.log(
          `> Gas spent from block ${fromBlock} to ${toBlock} (in wei):`
        )
        if (expanded) {
          console.log(
            transactions
              .map(
                ({ hash, from, gasUsed, gasPrice }) =>
                  `${hash}\t${from}\t${parseInt(gasUsed, 16) * gasPrice}`
              )
              .join('\n')
          )
        } else {
          console.log(
            Object.entries(
              transactions.reduce(
                (dict, { from, gasUsed, gasPrice }) => ({
                  ...dict,
                  [from]: (dict[from] || 0) + parseInt(gasUsed, 16) * gasPrice,
                }),
                {}
              )
            )
              .map(([from, fee]) => `${from}\t${fee}`)
              .join('\n')
          )
        }
        callback()
      })
  })
}
