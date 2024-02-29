const mainBoard = document.querySelector('main')
const bomCountEl = document.querySelector('#bom-count')

const myModal = new bootstrap.Modal(document.getElementById("modalStart"));
const temStartGame = document.getElementById("start-game");
const temEndGame = document.getElementById("end-game");
const contentMenu = document.getElementById("content-menu");
let optGamePlay = {}

const BOOM_EXPLODE = '💥'
const BOOM = '💣'
const RED_FLAG = '🚩'

function makeBox() {
    return makeHtmlToDOM(`<div class="box close"></div>`)
}

function createBoard(w, h) {
    mainBoard.innerHTML = ''
    for (let ih = 0; ih < h; ih++) {
        const r = makeEl('div', 'row-box')
        for (let i = 0; i < w; i++) {
            r.appendChild(makeBox())
        }
        mainBoard.appendChild(r)
    }
}

function makeEl(type, className) {
    const d = document.createElement(type)
    if (className) {
        d.classList.add(className.split(' '))
    }
    return d
}

function makeHtmlToDOM(html) {
    const d = document.createElement('div')
    d.innerHTML = html
    return d.firstElementChild
}

function makeData(w, h, bom) {
    const t = w * h
    let d = _.shuffle([
        ...Array.from({ length: t - bom }, _ => 1),
        ...Array.from({ length: bom }, _ => 0),
    ])

    let row = []
    for (let i = 0; i < h; i++) {
        var tmp = d.splice(w)
        row.push(d)
        d = tmp
    }
    return row
}

function createValueBox(data) {
    // only find 0/bom and add value box around
    // return new array 0=emptyBox, -2=bom, 1-8=value
    let row = data.map(r => r.map(a => a - 1))
    // |t-|t |t+|
    // |m-|m |m+|
    // |b-|b |b+|
    row.forEach((r, rm) => {
        let loop = true
        while (loop) {
            const iBom = row[rm].findIndex(a => a === -1)
            if (iBom >= 0) {
                const niBom = iBom - 1
                const piBom = iBom + 1
                const rt = rm - 1
                if (row[rt]) {
                    if (row[rt][iBom] >= 0) row[rt][iBom]++ // t 
                    if (row[rt][niBom] >= 0) row[rt][niBom]++ // t- 
                    if (row[rt][piBom] >= 0) row[rt][piBom]++  // t+
                }

                // ganti agar tidak diambil lagi
                row[rm][iBom] = '×' // m 
                if (row[rm][niBom] >= 0) row[rm][niBom]++ // m- 
                if (row[rm][piBom] >= 0) row[rm][piBom]++  // m+

                const rb = rm + 1
                if (row[rb]) {
                    if (row[rb][iBom] >= 0) row[rb][iBom]++ // b 
                    if (row[rb][niBom] >= 0) row[rb][niBom]++ // b- 
                    if (row[rb][piBom] >= 0) row[rb][piBom]++  // b+
                }
            } else {
                loop = false
            }
        }
    })
    return row
}

function logBlueprint(data) {
    console.log(data.map(r => r.join('  ')).join('\n'))
}

let blueprint = []
let valueData = []
let bomCount = 0

function newGame(w, h, b) {
    createBoard(w, h)
    blueprint = makeData(w, h, b)
    valueData = createValueBox(blueprint)
    bomCountEl.innerText = 0
    bomCount = b

    logBlueprint(blueprint)
    logBlueprint(valueData)
}

function getCoordinate(pos, w) {
    pos++
    const val = pos / w
    if (Number.isInteger(val)) return {y: val-1, x: w-1}
    return {
        y: Math.floor(val),
        x: (pos - (Math.floor(val) * w)) - 1
    }
}

