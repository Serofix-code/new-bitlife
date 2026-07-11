(function installUtilities(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils = {};

  U.clamp = function clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  };

  U.int = function int(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  };

  U.deepClone = function deepClone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };

  U.uid = function uid(prefix) {
    let token;
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      token = global.crypto.randomUUID().replaceAll("-", "").slice(0, 14);
    } else {
      token = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }
    return `${prefix || "id"}_${token}`;
  };

  U.hashSeed = function hashSeed(input) {
    const text = String(input || "next-chapter");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 0x9e3779b9;
  };

  U.random = function random(rng) {
    let x = (rng && rng.seed ? rng.seed : 0x9e3779b9) >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    if (rng) {
      rng.seed = x >>> 0;
      rng.step = (rng.step || 0) + 1;
    }
    return (x >>> 0) / 4294967296;
  };

  U.randomInt = function randomInt(rng, min, max) {
    return Math.floor(U.random(rng) * (max - min + 1)) + min;
  };

  U.pick = function pick(rng, values) {
    if (!values || !values.length) return null;
    return values[Math.floor(U.random(rng) * values.length)];
  };

  U.weightedPick = function weightedPick(rng, values, getWeight) {
    if (!values || !values.length) return null;
    const weights = values.map((item) => Math.max(0, Number(getWeight ? getWeight(item) : item.weight) || 1));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (!total) return U.pick(rng, values);
    let roll = U.random(rng) * total;
    for (let index = 0; index < values.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return values[index];
    }
    return values[values.length - 1];
  };

  U.escape = function escape(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  U.cleanName = function cleanName(value, fallback) {
    const cleaned = String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
    return cleaned || fallback || "Unnamed";
  };

  U.initials = function initials(firstName, lastName) {
    const first = Array.from(String(firstName || "?"))[0] || "?";
    const last = Array.from(String(lastName || ""))[0] || "";
    return (first + last).toLocaleUpperCase();
  };

  U.formatMoney = function formatMoney(value, currency) {
    const amount = Math.round(Number(value) || 0);
    const sign = amount < 0 ? "−" : "";
    return `${sign}${currency || "₡"}${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  U.formatDate = function formatDate(value) {
    if (!value) return "Unknown";
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    } catch (_) {
      return String(value);
    }
  };

  U.relativeTime = function relativeTime(value) {
    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
    if (!Number.isFinite(seconds) || seconds < 0) return "just now";
    if (seconds < 45) return "just now";
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
    return `${Math.round(seconds / 86400)}d ago`;
  };

  U.cap = function cap(value) {
    const text = String(value || "");
    return text ? text[0].toLocaleUpperCase() + text.slice(1) : text;
  };

  U.pronouns = function pronouns(identity) {
    const key = identity || "nonbinary";
    if (key === "woman") return { subject: "she", object: "her", possessive: "her", reflexive: "herself", label: "she/her", noun: "woman", childNoun: "girl" };
    if (key === "man") return { subject: "he", object: "him", possessive: "his", reflexive: "himself", label: "he/him", noun: "man", childNoun: "boy" };
    return { subject: "they", object: "them", possessive: "their", reflexive: "themself", label: "they/them", noun: "person", childNoun: "child" };
  };


  U.template = function template(text, state, extra) {
    const profile = state.profile || {};
    const p = U.pronouns(profile.identity);
    const values = Object.assign({
      firstName: profile.firstName || "You", lastName: profile.lastName || "",
      subject: p.subject, Subject: U.cap(p.subject), object: p.object, possessive: p.possessive,
      noun: state.age < 18 ? p.childNoun : p.noun, Noun: U.cap(state.age < 18 ? p.childNoun : p.noun), age: state.age
    }, extra || {});
    return String(text || "").replace(/\{([A-Za-z0-9_]+)\}/g, (_, key) => values[key] == null ? `{${key}}` : values[key]);
  };

  U.avatarSvg = function avatarSvg(avatar) {
    const a = avatar || {};
    const skin = a.skin || "#d8a47f", hair = a.hair || "#4a3028", accent = a.accent || "#6a5acd", eye = a.eye || "#49392f";
    const hairShape = a.style === "long" ? '<path d="M20 44c0-23 12-34 30-34s30 11 30 34v39H20z" fill="'+hair+'"/>' : a.style === "curly" ? '<circle cx="30" cy="27" r="17" fill="'+hair+'"/><circle cx="50" cy="20" r="18" fill="'+hair+'"/><circle cx="69" cy="29" r="16" fill="'+hair+'"/>' : '<path d="M24 39c2-20 13-29 27-29 16 0 27 11 28 31-13-8-36-8-55-2z" fill="'+hair+'"/>';
    const fangs = a.vampire ? '<path d="M43 65l4 9 3-9m4 0 3 9 4-9" fill="#fff" stroke="#fff" stroke-width="2"/>' : '';
    const wizardMark = a.wizard ? '<path d="M76 12l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.5-4.4 6.2-.9z" fill="#f6d365" stroke="#7d5b13" stroke-width="1.2"/>' : '';
    const accessories = { glasses: '<g fill="none" stroke="#222" stroke-width="3"><circle cx="39" cy="47" r="9"/><circle cx="61" cy="47" r="9"/><path d="M48 47h4M29 45l-6-3M71 45l6-3"/></g>', crown: '<path d="M30 23l8-12 12 11 12-11 8 12-4 10H34z" fill="#f5cc52" stroke="#9c7413" stroke-width="2"/>', bow: '<path d="M22 25q-13-11-13 4t13 4l7-4zm0 0q13-11 13 4t-13 4l-7-4z" fill="#e16b8c"/>', earrings: '<circle cx="24" cy="57" r="4" fill="#f5cc52"/><circle cx="76" cy="57" r="4" fill="#f5cc52"/>', hat: '<path d="M23 34h54l-8-22H31z" fill="#333"/><path d="M16 34h68" stroke="#333" stroke-width="7"/>', none: '' };
    const accessory = accessories[a.accessory] || '';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="28" fill="'+accent+'"/>'+hairShape+'<circle cx="50" cy="48" r="27" fill="'+skin+'"/><circle cx="40" cy="47" r="3.4" fill="'+eye+'"/><circle cx="60" cy="47" r="3.4" fill="'+eye+'"/><path d="M39 61q11 8 22 0" fill="none" stroke="#7b3d3d" stroke-width="3" stroke-linecap="round"/>'+fangs+wizardMark+accessory+'</svg>');
  };

  U.downloadText = function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})(window);
