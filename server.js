const express = require("express");
const dotenv = require("dotenv");
const lodash = require("lodash");
const cors = require("cors");
const { Worker } = require("worker_threads");
const server = express();
dotenv.config();
cors();
const THREAD_COUNT = 4;

function createWorker(i) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__dirname + `/worker.js`, {
      workerData: { thread_count: THREAD_COUNT, id: i + 1 },
    });
    worker.on("message", (data) => {
      resolve(data);
    });
    worker.on("error", (err) => {
      reject(`An error occured ${err}`);
    });
  });
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
    res.status(200).send("alive");
  } catch (err) {
    res.status(500).send(err);
  }
});

server.get("/bin", async (req, res) => {
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
      workerPromises.push(createWorker(i));
    }

    const thread_results = await Promise.all(workerPromises);
    const total = [];
    total.push(...thread_results[0]);
    total.push(...thread_results[1]);
    total.push(...thread_results[2]);
    total.push(...thread_results[3]);

    const filteredArray = total.map((array) =>
      array.map((item) => {
        if (item === null) {
          lodash.remove(array, (item) => item === null || item === undefined);
        } else
          return {
            item_name: item.item_name,
            starting_bid: item.starting_bid,
            tier: item.tier,
          };
      })
    );

    const finalArray = lodash.flattenDeep(filteredArray);
    const sortedPriceAndArray = lodash
      .chain(finalArray)
      .sortBy("starting_bid")
      .uniqBy("item_name")
      .value();

    res.status(200).json(sortedPriceAndArray);
  } catch (err) {
    res.status(500).json(err.message);
    throw new Error(err);
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
