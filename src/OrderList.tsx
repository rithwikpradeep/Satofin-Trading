import React, { useState } from 'react';
import { Asset } from './contracts/trading';
import './OrderList.css';


type OrderListProps = {
  orders: Asset[];
  onMatch: (buyOrderIdx: bigint, sellOrderIdx: bigint) => void;
};

const OrderList: React.FC<OrderListProps> = ({ orders, onMatch }) => {
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('none');

  const filteredOrders = orders.filter(order => {
    if (filter === 'buy') return order.orderType;
    if (filter === 'sell') return !order.orderType;
    return true;
  }); 

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sort === 'asc') return Number(a.price) - Number(b.price);
    if (sort === 'desc') return Number(b.price) - Number(a.price);
    return 0;
  });

  return (
    <div className="order-list">
      <h2>Order Book</h2>
      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Orders</option>
          <option value="buy">Buy Orders</option>
          <option value="sell">Sell Orders</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="none">Sort by Price (None)</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Quantity</th>
            <th>Price (Satoshis)</th>
            <th>Type</th>
            <th>Trader Address</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order, idx) => (
            <tr key={idx}>
              <td>{order.ticker.toString()}</td>
              <td>{order.quantity.toString()}</td>
              <td>{order.price.toString()}</td>
              <td>{order.orderType ? 'Buy' : 'Sell'}</td>
              <td>{order.traderAddr.toString()}</td>
              <td>{order.isFilled ? 'Filled' : 'Open'}</td>
              <td>
                {order.orderType ? (
                  <button onClick={() => onMatch(BigInt(idx), BigInt(-1))}>Match Sell</button>
                ) : (
                  <button onClick={() => onMatch(BigInt(-1), BigInt(idx))}>Match Buy</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
