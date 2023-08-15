// Import necessary modules and functions from the 'scrypt-ts' library.
import {
    method,
    prop,
    SmartContract,
    assert,
    ByteString,
    FixedArray,
    toByteString,
    fill,
    PubKeyHash,
    Utils,
    hash256,
    MethodCallOptions,
    ContractTransaction,
    bsv,
    StatefulNext
} from 'scrypt-ts'

// Define the structure of an Asset. This represents an order in the trading platform.
export type Asset = {
    ticker: ByteString      // The ticker symbol of the asset being traded.
    quantity: bigint        // The quantity of the asset in the order.
    price: bigint           // The price of the asset in satoshis.
    orderType: boolean      // true for buy orders, false for sell orders.
    traderAddr: PubKeyHash  // The blockchain address of the trader placing the order.
    isFilled: boolean       // Indicates if the order has been filled or not.
}


// The main class representing the trading platform smart contract.
export class TradingPlatformApp extends SmartContract {

    // A constant defining the maximum number of orders the trading platform can hold.
    static readonly ORDER_SLOTS = 100

    // An array to hold the orders. It's a fixed-size array, ensuring a consistent storage structure.
    @prop(true)
    orderBook: FixedArray<Asset, typeof TradingPlatformApp.ORDER_SLOTS>

    // The constructor initializes the smart contract.
    constructor() {
        super(...arguments)
        // Initially, all slots in the order book are set to empty.
        this.orderBook = fill(
            {
                ticker: toByteString(''),
                quantity: 0n,
                price: 0n,
                orderType: true,  // true for buy
                traderAddr: PubKeyHash(toByteString('0000000000000000000000000000000000000000')),
                isFilled: true
            },
            TradingPlatformApp.ORDER_SLOTS
        ) as FixedArray<Asset, typeof TradingPlatformApp.ORDER_SLOTS>
    }

    // A method to place a new order in the trading platform.
    @method()
    public placeOrder(order: Asset, orderIdx: bigint) {
        // Ensure the chosen slot for the order is empty.
        assert(this.orderBook[Number(orderIdx)].isFilled, 'order slot not empty')
        // Ensure the order has a positive quantity.
        assert(order.quantity > 0n, 'order quantity must be positive')
        // Ensure the order has a positive price.
        assert(order.price > 0n, 'order price must be positive')
        // Place the order in the chosen slot.
        this.orderBook[Number(orderIdx)] = order
        // Ensure the order was placed correctly.
        assert(this.orderBook[Number(orderIdx)].ticker === order.ticker, 'Order placement failed')
    }

    // A method to match a buy order with a sell order.
    @method()
    public matchOrders(buyOrderIdx: bigint, sellOrderIdx: bigint) {
        // Retrieve the buy and sell orders from the specified slots.
        const buyOrder = this.orderBook[Number(buyOrderIdx)]
        const sellOrder = this.orderBook[Number(sellOrderIdx)]

        // Ensure the buy order is of type 'buy'.
        assert(buyOrder.orderType, 'Invalid buy order type')
        // Ensure the sell order is of type 'sell'.
        assert(!sellOrder.orderType, 'Invalid sell order type')
        // Ensure both orders are for the same asset.
        assert(buyOrder.ticker === sellOrder.ticker, 'Asset ticker mismatch')
        // Ensure the buy order price is greater than or equal to the sell order price.
        assert(buyOrder.price >= sellOrder.price, 'Price mismatch')

        // Determine the quantity to be matched.
        const matchedQuantity = (buyOrder.quantity < sellOrder.quantity) ? buyOrder.quantity : sellOrder.quantity
        // Deduct the matched quantity from both orders.
        buyOrder.quantity -= matchedQuantity
        sellOrder.quantity -= matchedQuantity

        // Mark the order as filled if its quantity reaches zero.
        if (buyOrder.quantity === 0n) {
            buyOrder.isFilled = true
        }
        if (sellOrder.quantity === 0n) {
            sellOrder.isFilled = true
        }

        // Construct the blockchain outputs for transferring funds between buyer and seller.
        let outputs = Utils.buildPublicKeyHashOutput(sellOrder.traderAddr, sellOrder.price * matchedQuantity)
        outputs += Utils.buildPublicKeyHashOutput(buyOrder.traderAddr, buyOrder.price * matchedQuantity)
        // Ensure the constructed outputs are valid.
        assert(hash256(outputs) == this.ctx.hashOutputs, 'hashOutputs mismatch')

        // Ensure the orders were matched correctly.
        assert((buyOrder.isFilled || buyOrder.quantity > 0n) && (sellOrder.isFilled || sellOrder.quantity > 0n), 'Order matching failed')
    }

    // A static method to construct a blockchain transaction when two orders are matched.
    static tradeTxBuilder(
        current: TradingPlatformApp,
        options: MethodCallOptions<TradingPlatformApp>,
        buyOrderIdx: bigint,
        sellOrderIdx: bigint
    ): Promise<ContractTransaction> {
        // Retrieve the buy and sell orders from the specified slots.
        const buyOrder = current.orderBook[Number(buyOrderIdx)]
        const sellOrder = current.orderBook[Number(sellOrderIdx)]
        const next = options.next as StatefulNext<TradingPlatformApp>

        // Ensure the buy order is of type 'buy'.
        assert(buyOrder.orderType, 'Invalid buy order type')
        // Ensure the sell order is of type 'sell'.
        assert(!sellOrder.orderType, 'Invalid sell order type')
        // Ensure both orders are for the same asset.
        assert(buyOrder.ticker === sellOrder.ticker, 'Asset ticker mismatch')
        // Ensure the buy order price is greater than or equal to the sell order price.
        assert(buyOrder.price >= sellOrder.price, 'Price mismatch')

        // Determine the quantity to be matched.
        const matchedQuantity = (buyOrder.quantity < sellOrder.quantity) ? buyOrder.quantity : sellOrder.quantity
        const totalCost = matchedQuantity * sellOrder.price

        // Start building the blockchain transaction.
        const unsignedTx: bsv.Transaction = new bsv.Transaction()
            // Add the current state of the contract as an input.
            .addInput(current.buildContractInput(options.fromUTXO))
            // Add the next state of the contract as an output.
            .addOutput(
                new bsv.Transaction.Output({
                    script: next.instance.lockingScript,
                    satoshis: next.balance,
                })
            )
            // Transfer the funds from the buyer to the seller.
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildPublicKeyHashScript(sellOrder.traderAddr)
                    ),
                    satoshis: Number(totalCost),
                })
            )

        // If there's any change left from the transaction, return it to the buyer's address.
        if (options.changeAddress) {
            unsignedTx.change(options.changeAddress)
        }

        // Return the constructed transaction.
        return Promise.resolve({
            tx: unsignedTx,
            atInputIndex: 0,
            nexts: [
                {
                    instance: next.instance,
                    atOutputIndex: 0,
                    balance: next.balance,
                },
            ],
        })
    }
}
