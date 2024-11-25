let tickers = JSON.parse(localStorage.getItem("tickers")) || [];
let lastPrices = {};
let updateInterval = 15;
let counter = updateInterval;

function startUpdateCycle() {
  updatePrices();
  let countdown = setInterval(() => {
    counter--;
    $("#counter").text(counter);
    if (counter <= 0) {
      updatePrices();
      counter = updateInterval;
    }
  }, 1000);
}

$(document).ready(function () {
  // Populate the grid with tickers from local storage
  tickers.forEach((ticker) => {
    addTickerToGrid(ticker);
  });

  // Trigger form submission when Enter is pressed in the input field
  $("#new-ticker").on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission
      $("#add-ticker-form button[type='submit']").click();
    }
  });

  updatePrices();

  // Handle form submission to add new tickers
  $("#add-ticker-form").submit(function (e) {
    e.preventDefault();
    let newTicker = $("#new-ticker").val().toUpperCase();
    if (!newTicker.match(/^[A-Z]+$/)) {
      alert("Please enter a valid ticker symbol.");
      return;
    }
    if (!tickers.includes(newTicker)) {
      tickers.push(newTicker);
      localStorage.setItem("tickers", JSON.stringify(tickers));
      addTickerToGrid(newTicker);
    }
    $("#new-ticker").val("");
    updatePrices();
  });

  // Handle click event to remove tickers
  $("#tickers-grid").on("click", ".remove-btn", function () {
    let tickerToRemove = $(this).data("ticker");
    tickers = tickers.filter((t) => t !== tickerToRemove);
    localStorage.setItem("tickers", JSON.stringify(tickers));
    $(`#${tickerToRemove}`).remove();
  });

  startUpdateCycle();
});

function addTickerToGrid(ticker) {
  $("#tickers-grid").append(
    `<div id="${ticker}" class="stock-box">
        <h2>${ticker}</h2>
        <p id="${ticker}-price"></p>
        <p id="${ticker}-pct"></p>
        <button class="remove-btn" data-ticker="${ticker}">Remove</button>
    </div>`
  );
}

function updatePrices() {
  tickers.forEach((ticker) =>
    $.ajax({
      url: "/get_stock_data",
      type: "POST",
      data: JSON.stringify({ ticker: ticker }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        let changePercent =
          ((data.currentPrice - data.openPrice) / data.openPrice) * 100;
        let colorClass;
        if (changePercent <= -2) {
          colorClass = "dark-red";
        } else if (changePercent < 0) {
          colorClass = "red";
        } else if (changePercent === 0) {
          colorClass = "gray";
        } else if (changePercent <= 2) {
          colorClass = "green";
        } else {
          colorClass = "dark-green";
        }

        $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`);
        $(`#${ticker}-pct`).text(`${changePercent.toFixed(2)}%`);
        $(`#${ticker}-price`)
          .removeClass("dark-red red gray green dark-green")
          .addClass(colorClass);
        $(`#${ticker}-pct`)
          .removeClass("dark-red red gray green dark-green")
          .addClass(colorClass);

        let flashClass;
        if (lastPrices[ticker] > data.currentPrice) {
          flashClass = "red-flash";
        } else if (lastPrices[ticker] < data.currentPrice) {
          flashClass = "green-flash";
        } else {
          flashClass = "gray-flash";
        }

        lastPrices[ticker] = data.currentPrice;

        $(`#${ticker}`).addClass(flashClass);
        setTimeout(() => {
          $(`#${ticker}`).removeClass(flashClass);
        }, 1000);
      },
      error: function (xhr, status, error) {
        console.error(`Error fetching data for ${ticker}: ${error}`);
        alert(
          `Unable to fetch data for ${ticker}. Please check the ticker symbol.`
        );
      },
    })
  );
}
