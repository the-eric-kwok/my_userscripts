// ==UserScript==
// @name         在 GitHub1s 中浏览代码
// @description  为 GitHub 文件夹增加一个按钮，可以方便地在 GitHub1s 中浏览代码
// @author       EricKwok
// @version      0.2
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://github.com/*
// @icon         https://i.loli.net/2021/03/30/ULV9XunaHesqGIR.png
// @run-at       document-idle
// @grant        none
// @license      GPLv3
// ==/UserScript==


// 值为真时，GitHub 不展示完整页面，而是一个类似于手机版的简化页面
var isFold = false;

function removeAllInjectedElem() {
    document.querySelectorAll(".github-open-in-github1s").forEach(elem => elem.remove());
}

function injectBesideRawBtn() {
    console.log("inject beside raw btn");
    let html = document.querySelector("#raw-url");
    if (html) {
        let _html = `<a class="js-permalink-replaceable-link btn-sm btn BtnGroup-item github-open-in-github1s">
            View in GitHub1s 
        </a>`
        html.insertAdjacentHTML("beforebegin", _html);
    }
}

function injectBesideGoToFileBtn() {
    let html = document.querySelector(".btn.mr-2.d-none.d-md-block");
    if (html) {
        let _html = `
        <details data-view-component="true" class="details-overlay details-reset position-relative mr-2 github-open-in-github1s">
            <summary role="button" data-view-component="true">
                <span class="btn d-none d-md-flex flex-items-center">
                    View in GitHub1s
                </span>
            </summary>
        </details>`;
        html.insertAdjacentHTML("beforebegin", _html);
    }
}

function injectBesideCodeBtn() {
    let html = document.querySelector("get-repo");
    console.log(html);
    if (html) {
        let _html = `
        <details data-view-component="true" class="details-overlay details-reset position-relative mr-2 github-open-in-github1s">
            <summary role="button" data-view-component="true">
                <span class="btn d-none d-md-flex flex-items-center">
                    View in GitHub1s
                </span>
            </summary>
        </details>`;
        html.insertAdjacentHTML("beforebegin", _html);
    }
}

function reinject() {
    if (document.querySelector("get-repo")) {
        // 当处于项目首页时在 Go To File 按钮旁边注入按钮
        removeAllInjectedElem();
        injectBesideCodeBtn();
    } else if (document.querySelector("#raw-url")) {
        // 当处于打开的文件中时在 Raw 按钮的旁边注入按钮
        removeAllInjectedElem();
        injectBesideRawBtn();
    } else if (document.querySelector(".file-navigation") && document.querySelector('[title="Go to parent directory"]')) {
        // 当处于文件夹内时在 Go To File 按钮旁边注入按钮
        removeAllInjectedElem();
        injectBesideGoToFileBtn();
    }
    document.querySelectorAll(".github-open-in-github1s").forEach(elem => {
        elem.addEventListener("click", openGithub1s);
    })
}

function openGithub1s() {
    window.open(location.href.replace(/github\.com/g, "github1s.com"));
}

function main() {
    reinject();
}

(function () {
    'use strict';
    let oldPushState = history.pushState;
    history.pushState = function pushState() {
        let ret = oldPushState.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    };

    let oldReplaceState = history.replaceState;
    history.replaceState = function replaceState() {
        let ret = oldReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
    };

    window.addEventListener('popstate', () => {
        window.dispatchEvent(new Event('locationchange'));
    });
  
    document.addEventListener('pjax:success', function () {
        // 由于 GitHub 使用 pjax 而不是页面跳转的方式在仓库内导航，因此将 main 函数绑定到 pjax 监听器上
        window.dispatchEvent(new Event('locationchange'));
    });
    window.addEventListener('locationchange', function () {
        console.log('locationchange!');
        main();
    });
    main();
})();
