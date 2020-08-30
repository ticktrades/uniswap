import React, { useEffect, useState } from 'react'
import './App.css';
import { gql, ApolloClient, InMemoryCache, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
  cache: new InMemoryCache()
});

const TokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedETH
    tradeVolume
    tradeVolumeUSD
    totalLiquidity
    txCount
  }
`
const TOKENS_CURRENT = gql`
  ${TokenFields}
  query tokens {
    tokens(first: 25, orderBy: tradeVolumeUSD, orderDirection: desc) {
      ...TokenFields
    }
  }
`
export const TOKEN_DATA = (tokenAddress, block) => {
  const queryString = `
    ${TokenFields}
    query tokens {
      tokens(${block ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `
  return gql(queryString)
}

const PAIRS_DATA_QUERY = gql`
  query pairs {
    pairs(first: 25, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      txCount
      token0 {
        id
        symbol
        name
        totalLiquidity
        derivedETH
      }
      token1 {
        id
        symbol
        name
        totalLiquidity
        derivedETH
      }
      reserve0
      reserve1
      reserveUSD
      totalSupply
      trackedReserveETH
      reserveETH
      volumeUSD
      token0Price
      token1Price
      createdAtTimestamp
    }
  }
`
const ETH_PRICE_QUERY = gql`
  query bundles {
    bundles(where: { id: "1" }) {
      ethPrice
    }
  }
`

function App() {
  const { loading: ethLoading, data: ethPriceData } = useQuery(ETH_PRICE_QUERY);
  const { loading: PAIRS_DATA_LOADING, data: PAIRS_DATA } = useQuery(PAIRS_DATA_QUERY);

  const { loading: TOKENS_DATA_LOADING, data: TOKENS_DATA } = useQuery(TOKENS_CURRENT);
  const ethPriceInUSD = ethPriceData && ethPriceData.bundles[0].ethPrice

  const [selectedCoin, selectCoin] = useState('');
  const [selectedCoinData, setCoinData] = useState('');
  const [selectedPair, selectPair] = useState('');
  const [selectedPairData, setPairData] = useState('');

  useEffect(() => {
    async function fetchData() {
      // You can await here
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCoin?.id}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true`,
      );

      const cointData = await response.json()
      setCoinData(cointData);
    }
    if (selectedCoin?.id === 'open') {
      fetchData();
    }
  }, [selectedCoin]);

  useEffect(() => {
    async function fetchData() {
      // You can await here
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${selectedPair}&startblock=0&endblock=999999999&sort=desc&apikey=2K3GHRIFVIZX3V99C573V9B935UPVAHM7C`,
      );

      const pairData = await response.json()
      setPairData(pairData?.result?.slice(0, 10));
    }
    console.log(selectedPair)
    if (selectedPair) {
      fetchData();
    }
  }, [selectedPair]);

  return (
    <React.Fragment>
      <main className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
        <section className="coin-price">
          <h2>Top coins</h2>
          {TOKENS_DATA_LOADING ? 'Loading token data...' : TOKENS_DATA.tokens.map(token => (
            <div key={`${token.symbol}-${token.id}`}>
              <button onClick={() => {
                selectCoin(token);
                selectPair('0xc5be99a02c6857f9eac67bbce58df5572498f40c');
              }}>{token.symbol}: </button><span className="number">{(parseFloat(token.derivedETH) * parseFloat(ethPriceInUSD)).toFixed(2)}</span></div>
          ))}
        </section>
        <section>
          <article>
            {selectedCoin.id}<br />
            {selectedCoin.name}<br />
            {selectedCoin.symbol}<br />
            {selectedCoin.totalLiquidity}
          </article>
          <h2>Trades</h2>
          <article>
            {selectedPairData && selectedPairData?.map(pair => {
              return (
                <div key={`${pair.contractAddress}`}>
                  <div>${pair.tokenName}</div>
                  <div className={`number ${pair.to === selectedPair ? 'red' : 'green'}`}>${parseFloat(pair.value).toFixed(2)}</div>
                  {/* <div className={`${pair.to === selectedPair ? 'red' : 'green'}`}>${pair.to === selectedPair ? 'Sell' : 'Buy'}</div> */}
                </div>
              )
            })}
          </article>
        </section>
        <section>
          <h2>Tweets</h2>
        </section>
      </main>
      <div className="price">
        {/* {TOKENS_DATA_LOADING ? 'Loading token data...' : JSON.stringify(TOKENS_DATA)} */}
        <h1>Pairs Data</h1>

        {/* {PAIRS_DATA_LOADING ? 'Loading token data...' : JSON.stringify(PAIRS_DATA)} */}

        {PAIRS_DATA?.pairs.slice(0, 25)?.map(pair => (
          <React.Fragment key={`${pair.id}`}>
            <br /><br /><br />
            <p>
              ID: {pair.id}<br />
              Pair: {pair.token0.symbol} X {pair.token1.symbol}
            </p>
            <table className="table-auto">
              <thead>
                <tr>
                  <th />
                  <th>Token 0: </th>
                  <th>Token 1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ID</td>
                  <td>{pair.token0.id}</td>
                  <td>{pair.token1.id}</td>
                </tr>
                <tr>
                  <td>Symbol</td>
                  <td>{pair.token0.symbol}</td>
                  <td>{pair.token1.symbol}</td>
                </tr>
                <tr>
                  <td>Name</td>
                  <td>{pair.token0.name}</td>
                  <td>{pair.token1.name}</td>
                </tr>
                <tr>
                  <td>Price</td>
                  <td>{(parseFloat(pair.token0.derivedETH) * parseFloat(ethPriceInUSD)).toFixed(2)}</td>
                  <td>{(parseFloat(pair.token0.derivedETH) * parseFloat(ethPriceInUSD)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </React.Fragment>
        ))}
        {/* <div>
        <h2>LINK</h2>
        {ethLoading || LINKLoading
          ? 'Loading token data...'
          : '$' +
          // parse responses as floats and fix to 2 decimals
          (parseFloat(LINKPriceInEth) * parseFloat(ethPriceInUSD)).toFixed(2)}
      </div> */}

        {/* <div>
        Dai total liquidity:{' '}
        {daiLoading
          ? 'Loading token data...'
          : // display the total amount of DAI spread across all pools
            parseFloat(daiTotalLiquidity).toFixed(0)}
      </div> */}
      </div>
    </React.Fragment>
  )
}

export { client }
export default App