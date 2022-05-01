// ==UserScript==
// @name         아카라이브 이미지 미리보기 개선
// @namespace    아카라이브
// @version      1.6
// @description  아카라이브 이미지 미리보기 좆같은 것 ㅇㅈ? ㅇㅇㅈ 이미지 강제로 크게 만들어버리기~
// @updateURL    https://raw.githubusercontent.com/cho7052002/tampermonkey/main/arcalive_preview.js
// @author       ggumdori
// @match        http*://*.arca.live/b/*
// @match        http*://arca.live/b/*
// @grant        none
// ==/UserScript==
/*
히스토리
0.1:
    헬로 월드!
1.1:
    파폭에서 동작하도록 수정
    이미지 크기가 목록 옆칸까지 되도록 수정
    화면크기 조절시 이미지 크기도 조절됨
1.2:
    이미지 미리보기를 오른쪽으로 옮김
    화면이 줄어들면 기존 이미지 보기처럼 바뀌고, 크기는 3배, 고해상도
1.3:
    최적화
    updateUrl 추가
1.4:
    사이드바를 왼쪽으로 옮김
    이미지 미리보기를 왼쪽으로 옮김
    마이너한 버그 수정
1.5:
    맨 아래에 Base 64 Decoder 추가
1.6:
    미리보기 이미지가 2개씩 나오도록 수정
*/

