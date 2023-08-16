import React, { useEffect, useRef, useState } from 'react';
import Header from './header'
import Footer from './footer';

import OrderList from './OrderList';
import PlaceOrder from './PlaceOrder';
import { ScryptProvider, SensiletSigner, Scrypt, ContractCalledEvent, MethodCallOptions, hash160 } from 'scrypt-ts';
import { Asset, TradingPlatformApp } from './contracts/trading';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import './App.css';

const dummyStocks = [
  { ticker: "AAPL", open: 150, close: 155, volume: 1000000, logo: "/apple-logos.png" },
  { ticker: "MSFT", open: 280, close: 285, volume: 980000, logo: "/microsoft-logos.png" },
  { ticker: "AMZN", open: 2700, close: 2750, volume: 1200000, logo: "/amazon-logos.png" },
  { ticker: "NVDA", open: 280, close: 285, volume: 980000, logo: "/nvidia-logos.png" },
  { ticker: "TSLA", open: 280, close: 285, volume: 980000, logo: "/tesla-logos.png" },
  { ticker: "GOOGL", open: 280, close: 285, volume: 980000, logo: "/google-logos.png" },
  { ticker: "BRK.B", open: 280, close: 285, volume: 980000, logo: "/berkshire-logos.png" },
  { ticker: "UNH", open: 280, close: 285, volume: 980000, logo: "/unitedhealth-logos.png" },
  { ticker: "LVMH", open: 280, close: 285, volume: 980000, logo: "/LVMH-logos.png" }
];

const contract_id = {
  txId: "7e4f244d1a75153a9c516a617f09444b24a80f18637b94ff5e73be757800d54f",
  outputIndex: 0,
};

const App: React.FC = () => {
  const signerRef = useRef<SensiletSigner>();
  const [contractInstance, setContract] = useState<TradingPlatformApp>();

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
        .placeOrder(order, BigInt(orderIdx), {
          next: {
            instance: nextInstance,
            balance: contractInstance.balance,
          },
        })
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
            <div className="stocks-section">
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

            <div className="right-section">
                <PlaceOrder onPlace={handlePlaceOrder} stockTickers={dummyStocks.map(stock => stock.ticker)} />
            </div>
        </div>

        <OrderList orders={contractInstance ? contractInstance.orderBook as Asset[] : []} onMatch={handleMatchOrders} />

        <Footer />
    </div>
);

  
}

export default App;