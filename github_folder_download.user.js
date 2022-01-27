// ==UserScript==
// @name         GitHub 文件夹下载
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.3
// @description  为 GitHub 文件夹增加一个下载按钮，可以方便地下载某个文件夹
// @author       EricKwok
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://github.com/*
// @icon         https://i.loli.net/2021/03/30/ULV9XunaHesqGIR.png
// @run-at       document-idle
// @grant        none
// @license      GPLv3
// ==/UserScript==

// 注入下载文件夹按钮
function injectDownloadFolderBtn() {
    if (document.querySelector('.EricKwok')) return;
    var html = document.querySelector(".btn.mr-2.d-none.d-md-block");
    if (!html) return;
    var _html = `
    <details data-view-component="true" class="details-overlay details-reset position-relative d-block mr-2 EricKwok">
    <summary role="button" data-view-component="true">
    <span class="btn d-none d-md-flex flex-items-center">
    Download folder
    <span class="dropdown-caret ml-1"></span>
    </span>
    <span class="btn d-inline-block d-md-none">
    <svg aria-label="More options" role="img" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-kebab-horizontal">
    <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
    </svg>
    </span>
    </summary>
    <div class="dropdown-menu dropdown-menu-sw" style="top:32px;width:220px;">
    <ul class="list-style-none">
    <li class="Box-row Box-row--hover-gray p-3 mt-0">
    <a class="d-flex flex-items-center color-text-primary text-bold no-underline" rel="noopener" target="_blank" href="https://download-directory.github.io?url=` + window.location.href + `">
    With download-directory
    </a>
    </li>
    <li class="Box-row Box-row--hover-gray p-3 mt-0">
    <a class="d-flex flex-items-center color-text-primary text-bold no-underline" rel="noopener" target="_blank" href="https://downgit.github.io/#/home?url=` + window.location.href + `">
    With DownGit
    </a>
    </li>
    </ul>
    </div>
    `;
    html.insertAdjacentHTML("beforebegin", _html);
}

function main() {
    if (document.querySelector(".file-navigation") && document.querySelector('[title="Go to parent directory"]')) {
        // 当不在仓库的根目录时注入按钮
        injectDownloadFolderBtn();
    }
}

(function () {
    'use strict';
    document.addEventListener('pjax:success', function () {
        // 由于 GitHub 使用 pjax 而不是页面跳转的方式在仓库内导航，因此将 main 函数绑定到 pjax 监听器上
        main();
    });
    main();
})();