(function() {
    'use strict';
    let popupPreviewSize = 300;
    let debug = true;
    let throttleInterval = 100;


    function lolog(type, o) {
        if(debug) {
            console.log('[' + type + ']: ' + o);
        }
    }
    function log(o) {
        console.log(o)
    }

    let THROTTLE;
    let throttleFunction = function (func, delay) {
        if (THROTTLE) {
            return
        }
        THROTTLE = setTimeout(function () {
            func()
            THROTTLE = undefined;
        }, delay)
    }

    //이미지를 리스트용 프리뷰에서 원본 이미지로 바꾼다.
    function imgSrcUpdate() {
        let previewCount = document.querySelectorAll('.vrow-preview').length;
        let elements = document.querySelectorAll('.vrow-preview > img');
        if(elements.length != previewCount) {
            lolog('imgSrcUpdate', previewCount + 'expected ' + previewCount + ' but ' + elements.length + ', failed!');
            setTimeout(() => {imgSrcUpdate(previewCount)}, 100);
            return;
        }
        elements.forEach(i => {
            //data-lazy-src for firefox support
            if(i.getAttribute('data-lazy-src') === null) {
                i.src = i.getAttribute('src').replaceAll('?type=list', '');
            } else {
                i.src = i.getAttribute('data-lazy-src').replaceAll('?type=list', '');
                i.setAttribute('data-lazy-src', i.src);
            }
        });
    }

    //기존 프리뷰 이미지를 삭제하고 프리뷰 이미지를 2개 추가한다
    function addSecondPreviewImage() {
        let previewList = document.querySelectorAll('.vrow-preview');

        let parser = new DOMParser();
        let docType = 'text/html';

        previewList.forEach(preview => {

            while(preview.firstChild) {
                preview.removeChild(preview.firstChild);
            }

            fetch(preview.closest('.vrow').href)
                .then(response => response.text())
                .then(htmlText => {
                    let doc = parser.parseFromString(htmlText, docType);
                    let images = doc.querySelector('.article-body').querySelectorAll('img');
                    let previewDiv = document.createElement('div');
                    previewDiv.style.height = '100%';
                    previewDiv.style.width = '100%';
                    previewDiv.style.display = "grid";
                    previewDiv.style.gridTemplateColumns = '1fr';

                    for(let i = 0; i < 2; i++) {
                        if(images[i] === undefined) {
                            continue;
                        }

                        let imgElement = document.createElement('img');
                        imgElement.src = images[i].src;
                        let imgDiv = document.createElement('div');
                        imgDiv.style.overflow = 'auto';
                        imgDiv.appendChild(imgElement);
                        imgDiv.style.padding = '2px';
                        previewDiv.appendChild(imgDiv);
                    }
                    preview.appendChild(previewDiv);
                })
        })
    }

    let oldLeft;
    let oldNavBottom;
    let isPreviousPopup = false;

    function previewResize() {
        let previewElements = document.querySelectorAll('.vrow-preview');

        let left = document.querySelector('article').getBoundingClientRect().left - 75;
        let isPopup = left < popupPreviewSize;
        lolog('previewResize', 'left: ' + left);
        lolog('previewResize', 'oldLeft: ' + oldLeft + '\n' +
              'left: ' + left);
        //set preview position to above the board list
        if(isPopup) {
            if(!isPreviousPopup) {
                previewElements.forEach(i => {
                    i.style.position = 'absolute';
                    i.style.width = popupPreviewSize + 'px';
                    i.style.height = popupPreviewSize + 'px';
                    i.style.left = '';
                    i.style.top = 'calc(-' + popupPreviewSize + 'px - 15px)';
                });
                lolog('previewResize', 'popup preview called');
            } else {
                lolog('previewResize', 'popup preview skipped');
            }
        } else {
            //set preview position to left
            let navBottom = document.querySelector('.navbar-wrapper').getBoundingClientRect().bottom;
            navBottom = navBottom > 0 ? navBottom : 0;
            lolog('previewResize', 'oldNavBottom: ' + oldNavBottom + '\n' +
                      'navBottom: ' + navBottom + '\n')
            if(oldNavBottom != navBottom || oldLeft != left) {
                document.querySelectorAll('.vrow-preview').forEach(i => {
                    i.style.position = 'fixed';
                    i.style.width = left + 'px';
                    i.style.height = 'calc(100vh - ' + navBottom + 'px)';
                    i.style.left = '0px';
                    i.style.top = navBottom + 'px';
                });
                lolog('previewResize', 'left preview called');
            }else {
                lolog('previewResize', 'left preview skipped');
            }
            oldNavBottom = navBottom;
        }
        oldLeft = left;
        isPreviousPopup = isPopup;
    }

    function sidebarToLeft() {
        let sidebar = document.querySelector('.right-sidebar')
        sidebar.style.float = 'left';
        sidebar.style.paddingLeft = '0.75rem';
        sidebar.style.paddingRight = '0.75rem';

        let article = document.querySelector('.board-article');
        article.style.paddingRight = '0px';
        article.style.marginRightLeft = '0px';
        article.style.margin = '0px';
    }

    function addBase64Decoder() {
        let myDiv = document.createElement('div');
        document.body.appendChild(myDiv);
        myDiv.style.display = 'flex';
        myDiv.style.bottom = '20px';
        myDiv.style.position = 'fixed'
        myDiv.style.width = '300px';
        //myDiv.style.height = '50px';
        myDiv.style.left = '20px';
        myDiv.style.border = '1px solid';
        myDiv.style.borderColor = '#bbb';
        myDiv.style.backgroundColor = '#FFFFFF';
        myDiv.style.padding = '.5rem';
        myDiv.style.zIndex = '999';

        let textInput = document.createElement('input');
        textInput.style.display = 'flex';
        textInput.style.flex = '1';
        textInput.style.marginRight = '.5rem';
        textInput.style.border = '1px solid';
        textInput.style.borderColor = '#bbb';
        myDiv.appendChild(textInput);

        let button = document.createElement('a');
        button.classList.add('btn');
        button.classList.add('btn-arca');
        button.classList.add('btn-sm');
        button.padding = '.5rem';
        button.innerText = '버튼';
        myDiv.appendChild(button);

        button.onclick = function(){
            textInput.value = atob(textInput.value);
        };
    }

    sidebarToLeft();

    addSecondPreviewImage();

    //imgSrcUpdate();
    previewResize();
    addBase64Decoder();
    window.addEventListener('resize', () => {
        throttleFunction(previewResize, 100);
    });
    window.addEventListener('scroll', () => {
        throttleFunction(previewResize, 100);
    });
})();
