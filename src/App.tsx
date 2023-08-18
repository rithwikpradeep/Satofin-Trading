import React, { useEffect, useRef, useState } from 'react';
import Header from './header';
import Footer from './footer';

import OrderList from './OrderList';
import PlaceOrder from './PlaceOrder';
import { ScryptProvider, SensiletSigner, Scrypt, ContractCalledEvent, MethodCallOptions, hash160 } from 'scrypt-ts';
import { Asset, TradingPlatformApp } from './contracts/trading';
import './App.css';

const dummyStocks = [
  { ticker: "AAPL", open: 150, close: 155, volume: 1000000, logo: "/apple-logo.png" },
  { ticker: "MSFT", open: 280, close: 285, volume: 980000, logo: "/microsoft-logo.png" },
  { ticker: "GOOGL", open: 2700, close: 2750, volume: 1200000, logo: "/google-logo.png" }
];

const dummyBonds = [
  { ticker: "US Treasury Bond", open: 100, close: 105, volume: 500000, logo: "/us-bond1-logo.png" },
  { ticker: "Municipal Bond", open: 110, close: 115, volume: 450000, logo: "/us-bond2-logo.png" },
  { ticker: "Corporate Bond", open: 120, close: 125, volume: 550000, logo: "/us-bond3-logo.png" }
];

const dummyCommodities = [
  { ticker: "GOLD", open: 1800, close: 1850, volume: 600000, logo: "/gold-logo.png" },
  { ticker: "OIL", open: 70, close: 75, volume: 650000, logo: "/oil-logo.png" },
  { ticker: "SILVER", open: 25, close: 30, volume: 620000, logo: "/silver-logo.png" }
];
const dummyCryptos = [
  { ticker: "BTC", open: 50000, close: 51000, volume: 20000, logo: "/bitcoin-logo.png" },
  { ticker: "ETH", open: 3000, close: 3100, volume: 15000, logo: "/ethereum-logo.png" },
  { ticker: "BSV", open: 200, close: 210, volume: 8000, logo: "/bsv-logo.png" }
];

const contract_id = {
  txId: "b83d647f1de647c9eb2a1f020dabb55994bc8835c7b57713920292452a3db723",
  outputIndex: 0,
};

const App: React.FC = () => {
  const signerRef = useRef<SensiletSigner>();
  const [contractInstance, setContract] = useState<TradingPlatformApp>();
  const [activeCategory, setActiveCategory] = useState<'stocks' | 'bonds' | 'commodities' | 'cryptos'>('stocks');

  useEffect(() => {
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);
    signerRef.current = signer;

    fetchContract();

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: TradingPlatformApp,
        id: contract_id,
      },
      (event: ContractCalledEvent<TradingPlatformApp>) => {
        setContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchContract() {
    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        TradingPlatformApp,
        contract_id
      );
      console.log(instance)
      setContract(instance);
    } catch (error: any) {
      console.error("fetchContract error: ", error);
    }
  }

  const handlePlaceOrder = async (order: Asset) => {
    const signer = signerRef.current as SensiletSigner;
    const traderAddr = hash160((await signer.getDefaultPubKey()).toString());
    order.traderAddr = traderAddr;

    if (contractInstance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await contractInstance.connect(signer);
      const nextInstance = contractInstance.next();

      let orderIdx = contractInstance.orderBook.findIndex(o => o.isFilled === true);
      if (orderIdx === -1) {
        console.error('All order slots are filled.');
        return;
      }

      nextInstance.orderBook[orderIdx] = order;

      contractInstance.methods
        .placeOrder(
          order,
          BigInt(orderIdx),
          {
            next: {
              instance: nextInstance,
              balance: contractInstance.balance,
            },
          } as MethodCallOptions<TradingPlatformApp>)
        .then((result) => {
          console.log(`Place order tx: ${result.tx.id}`);
        })
        .catch((e) => {
          console.error("Place order error: ", e);
        });
    }
  };

  const handleMatchOrders = async (buyOrderIdx: bigint, sellOrderIdx: bigint) => {
    const signer = signerRef.current as SensiletSigner;

    if (contractInstance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await contractInstance.connect(signer);
      const nextInstance = contractInstance.next();

      contractInstance.methods
        .matchOrders(buyOrderIdx, sellOrderIdx, {
          next: {
            instance: nextInstance,
            balance: contractInstance.balance,
          },
        })
        .then((result) => {
          console.log(`Match orders tx: ${result.tx.id}`);
        })
        .catch((e) => {
          console.error("Match orders error: ", e);
        });
    }
  };


  return (
    <div className="app-container">
        <Header />

        <div className="main-content">
            <div className="category-buttons">
                <button onClick={() => setActiveCategory('stocks')}>Stocks</button>
                <button onClick={() => setActiveCategory('bonds')}>Bonds</button>
                <button onClick={() => setActiveCategory('commodities')}>Commodities</button>
                <button onClick={() => setActiveCategory('cryptos')}>Cryptocurrency</button>

            </div>

            {activeCategory === 'stocks' && (
                <div className="stocks-section">
                    <h2>Top Traded Stocks</h2>
                    <div className="stocks-container">
                        {dummyStocks.map((stock, index) => (
                            <div key={index} className="stock-card">
                                <img src={stock.logo} alt={`${stock.ticker} Logo`} />
                                <div>Ticker: {stock.ticker}</div>
                                <div>Open: {stock.open}</div>
                                <div>Close: {stock.close}</div>
                                <div>Volume: {stock.volume}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeCategory === 'bonds' && (
                <div className="bonds-section">
                    <h2>Top Traded Bonds</h2>
                    <div className="stocks-container">
                        {dummyBonds.map((bond, index) => (
                            <div key={index} className="stock-card">
                                <img src={bond.logo} alt={`${bond.ticker} Logo`} />
                                <div>Ticker: {bond.ticker}</div>
                                <div>Open: {bond.open}</div>
                                <div>Close: {bond.close}</div>
                                <div>Volume: {bond.volume}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeCategory === 'commodities' && (
                <div className="commodities-section">
                    <h2>Top Traded Commodities</h2>
                    <div className="stocks-container">
                        {dummyCommodities.map((commodity, index) => (
                            <div key={index} className="stock-card">
                                <img src={commodity.logo} alt={`${commodity.ticker} Logo`} />
                                <div>Ticker: {commodity.ticker}</div>
                                <div>Open: {commodity.open}</div>
                                <div>Close: {commodity.close}</div>
                                <div>Volume: {commodity.volume}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
              {activeCategory === 'cryptos' && (
              <div className="cryptos-section">
               <h2>Top Traded Cryptocurrencies</h2>
               <div className="stocks-container">
                {dummyCryptos.map((crypto, index) => (
                <div key={index} className="stock-card">
                    <img src={crypto.logo} alt={`${crypto.ticker} Logo`} />
                    <div>Ticker: {crypto.ticker}</div>
                    <div>Open: {crypto.open}</div>
                    <div>Close: {crypto.close}</div>
                    <div>Volume: {crypto.volume}</div>
                </div>
            ))}
        </div>
    </div>
)}

<div className="thick-line"></div>


            <div className="right-section">
            <PlaceOrder onPlace={handlePlaceOrder} signerRef={signerRef} stockTickers={[...dummyStocks, ...dummyBonds, ...dummyCommodities, ...dummyCryptos].map(item => item.ticker)} />
            </div>
        </div>

        <OrderList orders={contractInstance ? contractInstance.orderBook as Asset[] : []} onMatch={handleMatchOrders} />

        <Footer />
    </div>
  );
}

export default App;