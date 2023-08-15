// Importing the 'writeFileSync' function from the 'fs' module to write data to a file.
import { writeFileSync } from 'fs'

// Importing the 'TradingPlatformApp' contract from the specified path.
import { TradingPlatformApp } from '../src/contracts/trading'

// Importing the 'privateKey' which is presumably used for signing transactions.
import { privateKey } from './privateKey'

// Importing necessary modules and functions from 'scrypt-ts' for blockchain operations.
import { bsv, TestWallet, DefaultProvider, sha256 } from 'scrypt-ts'

// Function to compute the script hash from a given script's hexadecimal representation.
function getScriptHash(scriptPubKeyHex: string) {
    const res = sha256(scriptPubKeyHex).match(/.{2}/g)
    if(!res) {
        throw new Error('scriptPubKeyHex is not of even length')
    }
    return res.reverse().join('')
}

// The main function where the contract deployment logic resides.
async function main() {
    // Compiling the 'TradingPlatformApp' contract to ensure it's ready for deployment.
    await TradingPlatformApp.compile()
    
    // Preparing a signer using the imported private key.
    const signer = new TestWallet(privateKey, new DefaultProvider({
        network: bsv.Networks.testnet
    }))

    const amount = 1

    // Creating a new instance of the 'TradingPlatformApp' contract.
    const instance = new TradingPlatformApp()

    // Connecting the contract instance to the signer.
    await instance.connect(signer)
    
    // Deploying the contract to the blockchain with the specified amount.
    const deployTx = await instance.deploy(amount)

    // Computing the script hash of the deployed contract.
    const scriptHash = getScriptHash(instance.lockingScript.toHex())
    
    // Saving the script hash to a file for future reference.
    const shFile = `.scriptHash`;
    writeFileSync(shFile, scriptHash);

    // Logging the success message and details of the deployed contract.
    console.log('TradingPlatformApp contract was successfully deployed!')
    console.log(`TXID: ${deployTx.id}`)
    console.log(`scriptHash: ${scriptHash}`)
}

// Invoking the main function to execute the contract deployment.
main()
