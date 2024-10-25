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
import {
  TransactionMessage,
  VersionedTransaction,
  TokenAccountsFilter,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync, unpackMint } from "@solana/spl-token";
import fetch from "node-fetch";
import { Metaplex } from "@metaplex-foundation/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import util from "util";

// Constants
let DOLLAR_PER_SOLANA: number = 185;
fetch(
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
)
  .then((response: { json: () => any }) => response.json())
  .then((data: { solana: { usd: number } }) => {
    // Extracting Solana price in USD from the response
    DOLLAR_PER_SOLANA = data.solana.usd;
  })
  .catch((error: any) => {
    console.error("Error fetching data:", error);
  });

const HTTP_URL = "";
const WSS_URL = "";
const RAYDIUM_PUBLIC_KEY = "";
const TRANSACTION_LOOK_AHEAD_SIZE = 50;
const MIN_LIQUIDITY_TO_CONSIDER = 1000;
const raydium = new PublicKey(RAYDIUM_PUBLIC_KEY);
const TOKEN_PUBLIC_KEY = "";
const token_key = new PublicKey(TOKEN_PUBLIC_KEY);
const LIQUIDITY_THRESHOLD = 500;
const BUY_MIN_THRESHOLD = 50;
const TOKEN_TO_LIQUIDITY_RATIO = 0.7;
const keypair = getKeypairFromEnvironment("private_key");
// Connection to Solana Node
const SESSION_HASH = "QNDEMO" + Math.ceil(Math.random() * 1e9); // Random unique identifier for your session
const connection = new Connection(HTTP_URL, {
  wsEndpoint: WSS_URL,
  httpHeaders: { "x-session-hash": SESSION_HASH },
});

console.log("USD per SOL: ", DOLLAR_PER_SOLANA);

main(connection, raydium, token_key).catch(console.error);

//Main Function

interface Candidates {
  [key: string]: {
    hashes: any; // Assuming hash is of any type
    token_address: any; // Assuming temp_token_address is of any type
    pair_address: any; // Assuming temp_token_address is of any type
    liquidity: any; // Assuming temp_liquidity is of any type
  };
}

