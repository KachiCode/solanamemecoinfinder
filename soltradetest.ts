import { Connection, PublicKey } from "@solana/web3.js";
import {
  LiquidityPoolKeys,
  Liquidity,
  SPL_ACCOUNT_LAYOUT,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
} from "@raydium-io/raydium-sdk";
import "dotenv/config";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  unpackMint,
} from "@solana/spl-token";
import fetch from "node-fetch";
import { Metaplex } from "@metaplex-foundation/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

// (async () => {
//     const solana = new Connection("https://docs-demo.solana-mainnet.quiknode.pro/");
//     console.log(
//       await solana.getTransaction(
//         "D13jTJYXoQBcRY9AfT5xRtsew7ENgCkNs6mwwwAcUCp4ZZCEM7YwZ7en4tVsoDa7Gu75Jjj2FgLXNUz8Zmgedff",
//         { maxSupportedTransactionVersion: 0,
//            commitment: 'confirmed'  }
//       )
//     );
//   })();

const HTTP_URL = "";
const WSS_URL = "";

const keypair = getKeypairFromEnvironment("private_key");
// Connection to Solana Node
const SESSION_HASH = "QNDEMO" + Math.ceil(Math.random() * 1e9); // Random unique identifier for your session
const connection = new Connection(HTTP_URL, {
  wsEndpoint: WSS_URL,
  httpHeaders: { "x-session-hash": SESSION_HASH },
});
let first_message: string = "https://dexscreener.com/solana/";
let second_message: string =
  "https://twitter.com/search?q=bitcoin&src=typed_query";
// sendMessageToTelegram(first_message + " " + second_message);

fetchSolanaPairData("BE1iUXqtS3cAPtmGardCceSvpyE3CcRur1DNwFxQbt9R");

async function fetchSolanaPairData(pairAddress: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let token_symbol = data.pairs[0].baseToken.symbol.toLowerCase();
    let twitter_search =
      "https://twitter.com/search?q=" + token_symbol + "&src=typed_query";

    console.log(token_symbol);
    console.log(twitter_search);
    return data;
  } catch (error) {
    console.error("Error fetching Solana pair data:", error);
    throw error;
  }
}

async function sendMessageToTelegram(message: string): Promise<void> {
  const TOKEN = "";
  const chat_id = "";
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(
    message
  )}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

