/* Small DOM and media compatibility layer. Keep this file ES5-parseable. */
(function (window, document, navigator) {
  "use strict";

  window.console = window.console || { log: function () {}, warn: function () {}, error: function () {} };

  window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;

  var legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if (!navigator.mediaDevices) {
    try { navigator.mediaDevices = {}; } catch (ignore) {}
  }
  if (navigator.mediaDevices && !navigator.mediaDevices.getUserMedia && legacyGetUserMedia) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      return new Promise(function (resolve, reject) {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  if (window.Element && !Element.prototype.remove) {
    Element.prototype.remove = function () {
      if (this.parentNode) this.parentNode.removeChild(this);
    };
  }

  /* IE 10/11 ignore the second (force) argument of classList.toggle. */
  if (window.DOMTokenList) {
    var probe = document.createElement("div");
    probe.classList.toggle("compat-probe", false);
    if (probe.classList.contains("compat-probe")) {
      var nativeToggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function (token, force) {
        if (arguments.length > 1) {
          if (force) { this.add(token); return true; }
          this.remove(token); return false;
        }
        return nativeToggle.call(this, token);
      };
    }
  }

  var hasModernGrid = window.CSS && window.CSS.supports && window.CSS.supports("display", "grid");
  if (document.documentMode || !hasModernGrid) document.documentElement.className += " legacy-browser";

  if (window.cssVars) {
    window.cssVars({
      onlyLegacy: true,
      preserveStatic: false,
      watch: true,
      onError: function (message) { window.console.warn("CSS compatibility:", message); }
    });
  }
}(window, document, navigator));
