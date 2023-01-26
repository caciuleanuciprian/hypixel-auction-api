import express from "express";
import dotenv from "dotenv";
import lodash from "lodash";
import axios from "axios";
import cors from "cors";

const server = express();
dotenv.config();
cors();

// fetch all auctions
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
  const auctions = await axios
    .get(process.env.HYPIXEL_AUCTION_API)
    .then((response) => {
      return response.data.auctions;
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
  const bin = filterAuctions(auctions, { bin: true });
  bin.forEach((item) => {
    removeHigherPricedItems(bin, item);
  });

  const uniqueBin = lodash.uniqBy(bin, "item_name");

  res.status(200).json(uniqueBin);
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

function filterAuctions(auctions, filter) {
  return lodash.filter(auctions, filter);
}

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
