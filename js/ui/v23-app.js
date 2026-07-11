(function installNextChapterV23App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  function askNumber(message, fallback, options) {
    const opts = options || {};
    const raw = global.prompt(message, String(fallback == null ? 1 : fallback));
    if (raw == null) return null;
    const number = Number(String(raw).replaceAll(",", "").trim());
    if (!Number.isFinite(number) || number <= 0) throw new Error("Enter a number greater than zero.");
    if (opts.whole && !Number.isInteger(number)) throw new Error("Enter a whole number.");
    return number;
  }

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV23() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal) {
      if (this.modal.type === "v23-crypto") { this.modalRoot.innerHTML = NC.View.cryptoModal(this); return; }
      if (this.modal.type === "v23-business") { this.modalRoot.innerHTML = NC.View.businessModal(this); return; }
      if (this.modal.type === "v23-housing") { this.modalRoot.innerHTML = NC.View.housingModal(this); return; }
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV23(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const toggleKeys = ["cryptoAlwaysProfits", "cryptoNoFees", "businessAlwaysProfits", "landlordAlwaysOccupied", "socialAlwaysViral", "fameNeverDecays"];
    const customToggle = action === "dev-toggle" && toggleKeys.includes(button.dataset.key);
    const handled = new Set([
      "open-expansion", "crypto-buy", "crypto-sell", "business-start", "business-action",
      "rent-home", "end-lease", "landlord-buy", "landlord-action",
      "dev-crypto-holdings", "dev-crypto-boom", "dev-crypto-crash", "dev-v23-max", "dev-v23-clear"
    ]);
    if (!handled.has(action) && !customToggle) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "open-expansion") {
        const target = button.dataset.expansion;
        if (target === "crypto") this.modal = { type: "v23-crypto" };
        else if (target === "business") this.modal = { type: "v23-business" };
        else if (target === "housing") this.modal = { type: "v23-housing" };
        else throw new Error("That expansion is unavailable.");
        this.renderModal();
      } else if (action === "crypto-buy") {
        const coin = this.game.cryptoCoin(button.dataset.coin);
        if (!coin) throw new Error("That digital asset was not found.");
        const units = askNumber(`How many units of ${coin.name} (${coin.symbol}) do you want to buy?\nCurrent price: ${NC.Utils.formatMoney(coin.price, this.game.state.profile.currency)} per unit.`, 1);
        if (units == null) return;
        this.game.buyCrypto(coin.id, units);
      } else if (action === "crypto-sell") {
        const coin = this.game.cryptoCoin(button.dataset.coin);
        const holding = coin && this.game.cryptoHolding(coin.id);
        if (!coin || !holding) throw new Error("You do not own that digital asset.");
        const units = askNumber(`How many ${coin.symbol} units do you want to sell?\nYou own ${holding.units.toLocaleString(undefined, { maximumFractionDigits: 6 })}.`, holding.units);
        if (units == null) return;
        this.game.sellCrypto(coin.id, units);
      } else if (action === "business-start") {
        const type = this.game.businessType(button.dataset.type);
        if (!type) throw new Error("That business type was not found.");
        const requested = global.prompt(`Choose a name for your ${type.label}:`, `${this.game.state.profile.lastName} ${type.label}`);
        if (requested == null) return;
        this.game.startBusiness(type.id, requested);
      } else if (action === "business-action") {
        const kind = button.dataset.kind;
        if (kind === "sell" && !global.confirm("Sell this business? Its future annual income will end.")) return;
        this.game.businessAction(button.dataset.business, kind);
      } else if (action === "rent-home") {
        this.game.rentHome(button.dataset.home);
      } else if (action === "end-lease") {
        if (!global.confirm("End your current lease and move out?")) return;
        this.game.endLease();
      } else if (action === "landlord-buy") {
        this.game.buyLandlordProperty(button.dataset.type);
      } else if (action === "landlord-action") {
        const kind = button.dataset.kind;
        if (kind === "sell" && !global.confirm("Sell this rental property?")) return;
        this.game.landlordAction(button.dataset.property, kind);
      } else if (customToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        this.game.touch("dev-v23-toggle");
      } else if (action === "dev-crypto-holdings") {
        this.game.devAddCryptoHoldings(10000);
        this.toast("Crypto holdings added", "You received 10,000 units of every fictional digital asset.", "success");
      } else if (action === "dev-crypto-boom") {
        this.game.devMoveCryptoMarket(150);
        this.toast("Crypto moonshot", "Every fictional digital asset rose by 150%.", "success");
      } else if (action === "dev-crypto-crash") {
        this.game.devMoveCryptoMarket(-80);
        this.toast("Crypto crash", "Every fictional digital asset fell by 80%.", "success");
      } else if (action === "dev-v23-max") {
        this.game.devMaxV23Expansions();
        this.toast("v2.3 systems maximized", "Crypto, businesses, landlords, social media, and fame are ready for testing.", "success");
      } else if (action === "dev-v23-clear") {
        if (!global.confirm("Clear crypto holdings, businesses, leases, and landlord properties?")) return;
        this.game.devClearV23Expansions();
        this.toast("v2.3 expansions cleared", "Crypto, business, and housing systems were reset.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
