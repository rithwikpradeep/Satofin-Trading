import React, { useState, useRef } from 'react';
import { Button, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar } from '@mui/material';
import { Asset } from './contracts/trading';
import { PubKeyHash, SensiletSigner, hash160, toByteString } from 'scrypt-ts';
import './PlaceOrder.css';


const stockTickers = ["AAPL", "MSFT", "AMZN", "NVDA", "TSLA", "GOOGL", "BRK.B", "UNH", "LVMH"];

interface PlaceOrderProps {
    onPlace: (order: Asset) => void;
    signerRef: React.MutableRefObject<SensiletSigner>
    stockTickers: string[];
}


const PlaceOrder: React.FC<PlaceOrderProps> = ({ onPlace, signerRef }) => {
    const [ticker, setTicker] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [orderType, setOrderType] = useState<boolean | null>(null); // true for buy, false for sell
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!ticker.trim()) {
            setErrorMessage('Ticker cannot be empty.');
            return;
        }

        if (quantity <= 0) {
            setErrorMessage('Quantity must be a positive number.');
            return;
        }

        if (price <= 0) {
            setErrorMessage('Price must be a positive number.');
            return;
        }

        if (orderType === null) {
            setErrorMessage('Please select an order type.');
            return;
        }

        const defaultPubKey = await signerRef.current.getDefaultPubKey()
        const traderAddr = hash160(defaultPubKey.toHex())
        const order: Asset = {
            ticker: toByteString(ticker, true),
            quantity: BigInt(quantity),
            price: BigInt(price * 100 * 10 ** 6), // Convert to satoshis
            orderType: orderType,
            traderAddr: traderAddr,
            isFilled: false
        };
        onPlace(order);
    };

    return (
        <div className="place-order-container">
            <h2>Place Order</h2>
            <FormControl variant="outlined" fullWidth margin="normal">
                <InputLabel id="ticker-label">Ticker</InputLabel>
                <Select
                    labelId="ticker-label"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value as string)}
                    label="Ticker"
                >
                    {stockTickers.map((tickerOption) => (
                        <MenuItem key={tickerOption} value={tickerOption}>
                            {tickerOption}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Quantity"
                variant="outlined"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                margin="normal"
                fullWidth
            />
            <TextField
                label="Price (in BSV)"
                variant="outlined"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                margin="normal"
                fullWidth
            />
            <FormControl variant="outlined" fullWidth margin="normal">
                <InputLabel id="order-type-label">Order Type</InputLabel>
                <Select
                    labelId="order-type-label"
                    value={orderType !== null ? (orderType ? 'buy' : 'sell') : ''}
                    onChange={(e) => setOrderType(e.target.value === 'buy')}
                    label="Order Type"
                >
                    <MenuItem value={'buy'}>Buy</MenuItem>
                    <MenuItem value={'sell'}>Sell</MenuItem>
                </Select>
            </FormControl>

            <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
                Place Order
            </Button>
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={() => setErrorMessage(null)}
                message={errorMessage}
            />
        </div>
    );
};

export default PlaceOrder;