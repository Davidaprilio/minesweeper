const mainBoard = document.querySelector('main')
const bomCountEl = document.querySelector('#bom-count')
const BOOM = '💥'

function makeBox() {
    return makeHtmlToDOM(`<div class="box close"></div>`)
}

function createBoard(w, h) {
    mainBoard.innerHTML = ''
    for (let ih = 0; ih < h; ih++) {
        const r = makeEl('div', 'row')
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

newGame(10, 15, 10)

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
    if(valueData[y][x] === 0) {
        getBox(x-1, y)?.click() // m- 
        getBox(x+1, y)?.click() // m+

        if (valueData[y-1]) getBox(x, y-1)?.click() // t
        if (valueData[y+1]) getBox(x, y+1)?.click() // b

    } else {
        // cek kanan kiri ada 0 tidak
        if (valueData[y][x+1] === 0) {
            // jika t+ bernilai
            if (valueData[y-1] && valueData[y-1][x+1] > 0) getBox(x, y-1)?.click()
            // jika b+ bernilai
            if (valueData[y+1] && valueData[y+1][x+1] > 0) getBox(x, y+1)?.click()
        }
        if (valueData[y][x-1] === 0) {
            // jika t- bernilai
            if (valueData[y-1] && valueData[y-1][x-1] > 0) getBox(x, y-1)?.click()
            // jika b- bernilai
            if (valueData[y+1] && valueData[y+1][x-1] > 0) getBox(x, y+1)?.click()
        }
    }
}

function getBox(x = 2, y = 8, query = '.close') {
    return document.querySelector(`.row:nth-child(${y+1}) > .box${query}:nth-child(${x+1})`)
}

const random = (min, max) => (Math.round(Math.random() * max) + min)

function showAllBom() {
    valueData.forEach((r,ir) => {
        r.forEach((c,ic) => {
            if (c === '×') {
                const el = getBox(ic, ir)
                if (el && !el.classList.contains('mark')) {
                    setTimeout(() => {
                        el.innerText = BOOM
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
    for (const key in valueData) {
        valueData[key].forEach((c,ic) => {
            if (c === '×') {
                const el = getBox(ic, key, '')
                if (el) {
                    el.innerText = BOOM
                }
            }
        })
        await sleep(300)
    }
}

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

mainBoard.addEventListener('click', function (e) {
    if (e.target.className === 'box close') {
        const boxs = document.querySelectorAll('.box')
        const indexBox = Object.values(boxs).indexOf(e.target)
        const {y, x} = getCoordinate(indexBox, blueprint[0].length)

        if (valueData[y][x] === '×') {
            e.target.innerText = BOOM
            e.target.classList.add('wrong')
            boxs.forEach(el => el.classList.add('end'))
            showAllBom()
            setTimeout(() => {
                alert('Yah, kamu kena Bom')
                newGame(10, 15, 10)
            }, 1_200);
            return false
        }


        // console.log({x,y}, valueData[y][x]);
        e.target.innerText = valueData[y][x] === 0 ? '' : valueData[y][x];
        e.target.classList.remove('close')
        e.target.classList.add('open')
        e.target.dataset.value = valueData[y][x]

        autoOpen(x, y)

        bomCountEl.innerText = document.querySelectorAll('.box.close').length;
        if (bomCountEl.innerText == bomCount) {
            animateWin().then(() => alert('Yeah kamu menang'))
        }
    }
})

mainBoard.addEventListener('contextmenu', function(e) {
    e.preventDefault()
    if (e.target.classList.contains('box')) {
        e.target.classList.toggle('mark')
    }
})