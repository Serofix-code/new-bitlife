(function installNextChapterV21App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  function askShares(message, fallback) {
    const raw = global.prompt(message, String(fallback || 1));
    if (raw == null) return null;
    const shares = Math.floor(Number(String(raw).replaceAll(",", "")));
    if (!Number.isFinite(shares) || shares < 1) throw new Error("Enter a whole number of shares greater than zero.");
    return shares;
  }

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV21(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const customToggle = action === "dev-toggle" && ["investmentAlwaysProfits", "investmentNoFees", "revealInvestmentOutlook"].includes(button.dataset.key);
    const handled = new Set([
      "investment-buy", "investment-sell", "investment-research",
      "dev-investment-cash", "dev-investment-shares", "dev-investment-boom", "dev-investment-crash",
      "dev-investment-max", "dev-investment-clear"
    ]);
    if (!handled.has(action) && !customToggle) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "investment-buy") {
        const company = this.game.investmentCompany(button.dataset.company);
        if (!company) throw new Error("That company was not found.");
        const affordable = Math.max(1, Math.floor(this.game.state.finances.cash / Math.max(.01, company.price)));
        const shares = askShares(`How many shares of ${company.name} (${company.ticker}) do you want to buy?\nCurrent price: ${NC.Utils.formatMoney(company.price, this.game.state.profile.currency)} per share.`, Math.min(10, affordable));
        if (shares == null) return;
        this.game.buyInvestmentShares(company.id, shares);
      } else if (action === "investment-sell") {
        const company = this.game.investmentCompany(button.dataset.company);
        const holding = company && this.game.investmentHolding(company.id);
        if (!company || !holding) throw new Error("You do not own shares in that company.");
        const shares = askShares(`How many ${company.ticker} shares do you want to sell?\nYou own ${holding.shares.toLocaleString()}.`, holding.shares);
        if (shares == null) return;
        this.game.sellInvestmentShares(company.id, shares);
      } else if (action === "investment-research") {
        const report = this.game.researchInvestmentCompany(button.dataset.company);
        this.toast("Research complete", `${NC.Utils.cap(report.outlook)} outlook with ${report.confidence}% confidence.`, "success");
      } else if (customToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        this.game.touch("dev-investment-toggle");
      } else if (action === "dev-investment-cash") {
        this.game.devInvestmentCash(1000000);
        this.toast("Investment cash added", "One million common-base currency units were added.", "success");
      } else if (action === "dev-investment-shares") {
        this.game.devAddInvestmentShares(100);
        this.toast("Shares added", "You now own an additional 100 shares of every fictional company.", "success");
      } else if (action === "dev-investment-boom") {
        this.game.devMoveInvestmentMarket(50);
        this.toast("Market boom", "Every fictional company increased by 50%.", "success");
      } else if (action === "dev-investment-crash") {
        this.game.devMoveInvestmentMarket(-50);
        this.toast("Market crash", "Every fictional company decreased by 50%.", "success");
      } else if (action === "dev-investment-max") {
        this.game.devMaxInvestmentPortfolio();
        this.toast("Investment expansion maximized", "Cash, shares, outlooks, fees, and positive market testing are unlocked.", "success");
      } else if (action === "dev-investment-clear") {
        if (!global.confirm("Clear every holding, trade, research report, dividend record, and investment result?")) return;
        this.game.devClearInvestmentPortfolio();
        this.toast("Portfolio cleared", "The investment expansion has been reset for this life.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
