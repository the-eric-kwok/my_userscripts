// ==UserScript==
// @name         bilibili 更多倍速
// @namespace    https://github.com/the-eric-kwok
// @version      0.1
// @description  为哔哩哔哩网页端启用更多播放倍速
// @author       EricKwok
// @match        *://*.bilibili.com/video/*
// @inject-at    document-idle
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let interval = setInterval(() => {
    let parent = document.querySelector(".bpx-player-ctrl-playbackrate-menu");
    if (parent) {
      clearInterval(interval);
      for (let i = 3; i <= 4; i++) {
        let elem = document.createElement('li');
        elem.setAttribute('class', 'bpx-player-ctrl-playbackrate-menu-item');
        elem.setAttribute('data-value', i.toString());
        elem.appendChild(document.createTextNode(`${i}.0x`));
        document.querySelector(".bpx-player-ctrl-playbackrate-menu").insertBefore(
          elem,
          parent.firstChild
        );
      }
    }
  }, 1000);
})();