async function checkMetadata(input_token: string) {
  const metaplex = Metaplex.make(connection);
  const metadataPda = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: new PublicKey(input_token) });
  const account = await Metadata.fromAccountAddress(connection, metadataPda);

  let data_uri = account.data.uri;
  const extractedUrl = data_uri.match(/https?:\/\/[^\s]+/)[0];
  // Assuming you want to do something with 'account' afterwards
  try {
    const response = await fetch(extractedUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const jsonData = await response.json();
    console.log(jsonData);

    if (jsonData.hasOwnProperty("description")) {
      let description = jsonData.description.toLowerCase();

      if (
        description.includes("https://twitter.com") &&
        description.includes("https://t.me")
      ) {
        console.log("Found socials in description");
        return true;
      }

      console.log(description);
      return false;
    }

    if (!jsonData.hasOwnProperty("extensions")) {
      console.log("extensions does not exist");
      return false;
    }

    // Check if 'extensions.website' exists
    if (
      !("website" in jsonData.extensions) ||
      !("twitter" in jsonData.extensions) ||
      !("telegram" in jsonData.extensions)
    ) {
      console.log("One or more extensions do not exist");
      return false;
    }

    const { website, twitter, telegram } = jsonData.extensions;
    console.log("All three exist");

    const different_bool = website !== twitter && twitter !== telegram;
    if (!different_bool) {
      return false;
    }

    const website_length = website.length;
    const twitter_length = twitter.length;
    const telegram_length = telegram.length;

    const length_check =
      website_length === 0 || twitter_length === 0 || telegram_length === 0;
    if (length_check) {
      return false;
    }

    console.log(website);
    console.log(twitter);
    console.log(telegram);
    console.log("Different ", different_bool);

    const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?=JSON&domainName=${website}`;
    const whoisResponse = await fetch(whoisUrl);
    if (!whoisResponse.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await whoisResponse.json();
    console.log(data);

    if (!("createdDate" in data.WhoisRecord.registryData)) {
      console.log("No create date");
      return true;
    }

    const dateString = data.WhoisRecord.registryData.createdDate;
    const givenDate = new Date(dateString);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - givenDate.getTime();
    const tenDaysInMilliseconds = 10 * 24 * 60 * 60 * 1000;

    if (timeDifference <= tenDaysInMilliseconds) {
      console.log("The given date is not older than 10 days.");
      return true;
    } else {
      console.log("The given date is older than 10 days.");
      return false;
    }
  } catch (error) {
    console.error("There was a problem with the fetch request:", error);
    return false;
  }
}

// Usage

async function checkMetadata_firstlayer(input_token: string) {
  const metaplex = Metaplex.make(connection);
  const metadataPda = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: new PublicKey(input_token) });
  const account = await Metadata.fromAccountAddress(connection, metadataPda);
  let data_uri = account.data.uri;
  const extractedUrl = data_uri.match(/https?:\/\/[^\s]+/)[0];
  // Assuming you want to do something with 'account' afterwards
  try {
    const response = await fetch(extractedUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const jsonData = await response.json();

    if (jsonData.hasOwnProperty("description")) {
      let description = jsonData.description.toLowerCase();

      if (
        description.includes("https://twitter.com") &&
        description.includes("https://t.me")
      ) {
        console.log("Found socials in description");
        return true;
      }
    }

    if (!jsonData.hasOwnProperty("extensions")) {
      console.log("extensions does not exist");
      return false;
    }

    // Check if 'extensions.website' exists
    if (
      !("website" in jsonData.extensions) ||
      !("twitter" in jsonData.extensions) ||
      !("telegram" in jsonData.extensions)
    ) {
      console.log("One or more extensions do not exist");
      return false;
    }

    const { website, twitter, telegram } = jsonData.extensions;
    console.log("All three exist");

    const different_bool = website !== twitter && twitter !== telegram;
    if (!different_bool) {
      return false;
    }

    const website_length = website.length;
    const twitter_length = twitter.length;
    const telegram_length = telegram.length;

    const length_check =
      website_length === 0 || twitter_length === 0 || telegram_length === 0;
    if (length_check) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("There was a problem with the fetch request:", error);
    return false;
  }
}

async function Mint_test(mint_key: any) {
  let mintkeyPair = new PublicKey(mint_key);
  const info = await connection.getAccountInfo(mintkeyPair, "confirmed");
  const unpackedMint = unpackMint(mintkeyPair, info, TOKEN_PROGRAM_ID);

  return Object.is(unpackedMint.mintAuthority, null);
}

// let mintable = getInfoAndUnpack("3XdHxVCpYZHQ6EbGYNzUQYmtHg2oxQpDc3moxssp88eL").then(mintable => {console.log("The supply is: ",  mintable[1] )}); // Call the async function

async function LargestAccountsCheck(token_mint: any) {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Delay for 10 seconds

  let largest_account_share = [];

  let supply = await connection.getTokenSupply(new PublicKey(token_mint));
  let supply_number = supply.value.uiAmount;

  const info = await connection.getTokenLargestAccounts(
    new PublicKey(token_mint)
  );

  console.log(info);

  for (let i = 0; i < info.value.length; i++) {
    let consider = true;
    if (i === 0 || i === 1) {
      let largestAccountInfo = await connection.getParsedAccountInfo(
        info.value[i].address
      );
      if (
        largestAccountInfo &&
        largestAccountInfo.value &&
        largestAccountInfo.value.data &&
        largestAccountInfo.value.data.parsed &&
        largestAccountInfo.value.data.parsed.info &&
        "owner" in largestAccountInfo.value.data.parsed.info &&
        largestAccountInfo.value.data.parsed.info.owner ===
          "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
      ) {
        consider = false;
      }
    }

    if (consider) {
      largest_account_share.push(info.value[i].uiAmount / supply_number);
    }
  }

  console.log("Share of largest accounts:", largest_account_share);

  return !largest_account_share.some((element) => element > 0.1);
}

// const start = Date.now();
// LargestAccountsCheck("9RxctgEBQY4yhk3AQ8Lp9kJKDX9FZc91QrKHGXSy2DD").then(result => {
//   const end = Date.now();
//   console.log(`Execution time: ${end - start} ms`);
// });

// Constants
// let DOLLAR_PER_SOLANA: number = 100;
// fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
//   .then(response => response.json())
//   .then(data => {
//     // Extracting Solana price in USD from the response
//     DOLLAR_PER_SOLANA = data.solana.usd;

//   })
//   .catch(error => {
//     console.error('Error fetching data:', error);
//   });

// const HTTP_URL = "https://mainnet.helius-rpc.com/?api-key=";
// const WSS_URL = "wss://mainnet.helius-rpc.com/?api-key=";
// const RAYDIUM_PUBLIC_KEY = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
// const TRANSACTION_LOOK_AHEAD_SIZE = 50;
// const raydium = new PublicKey(RAYDIUM_PUBLIC_KEY);

// const keypair = getKeypairFromEnvironment("private_key");
// // Connection to Solana Node
// const SESSION_HASH = 'QNDEMO' + Math.ceil(Math.random() * 1e9); // Random unique identifier for your session
// const connection = new Connection(HTTP_URL, {
//     wsEndpoint: WSS_URL,
//     httpHeaders: {"x-session-hash": SESSION_HASH}
// });

// console.log("USD per SOL: ", DOLLAR_PER_SOLANA);

// sendMessageToTelegram("Hello");

//   analyze_token('DP2QV9nFwehHCXvKRsCn21g1UbVPctfHXSNrQXK24K9D', 60).then((result) => {
//     if (result) {
//       console.log('One minute volume:', result.one_minute_volume);
//       console.log('Prices:', result.prices);
//       console.log('Liquidity:', result.liquidity);
//       // Get the highest number
//       let highest = Math.max(...result.prices);

//       // Get the lowest number
//       let lowest = Math.min(...result.prices);
//       let allGreaterThan1000 = result.one_minute_volume.every(number => number > 1000);
//       let atLeastOneGreaterThan5000 = result.one_minute_volume.some(number => number > 5000);
//       let liquidity_boolean: boolean = result.liquidity > 15000;
//       let price_ratio:boolean = (highest/lowest) > 5;

//     }
//   }).catch((error) => {
//     console.error('Error:', error);
//   });

// //Main Function
// async function analyze_token(token_address: string, time: number) {
//     let one_minute_volume: any[] = [];
//     let prices: any[] = [];
//     let last_seen_volume: number = 0;
//     let amount_of_minutes: number = 3;
//     let liquidity: number = 0;

//     // Define a delay function using a Promise
//     function delay(ms: number): Promise<void> {
//         return new Promise(resolve => setTimeout(resolve, ms));
//     }

//     if(time < 0)
//     {

//         await delay( (time * (-1)) * 1000);

//     }

//     try {

//         await delay(60000);
//         // Run the try block 9 times with a 60-second sleep between each iteration
//         for (let i = 0; i < amount_of_minutes; i++) {
//             const response = await fetch("https://api.dexscreener.com/latest/dex/pairs/solana/" + token_address);

//             if (!response.ok) {
//                 console.error(`Failed to fetch data: ${response.status} ${response.statusText}`);
//                 return null;
//             }

//             const data = await response.json();
//             if (last_seen_volume === 0) {
//                 last_seen_volume = data.pair.volume.h24;
//                 prices.push(data.pair.priceUsd);
//             } else {
//                 one_minute_volume.push(data.pair.volume.h24 - last_seen_volume);
//                 last_seen_volume = data.pair.volume.h24;
//                 prices.push(data.pair.priceUsd);
//             }
//             console.log("Volume: ", last_seen_volume);

//             // If this is not the last iteration, sleep for 60 seconds
//             if (i < amount_of_minutes - 1) {
//                 await delay(60000);
//             }

//             if (i === amount_of_minutes - 1)
//             {

//                 liquidity = data.pair.liquidity.usd;
//             }
//         }

//         return { one_minute_volume, prices, liquidity }; // Return the collected data
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         return null;
//     }

// }

// async function sendMessageToTelegram(message: string): Promise<void> {
//     const TOKEN = "";
//     const chat_id = "";
//     const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(message)}`;

//     try {
//         const response = await fetch(url, { method: 'GET' });
//         const data = await response.json();
//         console.log(data);
//     } catch (error) {
//         console.error('Error sending message to Telegram:', error);
//     }
// }

// async function main(connection: any, programAddress: any) {
//     console.log("Monitoring logs for program:", programAddress.toString());

//     let a:number = 0;
//     let liquidity: number = 0;
//     let inprogress: boolean = false;
//     let temp_hashes: any[] = [];
//     let eligible_transactions: any[] = [];
//     let token_address:string = "";
//     connection.onLogs(
//         programAddress,
//         ({ logs, err, signature }) => {
//             if (err) return;

//             if (inprogress && temp_hashes.length < TRANSACTION_LOOK_AHEAD_SIZE)
//             {

//                 temp_hashes.push(signature);
//             }
//             else if (inprogress && temp_hashes.length === TRANSACTION_LOOK_AHEAD_SIZE && token_address.length > 0)
//             {
//                 inprogress = false;
//                 console.log(temp_hashes);
//                 fetchTransactionDetails(temp_hashes).then(temp_hashes => {

//                     for (const transaction_obj of temp_hashes) {

//                         if (checkifeligibletransaction( transaction_obj , token_address))
//                             {
//                                 console.log("Eligible");
//                                 eligible_transactions.push(transaction_obj);
//                             }

//                     }

//                 })

//                 console.log(eligible_transactions);

//                 const now = new Date();
//                 const hours = now.getHours();
//                 const minutes = now.getMinutes();
//                 const seconds = now.getSeconds();

//                 const formattedTime = `${hours}:${minutes}:${seconds}`;
//                 console.log("Current time after processing:", formattedTime);
//                 token_address = "";
//                 temp_hashes = [];
//                 eligible_transactions = [];

//             }

//             if (logs && logs.some((log: string | string[]) => log.includes("initialize2") ) && !inprogress ) {
//                 inprogress = true;
//                 const results = extractData(logs);
//                 console.log(results);
//                 let token_timestamp = results[0].timestamp;
//                 let token_solana_supply = results[0].init_pc_amount;
//                 const currentTimestamp = Math.floor(Date.now() / 1000);

//                 console.log("Start in : ", currentTimestamp - token_timestamp, " Seconds");
//                 console.log("Signature for 'initialize2':", signature);

//                 const now = new Date();

//                 // Extract the components you need
//                 const hours = now.getHours();
//                 const minutes = now.getMinutes();
//                 const seconds = now.getSeconds();

//                 // Format the time as you wish
//                 const formattedTime = `${hours}:${minutes}:${seconds}`;

//                 // Print the time to the console
//                 console.log(formattedTime);
//                 let token_mint =  fetchRaydiumAccounts(signature, connection,results);

//                 token_mint.then(token_mint => {
//                     token_address = token_mint as string;
//                     console.log(token_address); // Access the resolved value here
//                 }).catch(error => {
//                     console.error("Error fetching token address:", error);
//                 });
//                 console.log(inprogress);
//             }
//         },
//         "confirmed"
//     );
// }

// //Start Helper Functions

// async function fetchTransactionDetails(transactionHashes: string[]) {
//     const transactionDetailsPromises = transactionHashes.map(hash => {
//         return connection.getParsedTransaction(hash,
//             {
//                 maxSupportedTransactionVersion: 0,
//                 commitment: 'confirmed'
//             });
//     });

//     const transactionDetails = await Promise.all(transactionDetailsPromises);
//     return transactionDetails;
// }

// function extractData(logArray: string[]) {
//     const regex = /open_time: (\d+), init_pc_amount: (\d+), init_coin_amount: (\d+)/;;
//     const extractedData = [];

//     for (const entry of logArray) {
//         if (typeof entry === 'string') { // Assuming log messages are strings
//             const match = entry.match(regex);
//             if (match) {
//                 extractedData.push({
//                     timestamp: parseInt(match[1], 10),
//                     init_pc_amount: parseInt(match[2], 10),
//                     init_coin_amount: parseInt(match[3], 10)
//                 });
//             }
//         }
//     }

//     return extractedData;
// }

// async function fetchRaydiumAccounts(txId: any, connection: any,results: any) {
//     const tx = await connection.getParsedTransaction(
//         txId,
//         {
//             maxSupportedTransactionVersion: 0,
//             commitment: 'confirmed'
//         });

//     const accounts = tx?.transaction.message.instructions.find((ix: { programId: { toBase58: () => string; }; }) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY).accounts;

//     if (!accounts) {
//         console.log("No accounts found in the transaction.");
//         return;
//     }

//     const tokenAIndex = 8;
//     const tokenBIndex = 9;

//     const tokenAAccount = accounts[tokenAIndex];
//     const tokenBAccount = accounts[tokenBIndex];
//     let token_mint: string = "";
//     let liquidity: number = 0;
//     if (!tokenAAccount.toBase58().startsWith("So11111") )
//     {
//         let liquidity: number = results[0].init_pc_amount;
//         token_mint = tokenAAccount.toBase58();
//         console.log(lamport_tosol(liquidity), " Solana");
//     }
//     else
//     {
//         let liquidity:number  = results[0].init_coin_amount;
//         token_mint = tokenBAccount.toBase58();
//         console.log(lamport_tosol(liquidity), " Solana");
//     }

//     const displayData = [
//         { "Token": "A", "Account Public Key": tokenAAccount.toBase58() },
//         { "Token": "B", "Account Public Key": tokenBAccount.toBase58() }
//     ];

//     console.log("New LP Found");
//     console.log(generateExplorerUrl(txId));
//     console.table(displayData);

//     const now = new Date();

//     const currentTime = now.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//     });
//     console.log(currentTime);

//     return token_mint;

// }

// function checkifeligibletransaction(transaction_object: any,token_mint: any)
// {

// if (

//     transaction_object.transaction &&
//     transaction_object.transaction.message &&
//     transaction_object.transaction.message.instructions) {

//     let instructions =  transaction_object.transaction.message.instructions;

//     for (var inst of instructions)
//     {

//         if (inst &&
//             inst.parsed &&
//             inst.parsed.info &&
//             'mint' in inst.parsed.info) {
//             // If this point is reached, the path exists
//             let token_address = inst.parsed.info.mint;
//             return token_address.toLowerCase() === token_mint.toLowerCase();
//         }
//     }
//     return false;

// }

//     return false;

// }

// function lamport_tosol(lamport: number){

//     return lamport / 1000000000;
// }

// function generateExplorerUrl(txId: string) {
//     return `https://solscan.io/tx/${txId}`;
// }

// let temp_hashes = ["FGjacU67W8PwAerkyk31LraP9YViS88LdS5j8UafnaxPuJsgVsTCncRgC38A1Hrs1PGqHJTsrseTxSNC2aiZZMJ", "42NSnYH3JkgVEN7cwbKYDvLCsBhpjzMMEQvMAddm2gsQHm4uuo5RnSqPqMgCw25aANBMfTfmM7rxZtpjJ7qUwNuh"]
// let eligible_transactions = [];
// fetchTransactionDetails(temp_hashes).then(temp_hashes => {

//     for (const transaction_obj of temp_hashes) {

//         if (checkifeligibletransaction( transaction_obj , "3FyA9YfRvyQF7KpEtsHwccmbkNjpG15D7aWsjBstfkJ2"))
//             {
//                 console.log("Eligible");
//                 eligible_transactions.push(transaction_obj);
//             }
//         else{console.log("Not eligible")}

//     }})

// const TRANSACTION_LOOK_AHEAD_SIZE = 30;
// const TOKEN_PUBLIC_KEY = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
// const token_key = new PublicKey(TOKEN_PUBLIC_KEY);
// const raydium_two = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
// main(connection, token_key).catch(console.error);

async function main(connection: any, programAddress: any) {
  console.log("Monitoring logs for program:", programAddress.toString());

  let a: number = 0;
  let liquidity: number = 0;
  let inprogress: boolean = false;
  let temp_hashes: string[] = [];
  let eligible_transactions: any[] = [];
  let token_address: string = "";
  let pair_address: string = "";
  let start_time: number = 0;

  let increment_a: number = 0;
  let increment_b: number = 0;
  let bought_tokens: string[] = [];

  connection.onLogs(
    programAddress,
    ({ logs, err, signature }) => {
      if (err) return;

      increment_a += 1;

      if (increment_a % 500 === 0) {
        console.log("Hello from A");
      }

      if (logs && logs.some((log: string | string[]) => log.includes("Burn"))) {
        const doesNotContainWater = logs.every(
          (str: string | string[]) => !str.includes("[2]")
        );

        if (doesNotContainWater && (logs.length === 10 || logs.length === 8)) {
          console.log(signature);

          extract_mint_in_transaction(logs, signature)
            .then((tokenMint: any) => {
              if (tokenMint in candidates) {
                let token_address_extraced =
                  candidates[tokenMint["token_address"]];
                sendMessageToTelegram(
                  "https://dexscreener.com/solana/" + token_address_extraced
                );
              }
            })
            .catch((error) => {
              console.error("Error occurred:", error);
            });
        }
      }

      if (
        logs &&
        logs.some((log: string | string[]) => log.includes("CloseAccount"))
      ) {
        const doesNotContainWater = logs.every(
          (str: string | string[]) => !str.includes("[2]")
        );

        if (doesNotContainWater && logs.length === 16) {
          extract_mint_in_transaction(logs, signature)
            .then((tokenMint: any) => {
              if (tokenMint in candidates) {
                let token_address_extraced =
                  candidates[tokenMint["token_address"]];
                sendMessageToTelegram(
                  "https://dexscreener.com/solana/" + token_address_extraced
                );
              }
            })
            .catch((error) => {
              console.error("Error occurred:", error);
            });
        }
      }
    },
    "confirmed"
  );
}

async function extract_mint_in_transaction(
  logs: string | any[],
  signature: string
) {
  let fetched_mint_address = "";
  try {
    if (logs.length === 10) {
      let tx = await connection.getParsedTransaction(signature, {
        //  maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      fetched_mint_address = tx.meta.preTokenBalances[0].mint.toLowerCase();
      return fetched_mint_address;
    } else {
      let tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      fetched_mint_address = tx.meta.preTokenBalances[0].mint.toLowerCase();
      return fetched_mint_address;
    }

    //   saveObjectAsJson(tx, "myObject.json"); // Moved this line before the return statement
  } catch (error) {
    console.error("Error fetching or printing transaction:", error);
  }
}
