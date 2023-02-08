const express = require("express");
const dotenv = require("dotenv");
const lodash = require("lodash");
const axios = require("axios");
const cors = require("cors");
const { Worker } = require("worker_threads");
const server = express();
dotenv.config();
cors();
const THREAD_COUNT = 4;

function createWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", {
      workerData: { thread_count: THREAD_COUNT },
    });
    worker.on("message", (data) => {
      resolve(data);
    });
    worker.on("error", (err) => {
      reject(`An error occured ${err}`);
    });
  });
}

async function getBinAuctions() {
  let auctions = getAllAuctions();
  const bin = filterAuctions(auctions, { bin: true });
  console.log(bin, "getBinAuctions");
  return bin;
}

function filterAuctions(auctions, filter) {
  return lodash.filter(auctions, filter);
}

server.get("/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  try {
    const workerPromises = [];
    for (let i = 0; i < THREAD_COUNT; i++) {
      workerPromises.push(createWorker());
    }

    const thread_results = await Promise.all(workerPromises);
    const total = lodash.union(
      thread_results[0],
      thread_results[1],
      thread_results[2],
      thread_results[3]
    );

    const asd = total.map((item) =>
      item.map((item) => {
        return {
          item_name: item.item_name,
          starting_bid: item.starting_bid,
          tier: item.tier,
        };
      })
    );

    // res.status(200).json(asd);

    asd[0].forEach((item) => {
      removeHigherPricedItems(asd[0], item);
    });

    const uniqueBin = lodash.uniqBy(asd[0], "item_name");

    // TO-DO: Add filter for reforges, stars and pets
    res.status(200).json(uniqueBin);
  } catch (err) {
    res.status(500).json(err.message);
    throw new Error(err);
  }
});

function removeHigherPricedItems(auctions, itemInAuction) {
  const currentItems = [];
  for (let i = 0; i < auctions.length; i++) {
    if (auctions[i].item_name === itemInAuction.item_name) {
      currentItems.push({
        item_name: auctions[i].item_name,
        starting_bid: auctions[i].starting_bid,
      });
    }
  }
  if (currentItems.length > 0) {
    let min = Math.min(...currentItems.map((item) => item.starting_bid));
    for (let i = 0; i < auctions.length; i++) {
      if (
        auctions[i].starting_bid > min &&
        auctions[i].item_name === itemInAuction.item_name
      ) {
        auctions.splice(i, 1);
      }
    }
  }
}

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