function autoOpen(x,y) {

    function openBoxIfExist(x, y) {
        let el = getBox(x, y)
        if (el) {
            handleClickBox(el)
        }
    }

    if(valueData[y][x] === 0) {
        openBoxIfExist(x-1, y) // m-
        openBoxIfExist(x+1, y) // m+

        if (valueData[y-1]) openBoxIfExist(x, y-1) // t
        if (valueData[y+1]) openBoxIfExist(x, y+1) // b

    } else {
        // cek kanan kiri ada 0 tidak
        if (valueData[y][x+1] === 0) {
            // jika t+ bernilai
            if (valueData[y-1] && valueData[y-1][x+1] > 0) openBoxIfExist(x, y-1)
            // jika b+ bernilai
            if (valueData[y+1] && valueData[y+1][x+1] > 0) openBoxIfExist(x, y+1)
        }
        if (valueData[y][x-1] === 0) {
            // jika t- bernilai
            if (valueData[y-1] && valueData[y-1][x-1] > 0) openBoxIfExist(x, y-1)
            // jika b- bernilai
            if (valueData[y+1] && valueData[y+1][x-1] > 0) openBoxIfExist(x, y+1)
        }
    }
}

function getBox(x = 2, y = 8, query = '.close') {
    return document.querySelector(`.row-box:nth-child(${y+1}) > .box${query}:nth-child(${x+1})`)
}

const random = (min, max) => (Math.round(Math.random() * max) + min)

function showAllBom() {
    valueData.forEach((r,ir) => {
        r.forEach((c,ic) => {
            if (c === '×') {
                const el = getBox(ic, ir)
                if (el && !el.classList.contains('mark')) {
                    setTimeout(() => {
                        el.innerText = BOOM_EXPLODE
                        el.classList.add('wrong')
                    }, random(100, 900));
                }
            }
        })
    })
    // unmark yang telah di mark tapi bukan bom
    const boxs = document.querySelectorAll('.box')
    const marks = document.querySelectorAll('.box.mark')
    marks.forEach((el) => {
        const indexBox = Object.values(boxs).indexOf(el)
        const {y, x} = getCoordinate(indexBox, blueprint[0].length)
        if (valueData[y] && valueData[y][x] !== '×') {
            setTimeout(() => {
                el.classList.remove('mark')
            }, random(100, 900));
        }
    })
}

async function animateWin() {
    valueData.forEach((r,ir) => {
        r.forEach((c,ic) => {
            if (c === '×') {
                const el = getBox(ic, ir)
                if (el && !el.classList.contains('mark')) {
                    setTimeout(() => {
                        el.innerText = BOOM
                        el.classList.add('safe')
                    }, random(100, 900));
                }
            }
        })
    })
    // unmark yang telah di mark tapi bukan bom
    const boxs = document.querySelectorAll('.box')
    const marks = document.querySelectorAll('.box.mark')
    marks.forEach((el) => {
        const indexBox = Object.values(boxs).indexOf(el)
        const {y, x} = getCoordinate(indexBox, blueprint[0].length)
        if (valueData[y] && valueData[y][x] !== '×') {
            setTimeout(() => {
                el.classList.remove('mark')
            }, random(100, 900));
        }
    })
}

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

mainBoard.addEventListener('click', function (e) {
    handleClickBox(e.target)
})

function handleClickBox(el) {
    if (el.className === 'box close') {
        const boxs = document.querySelectorAll('.box')
        const indexBox = Object.values(boxs).indexOf(el)
        const {y, x} = getCoordinate(indexBox, blueprint[0].length)

        if (valueData[y][x] === '×') {
            el.innerText = BOOM_EXPLODE
            el.classList.add('wrong')
            boxs.forEach(el => el.classList.add('end'))
            showAllBom()
            setTimeout(() => {
                setViewEndGame({
                    title: "Game Over",
                    reason: "You lose, clicked bom"
                })
                myModal.show()
            }, 1_200);
            return false
        }


        // console.log({x,y}, valueData[y][x]);
        el.innerText = valueData[y][x] === 0 ? '' : valueData[y][x];
        el.classList.remove('close')
        el.classList.add('open')
        el.dataset.value = valueData[y][x]

        autoOpen(x, y)

        bomCountEl.innerText = document.querySelectorAll('.box.close').length;
        if (bomCountEl.innerText == bomCount) {
            animateWin().then(() => {
                setViewEndGame({
                    title: "Game Win",
                    reason: "wow, you managed to avoid all the mines"
                })
                myModal.show()
            })
        }
    }
}

