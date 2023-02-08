const axios = require("axios");
const { workerData, parentPort } = require("worker_threads");

let auctionsArray = [];

async function getTotalPages() {
  let totalPages = await axios
    .get(process.env.HYPIXEL_AUCTION_API)
    .then((response) => {
      return response.data.totalPages;
    })
    .catch((err) => {
      throw new Error(err, "getTotalPages");
    });
  return totalPages;
}

async function getAuctionPage(i) {
  const auction = await axios
    .get(`${process.env.HYPIXEL_AUCTION_API}?page=${i}`)
    .then((response) => {
      return response.data.auctions;
    })
    .catch((err) => {
      throw new Error(err, "getAuctiouns");
    });
  return auction;
}

// issues with load time
// needs multithreading
async function getAllAuctions() {
  auctionsArray = [];
  let pages = await getTotalPages();
  for (let i = 0; i < pages / workerData.thread_count; i++) {
    const auction = await getAuctionPage(i);
    auctionsArray.push(auction);
  }
}

passData = async () => {
  await getAllAuctions();
  parentPort.postMessage(auctionsArray);
};

passData();