async function main(
  connection: any,
  programAddress: any,
  programmAddress_two: any
) {
  console.log("Monitoring logs for program:", programAddress.toString());

  let a: number = 0;
  let liquidity: number = 0;
  let inprogress: boolean = false;
  let temp_hashes: string[] = [];
  let eligible_transactions: any[] = [];
  let token_address: string = "";
  let pair_address: string = "";
  let mint_address: string = "";
  let start_time: number = 0;
  let deposited_token_amount: number = 0;
  let leftover_token: number = 0;

  let last_twenty_signatures: string[] = [];

  let candidates: Candidates = {};
  let volume_check_passed: string[] = [];
  let rug_check_passed: string[] = [];

  let increment_a: number = 0;
  let increment_b: number = 0;

  let bought_tokens: string[] = [];

  connection.onLogs(
    programAddress,
    async ({ logs, err, signature }) => {
      if (err) return;

      increment_a += 1;

      if (increment_a % 5000 === 0) {
        console.log("Hello from A");
        console.log(inprogress);
        console.log(token_address);
        console.log(temp_hashes.length);
        console.log("Volume check passed length: ", volume_check_passed.length);
        console.log("Rug check passed length: ", rug_check_passed.length);
      }

      //   let intersection_array = getIntersection(volume_check_passed, rug_check_passed);

      //   if (intersection_array.length >0)
      //   {

      //     for (let i = 0; i < intersection_array.length; i++) {
      //         rug_check_passed = rug_check_passed.filter(e => e !== intersection_array[i]);
      //         sendMessageToTelegram("https://dexscreener.com/solana/" + intersection_array[i]);

      //       }

      //   }

      if (!inprogress && last_twenty_signatures.length < 20) {
        last_twenty_signatures.push(signature);
      } else if (!inprogress && last_twenty_signatures.length === 20) {
        last_twenty_signatures.shift();
        last_twenty_signatures.push(signature);
      }

      if (!inprogress && temp_hashes.length > 0) {
        temp_hashes = [];
        token_address = "";
      }

      if (inprogress && temp_hashes.length < TRANSACTION_LOOK_AHEAD_SIZE) {
        temp_hashes.push(signature);
      } else if (
        inprogress &&
        temp_hashes.length === TRANSACTION_LOOK_AHEAD_SIZE &&
        token_address.length > 1
      ) {
        let temp_liquidity: number = liquidity;
        let temp_pair_address: string = pair_address;
        let temp_start_time: number = start_time;
        let temp_token_address: string = token_address;
        let temp_deposited_token_amount: number = deposited_token_amount;
        let temp_leftover_token_amount: number = leftover_token;
        let temp_mint_address: string = mint_address;
        let temp_twenty_transactions = [...last_twenty_signatures];

        let hash = [...temp_hashes];
        console.log("Temp Liquidity: ", temp_liquidity);
        console.log("Deposited token amount: ", temp_deposited_token_amount);
        console.log("Leftover token amount: ", temp_leftover_token_amount);
        console.log("Mint address: ", temp_mint_address);
        console.log("Candidates length: ", getObjectLength(candidates));
        console.log("Next 30 hashes: for token ", temp_token_address);
        console.log(util.inspect(hash, { maxArrayLength: null }));

        console.log("Last 20 hashes for token ", temp_token_address);
        console.log(temp_twenty_transactions);
        inprogress = false;

        // if ( ((temp_liquidity * DOLLAR_PER_SOLANA) > 500) &&  ((temp_liquidity * DOLLAR_PER_SOLANA) < 3750) && ( temp_start_time > 0 ))
        // {

        //     analyze_token(temp_pair_address, temp_start_time).then((result) => {
        //         if (result) {

        //             console.log("Result for: ", temp_token_address);

        //           // Get the highest number
        //           let highest = Math.max(...result.prices.slice(0, 9));

        //           // Get the lowest number
        //           let lowest = Math.min(...result.prices.slice(0, 9));
        //           let one_minute_volume_array = result.one_minute_volume.slice(0, 9);
        //           let allGreaterThan1000 = one_minute_volume_array.every(number => number > 1000);
        //           let atLeastOneGreaterThan5000 = one_minute_volume_array.some(number => number > 5000);
        //           let liquidity_boolean: boolean = result.liquidity > 10000;
        //           let price_ratio:boolean = checkSuccessor(result.prices);

        //           console.log("Liquidity Result:, ", result.liquidity);
        //           console.log("AllgreaterThan1000: ", allGreaterThan1000);
        //           console.log("atLeastOneGreaterThan5000", atLeastOneGreaterThan5000);
        //           console.log("Prices: ", result.prices);
        //           console.log("Volumes: ", one_minute_volume_array);
        //           console.log("Highest price: ", highest);
        //           console.log("Lowest price: ", lowest);

        //           if (allGreaterThan1000 && atLeastOneGreaterThan5000 && liquidity_boolean && price_ratio && !bought_tokens.includes(temp_token_address) && ((highest/lowest)<10 )) {
        //             bought_tokens.push(temp_token_address);
        //             // This block of code will execute if all conditions are true
        //             sendMessageToTelegram("https://dexscreener.com/solana/" + temp_token_address);
        //         }

        //         }
        //       }).catch((error) => {
        //         console.error('Error:', error);
        //       });

        // }

        console.log("Token address is: ", token_address);

        if (temp_liquidity * DOLLAR_PER_SOLANA > MIN_LIQUIDITY_TO_CONSIDER) {
          function delay(ms: number): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve, ms));
          }

          if (temp_start_time < 0) {
            await delay(temp_start_time * -1 * 1000 - 1000);
          }

          runChecks(temp_token_address, temp_leftover_token_amount)
            .then(async (results) => {
              console.log(results); // Output: ['Result 1', 'Result 2', 'Result 3']
              if (results.every((value) => value === true)) {
                console.log(
                  "Token_address: ",
                  temp_token_address,
                  " passed first layer of tests"
                );

                let temp_obj = {
                  hashes: hash,
                  token_address: temp_token_address,
                  pair_address: temp_pair_address,
                  liquidity: temp_liquidity,
                };
                candidates[temp_mint_address.toLowerCase()] = temp_obj;

                await delay(65000);
                let amount_of_minutes: number = 3;
                let last_seen_volume: number = 0;
                let one_minute_volume: number[] = [];
                console.log(
                  "Getting volumes for pair address: ",
                  temp_pair_address
                );
                let liquidity_after_minutes: number = 0;
                let market_cap_after_minutes: number = 0;
                for (let i = 0; i < amount_of_minutes; i++) {
                  const response = await fetch(
                    "https://api.dexscreener.com/latest/dex/pairs/solana/" +
                      temp_pair_address
                  );

                  if (!response.ok) {
                    console.error(
                      `Failed to fetch data: ${response.status} ${response.statusText}`
                    );
                    return null;
                  }

                  const data = await response.json();
                  if (last_seen_volume === 0) {
                    last_seen_volume = data.pair.volume.h24;
                    one_minute_volume.push(data.pair.volume.h24);
                  } else {
                    one_minute_volume.push(
                      data.pair.volume.h24 - last_seen_volume
                    );
                    last_seen_volume = data.pair.volume.h24;
                  }

                  // If this is not the last iteration, sleep for 60 seconds
                  if (i < amount_of_minutes - 1) {
                    await delay(59000);
                  }

                  if (i === amount_of_minutes - 1) {
                    liquidity_after_minutes = data.pair.liquidity.usd;
                    market_cap_after_minutes = data.pair.fdv;
                  }
                }
                console.log("Final volumes for token: ", temp_token_address);
                console.log(one_minute_volume);
                console.log(
                  "Liquidity after 3 minutes: ",
                  liquidity_after_minutes
                );
                console.log(
                  "Market cap after 3 minutes: ",
                  market_cap_after_minutes
                );

                let expression1 = one_minute_volume[2] > 7500;
                let expression2 = liquidity_after_minutes > 12000;
                let expression3 = market_cap_after_minutes > 25000;
                if (
                  (expression1 && expression3) ||
                  (expression2 && expression3)
                ) {
                  console.log(
                    "Token_address: ",
                    temp_token_address,
                    " passed second layer of tests"
                  );

                  volume_check_passed.push(temp_token_address.toLowerCase());

                  liquidity_lock_check(temp_mint_address)
                    .then((boolean_result) => {
                      console.log(boolean_result);

                      if (boolean_result) {
                        console.log(
                          "Token_address: ",
                          temp_token_address,
                          " passed third layer of tests"
                        );

                        fetchTransactionDetails(hash).then((temp_hashes) => {
                          let temp_eligible_transactions: any[] = [];
                          let index = 0;
                          let index_array: number[] = [];
                          for (const transaction_obj of temp_hashes) {
                            // console.log(transaction_obj)
                            if (
                              checkifeligibletransaction(
                                transaction_obj,
                                temp_token_address
                              )
                            ) {
                              temp_eligible_transactions.push(transaction_obj);
                              index_array.push(index);
                            }

                            index += 1;
                          }

                          let eligible_for_buy: boolean = true;

                          console.log(
                            "Number of eligible transactions: ",
                            temp_eligible_transactions.length
                          );
                          if (temp_eligible_transactions.length > 0) {
                            console.log(
                              "Index of valid transactions: ",
                              index_array
                            );

                            let sol_amount = extract_sol_amount(
                              temp_eligible_transactions
                            );

                            let sol_dollar_values = sol_amount.map(
                              (number) => number * DOLLAR_PER_SOLANA
                            );
                            console.log("Dollar values: ", sol_dollar_values);
                            if (index_array[0] < 2) {
                              eligible_for_buy = false;
                            }
                          }
                          if (eligible_for_buy) {
                            console.log(
                              "Token_address: ",
                              temp_token_address,
                              " passed all tests"
                            );
                            rug_check_passed.push(
                              temp_token_address.toLowerCase()
                            );
                            sendMessageToTelegram(
                              "https://dexscreener.com/solana/" +
                                temp_token_address
                            );
                          }
                        });
                      } // Access the returned token mint value
                    })
                    .catch((error) => {
                      console.error("Error occurred:", error);
                    });
                }

                // fetchTransactionDetails(hash).then(temp_hashes => {

                //     for (const transaction_obj of temp_hashes) {

                //         // console.log(transaction_obj)
                //         if (checkifeligibletransaction( transaction_obj , temp_token_address))
                //             {

                //                 temp_eligible_transactions.push(transaction_obj);
                //             }

                //     }

                //     console.log("Number of eligible transactions: ", temp_eligible_transactions.length);

                //     if (temp_eligible_transactions.length>2)
                //     {
                //         let first_six_eligible_transactions = temp_eligible_transactions.slice(0, 6);
                //         let sol_amount = extract_sol_amount(first_six_eligible_transactions);

                //         let sol_dollar_values = sol_amount.map(number => number * DOLLAR_PER_SOLANA);

                //         if (sol_dollar_values.some(value => value > 50))
                //         {

                //             sendMessageToTelegram("https://dexscreener.com/solana/" + temp_token_address);

                //         }

                //         console.log(sol_amount);

                //         // let transaction_keys = extracttransactionkeys(temp_hashes);
                //         // let token_decimals = extract_tokendecimals(temp_hashes[0]);

                //     }

                //     const now = new Date();
                //     const hours = now.getHours();
                //     const minutes = now.getMinutes();
                //     const seconds = now.getSeconds();

                //     const formattedTime = `${hours}:${minutes}:${seconds}`;
                //     console.log("Current time after processing:", formattedTime);

                //     eligible_transactions = [];

                // })
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }
      } else if (token_address.length === 1) {
        inprogress = false;
        temp_hashes = [];
        token_address = "";
      }

      if (
        logs &&
        logs.some((log: string | string[]) => log.includes("initialize2")) &&
        !inprogress
      ) {
        inprogress = true;
        const results = extractData(logs);

        let token_timestamp = results[0].timestamp;
        let token_solana_supply = results[0].init_pc_amount;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        start_time = currentTimestamp - token_timestamp;
        console.log(
          "Start in : ",
          currentTimestamp - token_timestamp,
          " Seconds"
        );
        console.log("Signature for 'initialize2':", signature);

        const now = new Date();

        // Extract the components you need
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Format the time as you wish
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        // Print the time to the console
        console.log(formattedTime);
        let token_mint = fetchRaydiumAccounts(signature, connection, results);

        token_mint
          .then((token_mint) => {
            token_address = token_mint[0];
            pair_address = token_mint[1];
            liquidity = token_mint[2];
            deposited_token_amount = token_mint[3];
            leftover_token = token_mint[4];
            mint_address = token_mint[5];
          })
          .catch((error) => {
            console.error("Error fetching token address:", error);
            token_address = "H";
          });
      }
    },
    "confirmed"
  );

  // connection.onLogs(
  //     programmAddress_two,
  //     ({ logs, err, signature }) => {
  //         if (err) return;

  //         increment_b +=1;

  //         if (increment_b % 5000 === 0) {
  //             console.log("Hello from b");

  //           }

  // if (logs && logs.some((log: string | string[]) =>  log.includes("Burn") ) )
  // {

  //   const doesNotContainWater = logs.every((str: string | string[]) => !str.includes("[2]"));

  //   if (doesNotContainWater && ((logs.length === 10) )) {

  //               extract_mint_in_transaction(logs, signature).then((tokenMint: any) => {

  //                 if (tokenMint in candidates)
  //                 {

  //                     console.log("Found a new token");

  //                     let token_address_extraced = candidates[tokenMint]["token_address"]
  //                     let saved_hashes = candidates[tokenMint]["hashes"];
  //                         console.log("Found hashes for token: ", token_address_extraced);
  //                         console.log(saved_hashes);

  //                         let temp_eligible_transactions:any[] = [];
  // fetchTransactionDetails(saved_hashes).then(temp_hashes => {

  //     let index = 0;
  //     let index_array:number[] = [];
  //     for (const transaction_obj of temp_hashes) {

  //         // console.log(transaction_obj)
  //         if (checkifeligibletransaction( transaction_obj , token_address_extraced))
  //             {

  //                 temp_eligible_transactions.push(transaction_obj);
  //                 index_array.push(index);
  //             }

  //             index +=1;
  //     }

  //     let eligible_for_buy:boolean = true;

  //     console.log("Number of eligible transactions: ", temp_eligible_transactions.length);
  //         if (temp_eligible_transactions.length>0)
  //     {
  //         console.log("Index of valid transactions: ", index_array);

  //         let sol_amount = extract_sol_amount(temp_eligible_transactions);

  //         let sol_dollar_values = sol_amount.map(number => number * DOLLAR_PER_SOLANA);
  //         console.log("Dollar values: ", sol_dollar_values);
  //         if ( (sol_dollar_values[0] > 1000)  )
  //         {
  //             eligible_for_buy = false;

  //         }
  //     }
  //     if ((eligible_for_buy))
  //     {
  //             rug_check_passed.push(token_address_extraced.toLowerCase())

  //      }

  // } )

  //                 }

  //             }).catch(error => {
  //                 console.error("Error occurred:", error);
  //             });

  //           }

  //         }

  // if (logs && logs.some((log: string | string[]) =>  log.includes("CloseAccount") ) )
  // {

  //   const doesNotContainWater = logs.every((str: string | string[]) => !str.includes("[2]"));

  //   if (doesNotContainWater && ((logs.length === 16) || (logs.length === 18) )) {

  //             extract_mint_in_transaction(logs, signature).then((tokenMint: any) => {

  //               if (tokenMint in candidates)
  //               {

  //                 console.log("Found a new token");

  //                     let token_address_extraced = candidates[tokenMint]["token_address"]
  //                     let saved_hashes = candidates[tokenMint]["hashes"];
  //                         console.log("Found hashes for token: ", token_address_extraced);
  //                         console.log(saved_hashes);

  //                         let temp_eligible_transactions:any[] = [];
  //                 fetchTransactionDetails(saved_hashes).then(temp_hashes => {

  //                     let index = 0;
  //                     let index_array:number[] = [];
  //                     for (const transaction_obj of temp_hashes) {

  //                         // console.log(transaction_obj)
  //                         if (checkifeligibletransaction( transaction_obj , token_address_extraced))
  //                             {

  //                                 temp_eligible_transactions.push(transaction_obj);
  //                                 index_array.push(index);
  //                             }

  //                             index +=1;
  //                     }

  //                     let eligible_for_buy:boolean = true;

  //                     console.log("Number of eligible transactions: ", temp_eligible_transactions.length);
  //                         if (temp_eligible_transactions.length>0)
  //                     {
  //                         console.log("Index of valid transactions: ", index_array);

  //                         let sol_amount = extract_sol_amount(temp_eligible_transactions);

  //                         let sol_dollar_values = sol_amount.map(number => number * DOLLAR_PER_SOLANA);
  //                         console.log("Dollar values: ", sol_dollar_values);
  //                         if ( (sol_dollar_values[0] > 1000)   )
  //                         {
  //                             eligible_for_buy = false;

  //                         }
  //                     }
  //                     if ((eligible_for_buy))
  //                     {
  //                             rug_check_passed.push(token_address_extraced.toLowerCase())

  //                      }

  //                 } )

  //               }

  //           }).catch(error => {
  //               console.error("Error occurred:", error);
  //           });

  //         }

  //         }

  //         },
  //     "confirmed"
  // );
}

