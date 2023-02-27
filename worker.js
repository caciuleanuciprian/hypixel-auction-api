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

async function getAllAuctions() {
  auctionsArray = [];
  let curr = Math.floor((await getTotalPages()) / workerData.thread_count);
  let pages =
    curr % workerData.thread_count === 0
      ? curr / workerData.thread_count
      : Math.floor(curr / workerData.thread_count);

  let pagesForWorker1 = pages;
  let pagesForWorker2 = pagesForWorker1 + pages;
  let pagesForWorker3 = pagesForWorker2 + pages;
  let pagesForWorker4 = pagesForWorker3 + pages;
  if (workerData.id === 1) {
    for (let i = 0; i < pagesForWorker1; i++) {
      const auction = await getAuctionPage(i);
      auctionsArray.push(auction);
    }
  }
  if (workerData.id === 2) {
    for (let i = pagesForWorker1; i < pagesForWorker2; i++) {
      const auction = await getAuctionPage(i);
      auctionsArray.push(auction);
    }
  }
  if (workerData.id === 3) {
    for (let i = pagesForWorker2; i < pagesForWorker3; i++) {
      const auction = await getAuctionPage(i);
      auctionsArray.push(auction);
    }
  }
  if (workerData.id === 4) {
    for (let i = pagesForWorker3; i < pagesForWorker4; i++) {
      const auction = await getAuctionPage(i);
      auctionsArray.push(auction);
    }
  }
}

async function removeNonBinItems(auctions) {
  for (let i = 0; i < auctions.length; i++) {
    if (auctions[i].bin == false) {
      auctions[i] = "";
    }
  }
}

passData = async () => {
  try {
    await getAllAuctions();
    auctionsArray.forEach(async (array) => await removeNonBinItems(array));
  } catch (err) {
    console.log(err);
  } finally {
    parentPort.postMessage(auctionsArray);
  }
};

passData();
