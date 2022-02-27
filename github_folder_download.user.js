// ==UserScript==
// @name         GitHub 文件夹下载
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.5
// @description  为 GitHub 文件夹增加一个下载按钮，可以方便地下载某个文件夹
// @author       EricKwok
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://github.com/*
// @icon         https://i.loli.net/2021/03/30/ULV9XunaHesqGIR.png
// @run-at       document-idle
// @grant        none
// @license      GPLv3
// ==/UserScript==

// 记录页面宽度是否允许 GitHub 展开完整页面的变量
var isFold = false;


// 注入下载文件夹按钮
function injectDownloadFolderBtn() {
    if (document.querySelector('.github-folder-download')) return;
    if (isFold) {
        // 收起状态（移动端）
        let devider = document.querySelector("details.d-block > div > ul > li.dropdown-divider");
        if (devider) {
            let _html = `
            <li class="github-folder-download">
                <p style="padding:0px 8px 2px 10px; color:grey; margin:0; font-size:10px;">Download folder with...</p>
            </li>
            <li class="d-block d-md-none github-folder-download">
                <a class="dropdown-item" target="_blank" href="https://download-directory.github.io?url=${window.location.href}">
                    download-directory
                </a>
            </li >
            <li class="d-block d-md-none github-folder-download">
                <a class="dropdown-item" target="_blank" href="https://downgit.github.io/#/home?url=${window.location.href}">
                    DownGit
                </a>
            </li>
            <li class="d-block d-md-none dropdown-divider github-folder-download" role="none"></li>`;
            devider.insertAdjacentHTML("afterend", _html);
        }
    } else {
        // 展开状态（PC端）
        let html = document.querySelector(".btn.mr-2.d-none.d-md-block");
        if (html) {
            let _html = `
            <details data-view-component="true" class="details-overlay details-reset position-relative mr-2 github-folder-download">
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
                            <a class="d-flex flex-items-center color-text-primary text-bold no-underline" rel="noopener" target="_blank" href="https://download-directory.github.io?url=${window.location.href}">
                            With download - directory
                            </a >
                        </li >
                        <li class="Box-row Box-row--hover-gray p-3 mt-0">
                            <a class="d-flex flex-items-center color-text-primary text-bold no-underline" rel="noopener" target="_blank" href="https://downgit.github.io/#/home?url=${window.location.href}">
                                With DownGit
                            </a>
                        </li>
                    </ul >
                </div >
            </detials>`;
            html.insertAdjacentHTML("beforebegin", _html);
        }
    }
}

function removeAllInjectedElem() {
    document.querySelectorAll(".github-folder-download").forEach(elem => elem.remove());
}

function detectFoldUnfold() {
    if (document.body.clientWidth <= 767 && !isFold) {
        console.log("收起" + document.body.clientWidth);
        isFold = true;
    } else if (document.body.clientWidth > 767 && isFold) {
        console.log("展开" + document.body.clientWidth);
        isFold = false;
    }
}

function reinject() {
    if (document.querySelector(".file-navigation") && document.querySelector('[title="Go to parent directory"]')) {
        // 仅当处于文件夹内时注入按钮
        removeAllInjectedElem();
        injectDownloadFolderBtn();
    }
}

function main() {
    detectFoldUnfold();
    reinject();
}

(function () {
    'use strict';
    /**
     * 在浏览器窗口大小改变时自动重新定位设置菜单
     */
    window.onresize = function () {
        // 监听窗口大小改变
        main();
    }
    document.addEventListener('pjax:success', function () {
        // 由于 GitHub 使用 pjax 而不是页面跳转的方式在仓库内导航，因此将 main 函数绑定到 pjax 监听器上
        main();
    });
    main();
})();