//Start Helper Functions

async function fetchTransactionDetails(transactionHashes: any) {
  const batchSize = 20;
  const delay = 1000;
  let transactionDetails: any[] = [];

  for (let i = 0; i < transactionHashes.length; i += batchSize) {
    // Get the current batch of transaction hashes
    const batch = transactionHashes.slice(i, i + batchSize);

    // Map each hash to a promise of transaction details
    const transactionDetailsPromises = batch.map((hash: string) => {
      return connection.getParsedTransaction(hash, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    });

    // Wait for the entire batch of promises to resolve
    const batchDetails: any = await Promise.all(transactionDetailsPromises);
    transactionDetails = transactionDetails.concat(batchDetails);

    // If there are more batches to process, wait for 500 ms
    if (i + batchSize < transactionHashes.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return transactionDetails;
}

function extractData(logArray: string[]) {
  const regex =
    /open_time: (\d+), init_pc_amount: (\d+), init_coin_amount: (\d+)/;
  const extractedData = [];

  for (const entry of logArray) {
    if (typeof entry === "string") {
      // Assuming log messages are strings
      const match = entry.match(regex);
      if (match) {
        extractedData.push({
          timestamp: parseInt(match[1], 10),
          init_pc_amount: parseInt(match[2], 10),
          init_coin_amount: parseInt(match[3], 10),
        });
      }
    }
  }

  return extractedData;
}

async function fetchRaydiumAccounts(txId: any, connection: any, results: any) {
  const tx = await connection.getParsedTransaction(txId, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  const accounts = tx?.transaction.message.instructions.find(
    (ix: { programId: { toBase58: () => string } }) =>
      ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY
  ).accounts;

  if (!accounts) {
    console.log("No accounts found in the transaction.");
    return ["H", "", 0, 0, 0, ""];
  }

  const pairIndex = 4;
  const mintIndex = 7;
  const tokenAIndex = 8;
  const tokenBIndex = 9;

  const tokenAAccount = accounts[tokenAIndex];
  const tokenBAccount = accounts[tokenBIndex];
  const mintAddress = accounts[mintIndex].toBase58();
  const pairAddress = accounts[pairIndex].toBase58();

  console.log("Pair Address: ", pairAddress);
  let token_mint: string = "";
  let liquidity: number = 0;
  if (!tokenAAccount.toBase58().startsWith("So11111")) {
    liquidity = lamport_tosol(results[0].init_pc_amount);
    token_mint = tokenAAccount.toBase58();
    console.log(liquidity, " Solana");
  } else {
    liquidity = lamport_tosol(results[0].init_coin_amount);
    token_mint = tokenBAccount.toBase58();
    console.log(liquidity, " Solana");
  }

  let postTokenBalance = tx.meta.postTokenBalances;
  let deposit_token: number = 0;
  let leftover_token: number = 0;

  for (var i = 0; i < postTokenBalance.length; i++) {
    if (
      postTokenBalance[i].mint.toLowerCase() === token_mint.toLowerCase() &&
      postTokenBalance[i].owner.toLowerCase() ===
        "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1".toLowerCase()
    ) {
      deposit_token = postTokenBalance[i].uiTokenAmount.uiAmount;
    }

    if (
      postTokenBalance[i].mint.toLowerCase() === token_mint.toLowerCase() &&
      postTokenBalance[i].owner.toLowerCase() !==
        "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1".toLowerCase()
    ) {
      if (postTokenBalance[i].uiTokenAmount.uiAmount === null) {
        leftover_token = 0;
      } else {
        leftover_token = postTokenBalance[i].uiTokenAmount.uiAmount;
      }
    }
  }

  const displayData = [
    { Token: "A", "Account Public Key": tokenAAccount.toBase58() },
    { Token: "B", "Account Public Key": tokenBAccount.toBase58() },
  ];

  console.log("New LP Found");
  console.log(generateExplorerUrl(txId));
  // console.table(displayData);
  console.log("Token A ", "Account Public Key", tokenAAccount.toBase58());
  console.log("Token B ", "Account Public Key", tokenBAccount.toBase58());

  const now = new Date();

  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log(currentTime);

  if (typeof token_mint === "undefined") {
    return ["H", "", 0, 0, 0, ""];
  } else if (token_mint.length <= 1) {
    return ["H", "", 0, 0, 0, ""];
  } else {
    return [
      token_mint,
      pairAddress,
      liquidity,
      deposit_token,
      leftover_token,
      mintAddress,
    ];
  }
}

function extract_sol_amount(input_array: any[]) {
  let solana_acc = [];

  for (var elem of input_array) {
    let pretokenbalances = elem.meta.innerInstructions;

    let signer = "";

    let accounts = elem.transaction.message.accountKeys;

    for (var elem of accounts) {
      if (elem.signer) {
        signer = elem.pubkey.toBase58();
      }
    }

    for (var element of pretokenbalances) {
      if (
        element &&
        element.instructions &&
        element.instructions[0] &&
        element.instructions[0].parsed &&
        element.instructions[0].parsed.info &&
        element.instructions[0].parsed.info.amount
      ) {
        let bought_solana = lamport_tosol(
          parseInt(element.instructions[0].parsed.info.amount, 10)
        );

        solana_acc.push(bought_solana);
      } else {
      }
    }
  }

  // let first_transaction = input_array[0];
  // let accounts = first_transaction.transaction.message.accountKeys;
  // let signer = "";
  // for (var elem of accounts)
  // {
  //     if (elem.signer)
  //     {

  //         signer = elem.pubkey.toBase58();

  //     }

  // }

  // console.log("The signer is: ", signer);
  // for (var elem of first_transaction.meta.preTokenBalances)
  // {
  //     console.log(elem.owner);
  //     if (  (elem.mint.toLowerCase() === "So11111111111111111111111111111111111111112".toLowerCase()) && (elem.owner.toLowerCase() === signer.toLowerCase())  )
  //     {

  //         console.log("Amout of Solana bought: ", elem.uiTokenAmount.uiAmount)
  //         solana_acc.push(elem.uiTokenAmount.uiAmount);

  //     }

  // }

  return solana_acc;
}

function checkifeligibletransaction(transaction_object: any, token_mint: any) {
  if (
    transaction_object &&
    transaction_object.meta &&
    transaction_object.meta.innerInstructions
  ) {
    let instructions = transaction_object.meta.innerInstructions;

    for (var inst of instructions) {
      if (inst && inst.instructions) {
        let inner_instruction = inst.instructions;

        for (var elem of inner_instruction) {
          if (
            elem &&
            elem.parsed &&
            elem.parsed.info &&
            "mint" in elem.parsed.info
          ) {
            // If this point is reached, the path exists
            let token_address = elem.parsed.info.mint;
            return token_address.toLowerCase() === token_mint.toLowerCase();
          }
        }
      }
    }
    return false;
  }

  return false;
}

function extract_tokendecimals(transaction: any) {
  let post_balances = transaction.meta.postTokenBalances;

  for (var elem of post_balances) {
    if (
      elem.mint.toLowerCase() !==
      "So11111111111111111111111111111111111111112".toLowerCase()
    ) {
      console.log("Mint: ", elem.uiTokenAmount.decimals);
      return elem.uiTokenAmount.decimals;
    }
  }
}

function extracttransactionkeys(transaction_object: any) {
  if (
    Array.isArray(transaction_object) &&
    transaction_object[0] &&
    transaction_object[0].transaction &&
    transaction_object[0].transaction.message &&
    Array.isArray(transaction_object[0].transaction.message.instructions)
  ) {
    // If this point is reached, the path exists
    let instructions = transaction_object[0].transaction.message.instructions;
    console.log(instructions);
    console.log("I am inside");
    for (var ins of instructions) {
      if ("accounts" in ins && ins.accounts.length === 18) {
        console.log("I am inside2");
        console.log(ins.accounts);
        console.log(ins.accounts.length);

        let accounts_arr = [];
        let accounts_array = ins.accounts;

        console.log(accounts_array);
        for (var input_key of accounts_array) {
          // console.log(input_key);
          const publicKeyInput = new PublicKey(input_key);
          accounts_arr.push(publicKeyInput);
          console.log(typeof publicKeyInput.toBase58());
          // console.log(publicKey.toBase58());

          // const publicKeyString = '5fzmg3Xngajd4djHjpgdCpbRAXzincGSvqQJTFKYLbVE';
          // const publicKeystr = new PublicKey(publicKeyString);
          // console.log(publicKeystr);

          // console.log(input_key._bn.words.toBase58());
          // console.log(Object.keys(input_key._bn));
        }
        return accounts_arr;
      }
    }
  } else {
    return [];
  }
}

function lamport_tosol(lamport: number) {
  return lamport / 1000000000;
}

function generateExplorerUrl(txId: string) {
  return `https://solscan.io/tx/${txId}`;
}

async function swaptoken(
  poolkeys: any,
  token: any,
  buytoken: boolean,
  token_decimals: number
) {
  let programId = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
  let marketId = poolkeys[8];

  if (buytoken) {
    let liquidityPoolKeys: LiquidityPoolKeys = {
      id: poolkeys[1],

      baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
      quoteMint: new PublicKey(token),
      lpMint: Liquidity.getAssociatedLpMint({ programId, marketId }), //placeholder
      baseDecimals: 9,
      quoteDecimals: token_decimals,
      lpDecimals: 9,
      version: 4,
      programId: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
      authority: poolkeys[2],
      openOrders: poolkeys[3],
      targetOrders: poolkeys[4],
      baseVault: poolkeys[5],
      quoteVault: poolkeys[6], //poolkeys[6]
      withdrawQueue: Liquidity.getAssociatedWithdrawQueue({
        programId,
        marketId,
      }), //placeholder poolkeys[6]
      lpVault: Liquidity.getAssociatedLpVault({ programId, marketId }),
      marketVersion: 3,
      marketProgramId: poolkeys[7],
      marketId: poolkeys[8],
      marketAuthority: poolkeys[14],
      marketBaseVault: poolkeys[12],
      marketQuoteVault: poolkeys[13],
      marketBids: poolkeys[9],
      marketAsks: poolkeys[10],
      marketEventQueue: poolkeys[11],
      lookupTableAccount: new PublicKey(
        "2immgwYNHBbyVQKVGCEkgWpi53bLwWNRMB5G2nbgYV17"
      ),
    };

    console.log(liquidityPoolKeys);
    const maxLamports: number = 100000;
    //   let tokenin = getAssociatedTokenAddressSync(new PublicKey('So11111111111111111111111111111111111111112'), keypair.publicKey);
    //   let tokenout = getAssociatedTokenAddressSync(new PublicKey(token), keypair.publicKey);
    const userTokenAccounts = await getOwnerTokenAccounts();
    const { minAmountOut, amountIn } = await calcAmountOut(
      liquidityPoolKeys,
      0.0002,
      true
    );

    let swapinstruction = await Liquidity.makeSwapInstructionSimple({
      connection: connection,
      makeTxVersion: 0,
      poolKeys: liquidityPoolKeys,
      userKeys: { tokenAccounts: userTokenAccounts, owner: keypair.publicKey },
      amountIn: amountIn,
      amountOut: minAmountOut,
      fixedSide: "in",
      config: {
        bypassAssociatedCheck: false,
      },
      computeBudgetConfig: {
        microLamports: maxLamports,
      },
    });
    return swapinstruction;
  } else {
    let liquidityPoolKeys: LiquidityPoolKeys = {
      id: poolkeys[1],

      baseMint: new PublicKey(token),
      quoteMint: new PublicKey("So11111111111111111111111111111111111111112"),
      lpMint: Liquidity.getAssociatedLpMint({ programId, marketId }), //placeholder
      baseDecimals: token_decimals,
      quoteDecimals: 9,
      lpDecimals: 9,
      version: 4,
      programId: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
      authority: poolkeys[2],
      openOrders: poolkeys[3],
      targetOrders: poolkeys[4],
      baseVault: poolkeys[5],
      quoteVault: poolkeys[6], //poolkeys[6]
      withdrawQueue: Liquidity.getAssociatedWithdrawQueue({
        programId,
        marketId,
      }), //placeholder poolkeys[6]
      lpVault: Liquidity.getAssociatedLpVault({ programId, marketId }),
      marketVersion: 3,
      marketProgramId: poolkeys[7],
      marketId: poolkeys[8],
      marketAuthority: poolkeys[14],
      marketBaseVault: poolkeys[12],
      marketQuoteVault: poolkeys[13],
      marketBids: poolkeys[9],
      marketAsks: poolkeys[10],
      marketEventQueue: poolkeys[11],
      lookupTableAccount: new PublicKey(
        "2immgwYNHBbyVQKVGCEkgWpi53bLwWNRMB5G2nbgYV17"
      ),
    };

    console.log(liquidityPoolKeys);
    const maxLamports: number = 100000;
    //   let tokenin = getAssociatedTokenAddressSync(new PublicKey('So11111111111111111111111111111111111111112'), keypair.publicKey);
    //   let tokenout = getAssociatedTokenAddressSync(new PublicKey(token), keypair.publicKey);
    const userTokenAccounts = await getOwnerTokenAccounts();
    const { minAmountOut, amountIn } = await calcAmountOut(
      liquidityPoolKeys,
      0.0002,
      true
    );

    let swapinstruction = await Liquidity.makeSwapInstructionSimple({
      connection: connection,
      makeTxVersion: 0,
      poolKeys: liquidityPoolKeys,
      userKeys: { tokenAccounts: userTokenAccounts, owner: keypair.publicKey },
      amountIn: amountIn,
      amountOut: minAmountOut,
      fixedSide: "in",
      config: {
        bypassAssociatedCheck: false,
      },
      computeBudgetConfig: {
        microLamports: maxLamports,
      },
    });
    return swapinstruction;
  }
}

async function getOwnerTokenAccounts() {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(
    keypair.publicKey,
    {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    }
  );

  return walletTokenAccount.value.map(
    (i: { pubkey: any; account: { owner: any; data: Buffer } }) => ({
      pubkey: i.pubkey,
      programId: i.account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    })
  );
}

async function calcAmountOut(poolKeys: LiquidityPoolKeys, rawAmountIn: number) {
  const poolInfo = await Liquidity.fetchInfo({
    connection: connection,
    poolKeys,
  });

  let currencyInMint = poolKeys.baseMint;
  let currencyInDecimals = poolInfo.baseDecimals;
  let currencyOutMint = poolKeys.quoteMint;
  let currencyOutDecimals = poolInfo.quoteDecimals;

  const currencyIn = new Token(
    TOKEN_PROGRAM_ID,
    currencyInMint,
    currencyInDecimals
  );
  const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
  const currencyOut = new Token(
    TOKEN_PROGRAM_ID,
    currencyOutMint,
    currencyOutDecimals
  );
  const minAmountOut = new TokenAmount(currencyOut, 1, false);
  // const slippage = new Percent(5, 100) // 5% slippage

  return {
    amountIn,
    minAmountOut,
  };
}

async function get_tokenamount_forwallet(wallet: string, token_mint: any) {
  const filterByMint: TokenAccountsFilter = {
    mint: new PublicKey(token_mint),
  };

  const requestData = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [
      wallet,
      {
        mint: token_mint,
      },
      {
        encoding: "jsonParsed",
      },
    ],
  };

  return fetch("https://api.mainnet-beta.solana.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([requestData]),
  })
    .then((response: { json: () => any }) => response.json())
    .then(
      (
        data: {
          result: {
            value: {
              account: {
                data: { parsed: { info: { tokenAmount: { uiAmount: any } } } };
              };
            }[];
          };
        }[]
      ) => {
        let tokenamount =
          data[0].result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return tokenamount;
      }
    )
    .catch((error: any) => {
      console.error("Error:", error);
    });
}

async function sendMessageToTelegram(message: string): Promise<void> {
  const TOKEN = "";
  const chat_id = "";
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(message)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

async function analyze_token(token_address: string, time: number) {
  let one_minute_volume: any[] = [];
  let prices: any[] = [];
  let last_seen_volume: number = 0;
  let amount_of_minutes: number = 12;
  let liquidity: number = 0;

  // Define a delay function using a Promise
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (time < 0) {
    await delay(time * -1 * 1000);
  }

  try {
    await delay(60000);
    // Run the try block 9 times with a 60-second sleep between each iteration
    for (let i = 0; i < amount_of_minutes; i++) {
      const response = await fetch(
        "https://api.dexscreener.com/latest/dex/pairs/solana/" + token_address
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      if (last_seen_volume === 0) {
        last_seen_volume = data.pair.volume.h24;
        prices.push(data.pair.priceUsd);
      } else {
        one_minute_volume.push(data.pair.volume.h24 - last_seen_volume);
        last_seen_volume = data.pair.volume.h24;
        prices.push(data.pair.priceUsd);
      }

      // If this is not the last iteration, sleep for 60 seconds
      if (i < amount_of_minutes - 1) {
        await delay(60000);
      }

      if (i === amount_of_minutes - 1) {
        liquidity = data.pair.liquidity.usd;
      }
    }

    return { one_minute_volume, prices, liquidity }; // Return the collected data
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

function checkSuccessor(arr: any[]) {
  for (let i = 0; i < arr.length - 1; i++) {
    const current = arr[i];
    const successor = arr[i + 1];

    if (successor < current * 0.2) {
      return false;
    }
  }

  return true;
}

async function Mint_test(mint_key: any) {
  let mintkeyPair = new PublicKey(mint_key);
  const info = await connection.getAccountInfo(mintkeyPair, "confirmed");
  const unpackedMint = unpackMint(mintkeyPair, info, TOKEN_PROGRAM_ID);

  return Object.is(unpackedMint.mintAuthority, null);
}

async function LargestAccountsCheck(
  token_mint: any,
  leftover_tokenamount: number
) {
  let largest_account_share: number[] = [];

  let supply = await connection.getTokenSupply(new PublicKey(token_mint));
  let supply_number = supply.value.uiAmount;

  const info = await connection.getTokenLargestAccounts(
    new PublicKey(token_mint)
  );

  console.log(info);

  for (let i = 0; i < info.value.length; i++) {
    largest_account_share.push(info.value[i].uiAmount);
  }

  let tokens_out_of_lp = sumFromIndex(largest_account_share, 1);
  tokens_out_of_lp += leftover_tokenamount;
  console.log("Share of largest accounts:", largest_account_share);
  console.log("Leftover amount: ", leftover_tokenamount);
  console.log("Presale + Leftover_amount: ", tokens_out_of_lp);
  console.log(
    "Ratio LP Tokens to supply: ",
    (supply_number - tokens_out_of_lp) / supply_number
  );
  return (
    (supply_number - tokens_out_of_lp) / supply_number >=
    TOKEN_TO_LIQUIDITY_RATIO
  );
}

function sumFromIndex(array: number[], from: number) {
  // Check if 'from' index is valid
  if (from < 0 || from >= array.length) {
    return 0;
  }

  // Initialize sum
  let sum = 0;

  // Iterate over elements starting from 'from' index
  for (let i = from; i < array.length; i++) {
    sum += array[i];
  }

  // Return the sum
  return sum;
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

    const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=&outputFormat=JSON&domainName=${website}`;
    const whoisResponse = await fetch(whoisUrl);
    if (!whoisResponse.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await whoisResponse.json();

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

async function runChecks(token_mint: string, leftover_tokens: number) {
  // Define your async functions

  // Run the async functions in parallel
  const result1Promise = checkMetadata_firstlayer(token_mint);
  const result2Promise = Mint_test(token_mint);
  const result3Promise = LargestAccountsCheck(token_mint, leftover_tokens);

  // Wait for all promises to resolve
  const [result1, result2, result3] = await Promise.all([
    result1Promise,
    result2Promise,
    result3Promise,
  ]);

  // Return the results in an array
  return [result1, result2, result3];
}

async function runChecks_secondlayer(token_mint: string) {
  // Define your async functions

  // Run the async functions in parallel
  const result1Promise = checkMetadata(token_mint);

  // Wait for all promises to resolve
  const [result1] = await Promise.all([result1Promise]);

  // Return the results in an array
  return [result1];
}

async function extract_mint_in_transaction(
  logs: string | any[],
  signature: string
) {
  let fetched_mint_address = "";
  console.log("Signature to fetch:", signature);
  // Introducing a 4-second delay
  await new Promise((resolve) => setTimeout(resolve, 6000));

  try {
    if (logs.length === 10) {
      let tx = await connection.getParsedTransaction(signature, {
        //  maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      console.log("Fetched mint transaction for signature: " + signature);
      console.log(typeof tx);
      fetched_mint_address = tx.meta.preTokenBalances[0].mint.toLowerCase();
      console.log("Fetched mint: ", fetched_mint_address);
      return fetched_mint_address;
    } else {
      let tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      console.log("Fetched mint transaction for signature: " + signature);
      console.log(typeof tx);

      fetched_mint_address = tx.meta.preTokenBalances[0].mint.toLowerCase();
      console.log("Fetched mint:");
      console.log(fetched_mint_address);
      return fetched_mint_address;
    }

    //   saveObjectAsJson(tx, "myObject.json"); // Moved this line before the return statement
  } catch (error) {
    console.error("Error fetching or printing transaction:", error);
  }
}

function getObjectLength(obj: any) {
  let count = 0;
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      count++;
    }
  }
  return count;
}

function getIntersection(arr1: string[], arr2: string[]): string[] {
  return arr1.filter((item) => arr2.includes(item));
}

async function liquidity_lock_check(address: string) {
  console.log({ address });
  try {
    const publicKey = new PublicKey(address);

    const transactions = [];
    let checked_signatures = [];
    let number_of_checks = 15;
    for (let a = 0; a < number_of_checks; a++) {
      const transSignatures =
        await connection.getConfirmedSignaturesForAddress2(publicKey);

      for (let i = 0; i < transSignatures.length; i++) {
        const signature = transSignatures[i].signature;

        if (signature in checked_signatures) {
          continue;
        } else {
          checked_signatures.push(signature);
        }
        const confirmedTransaction = await connection.getParsedTransaction(
          signature,
          {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          }
        );

        let log_messages = confirmedTransaction.meta.logMessages;

        if (verify_log_messages(log_messages)) {
          return true;
        }
      }

      console.log("Sleeping for 120 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 90000));
    }

    return false;
  } catch (err) {
    console.log("Liquidity check error");
    console.log(err);
    throw err;
  }
}

function verify_log_messages(logs: string[] | undefined | null) {
  if (logs && logs.some((log) => log.includes("Burn"))) {
    const doesNotContainWater = logs.every((str) => !str.includes("[2]"));

    if (doesNotContainWater && logs.length <= 10) {
      return true;
    }
  }

  if (logs && logs.some((log) => log.includes("CloseAccount"))) {
    const doesNotContainWater = logs.every((str) => !str.includes("[2]"));

    if (doesNotContainWater && logs.length <= 20) {
      return true;
    }
  }

  return false;
}
