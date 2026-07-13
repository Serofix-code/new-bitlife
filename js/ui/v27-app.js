(function installNextChapterV27App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  function updateCreatorPreview(event) {
    const form = event.target && event.target.closest && event.target.closest("#creator-form");
    if (!form) return;
    const read = (name, fallback) => {
      const field = form.elements[name];
      if (!field) return fallback;
      if (typeof field.length === "number" && !field.tagName) {
        const checked = Array.from(field).find((item) => item.checked);
        return checked ? checked.value : fallback;
      }
      return field.value || fallback;
    };
    const draft = {
      firstName: read("firstName", "Unnamed"), lastName: read("lastName", ""),
      identity: read("identity", "nonbinary"), supernatural: read("supernatural", "human"),
      specialTalent: read("specialTalent", "none"), skin: read("skin", "#d8a47f"),
      hair: read("hair", "#4a3028"), eye: read("eye", "#49392f"), accent: read("accent", "#6a5acd"),
      hairStyle: read("hairStyle", "short"), accessory: read("accessory", "none")
    };
    const image = form.querySelector("#creator-avatar-preview");
    const name = form.querySelector("#creator-name-preview");
    if (image) image.src = NC.Utils.avatarSvg(Object.assign({}, draft, { style: draft.hairStyle, wizard: draft.supernatural === "wizard", vampire: draft.supernatural === "vampire" }));
    if (name) name.textContent = `${draft.firstName} ${draft.lastName}`.trim();
  }

  document.addEventListener("input", updateCreatorPreview, true);
  document.addEventListener("change", updateCreatorPreview, true);

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV27() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal && this.modal.type === "family-legacy") {
      this.modalRoot.innerHTML = NC.View.familyLegacyModal(this);
      return;
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV27(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    if (action === "age-up") {
      this.tab = "life";
      return previousHandleClick.call(this, event);
    }
    if (action !== "open-family-legacy") return previousHandleClick.call(this, event);
    event.preventDefault();
    if (!this.game) return;
    this.modal = { type: "family-legacy" };
    this.renderModal();
  };
})(window);