mainBoard.addEventListener('contextmenu', function(e) {
    e.preventDefault()
    if (e.target.classList.contains('box')) {
        e.target.classList.toggle('mark')
    }
    e.target.innerText = (e.target.classList.contains('mark')) ? RED_FLAG : ''
})

newGame(6, 8, 10)

function setToContentMenu(templateEl) {
    contentMenu.innerHTML = ""
    const clonedEl = templateEl.cloneNode(true).content;
    contentMenu.appendChild(clonedEl)
}

function setTextById(id, text) {
    document.getElementById(id).textContent = text
}

function setViewStartGame() {
    setToContentMenu(temStartGame)
}

function getOptionGamePlay() {
    let difficulty = document.getElementById("difficulty").value
    let minute = 60
    let seconds = 1000
    let boardSize = [9, 9]
    let bomCount = 0
    isCustom = false

    switch (difficulty) {
        case "easy":
            boardSize = [9, 9]
            bomCount = 10
            seconds = 0
            break
        case "medium":
            boardSize = [16, 16]
            bomCount = 40
            seconds = 0
            break
        case "hard":
            boardSize = [16, 30]
            bomCount = 99
            seconds = minute * 5
            break
        case "expert":
            boardSize = [30, 16]
            bomCount = 99
            seconds = minute * 10
            break
        case "extreme":
            boardSize = [30, 30]
            bomCount = 99
            seconds = minute * 20
            break
        default:
            const boardSizeX = parseInt(document.getElementById("board-size-x").value)
            const boardSizeY = parseInt(document.getElementById("board-size-y").value)
            difficulty = 'custom'
            bomCount = parseInt(document.getElementById("bom-count").value)
            seconds = parseInt(document.getElementById("time").value)
            boardSize = [boardSizeX, boardSizeY]
            isCustom = true
            break
    }

    optGamePlay = {
        difficulty,
        boardSize,
        bomCount,
        isCustom,
        seconds,
    }
    return optGamePlay
}

function setViewEndGame({title, reason}) {
    setToContentMenu(temEndGame)
    setTextById("end-reason-title", title)
    setTextById("end-reason-desc", reason)
}

setViewStartGame()
renderOptionGamePlay()
myModal._element.addEventListener('shown.bs.modal', async function () {
    while (true) {
        const selEl = document.querySelector('#difficulty')
        if (selEl) {
            selEl.value = optGamePlay.difficulty
            break
        }
        await sleep(100)
    }
})
myModal.show();

$('#modalStart').on('click', '#restart-game', function (e) {
    setViewStartGame()
})

$('#modalStart').on('click', '#start-game', function (e) {
    getOptionGamePlay()
    newGame(
        optGamePlay.boardSize[0], 
        optGamePlay.boardSize[1], 
        optGamePlay.bomCount
    )
    setTextById('difficulty-game-run', optGamePlay.difficulty)
    setTextById('time-game-run', optGamePlay.seconds)
    setTextById('board-game-run', (optGamePlay.boardSize || [6, 8]).join(' X '))
    setTextById('bom-game-run', optGamePlay.bomCount)
    myModal.hide();
})

function renderOptionGamePlay(opt) {
    if (opt === undefined) {
        opt = getOptionGamePlay()
    }
    setTextById('board-size', opt.boardSize.join(' X '))
    setTextById('time-play', opt.seconds == 0 ? '∞' : opt.seconds)
    setTextById('bow-count', opt.bomCount)
}

$('#modalStart').on('change', '#difficulty', function (e) {
    renderOptionGamePlay(optGamePlay)
})
