'use strict';

/* helpers */

function toBeMovedNext(pins, shift) {
    return pins[pins.length-shift];
}

function endsGame(pins, shift) {
    // if we rotate it so that there is nothing / blue pin next -> only = 1 allowed
    let tbm = toBeMovedNext(pins, shift);
    return tbm === 0 || tbm === 2;
}

function needsToBeLast(pins, shift) {
    let tbm = toBeMovedNext(pins, shift);
    return tbm === 3;
}

function isPossible(board, shift) {
    return board[shift] === 0;
}

function shiftArray(array, shift) {
    let new_array = [];
    for (let i=0; i < array.length; i++) {
        new_array[(i+shift)%array.length] = array[i];
    }
    return new_array;
}

function placePin(board, shift) {
    let new_board = [...board];
    new_board[shift] = 1;
    return new_board;
}

function applyShift(pins, board, shift) {
    let new_pins = shiftArray(pins, shift);
    let new_board = placePin(board, shift);
    return [new_pins, new_board];
}

function prepareGame(n, white_pos) {
    let pins = [];
    for (let i=0; i < n; i++) {
        pins.push(1);
    }
    pins[Math.floor(n/2)] = 2;
    if (typeof(white_pos) === "number") {
        pins[white_pos] = 3;
    }
    let board = [];
    for (let i=0; i < n; i++) {
        board.push(0);
    }
    board[0] = 2;
    return [pins, board];
}

/* Solve */

// Tries a history
function tryHistory(n, history, white_pos) {
    let [pins, board] = prepareGame(n, white_pos);
    for (let i=0; i < history.length; i++) {
        let shift = history[i];
        if (!isPossible(board, shift)) {
            return false;
        }
        if (endsGame(pins, shift)) {
            if (i === history.length-1) {
                return true;
            } else {
                return i;
            }
        }
        [pins, board] = applyShift(pins, board, shift);
        board[shift] = 1;
        pins[shift] = 0;
    }
    return undefined;
}

// Brute forces solutions
function bruteForce(n, find_all, white_pos) {
    let histories = [];
    function brute(pins, board, history) {
        if (!find_all && histories.length >= 1) {
            return;
        }
        if (history.length === n-1) {
            histories.push(history);
            return;
        }
        for (let shift=1; shift < n; shift++) {
            if (isPossible(board, shift)
                && (!endsGame(pins, shift) || history.length === n-2)
                && (!needsToBeLast(pins, shift) || history.length === n-3)) {
                let [new_pins, new_board] = applyShift(pins, board, shift);
                new_board[shift] = new_pins[shift];
                new_pins[shift] = 0;
                let new_history = [...history, shift];
                brute(new_pins, new_board, new_history);
            } else {
                //console.log(history.length);
            }
        }
    }
    let [pins, board] = prepareGame(n, white_pos);
    brute(pins, board, []);
    return histories;
}

// Compares two arrays
function arrayEquals(a1, a2) {
    if (a1.length !== a2.length) {
        return false;
    }
    for (let i=0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
}

// Finds clusters
let numCmp = (a, b) => a-b;
function clusters(group, subgroup) {
    let clusters = [];
    let last_one = true;
    let first_one = undefined;
    for (let i=0; i < group.length; i++) {
        if (group[i] === 2) {
            continue;
        }
        if (group[i] === subgroup) {
            if (first_one === undefined) {
                first_one = false;
            }
            if (last_one) {
                last_one = false;
                clusters.push(0);
            }
            clusters[clusters.length-1]++;
        } else {
            if (first_one === undefined) {
                first_one = true;
            }
            last_one = true;
        }
    }
    if (!first_one && !last_one && clusters.length !== 1) {
        clusters[0] += clusters.pop();
    }
    clusters.sort(numCmp);
    return clusters;
}

function groupRules(pins, board) {
    let pin_holes = clusters(pins, 0);
    let pin_clusters = clusters(pins, 1);
    let board_holes = clusters(board, 0);
    let board_clusters = clusters(board, 1);
    return arrayEquals(pin_holes, board_clusters) && arrayEquals(board_holes, pin_clusters);
}


function grouping(n, white_pos) {
    let [pins, board] = prepareGame(n, white_pos);
    let history = [1];
    let shift = 1;
    [pins, board] = applyShift(pins, board, shift);
    board[shift] = pins[shift];
    pins[shift] = 0;
    let histories = [];
    function groupIt(pins, board, hist) {
        if (hist.length === n-1) {
            histories.push(hist);
            return;
        }
        if (histories.length === 1) {
            return;
        }
        for (let shift=1; shift < n; shift++) {
            if (isPossible(board, shift) && (!endsGame(pins, shift) || hist.length === n-2) && (!needsToBeLast(pins, shift) || hist.length === n-3)) {
                var [new_pins, new_board] = applyShift(pins, board, shift);
                new_board[shift] = new_pins[shift];
                new_pins[shift] = 0;
                if (groupRules(new_pins, new_board)) {
                    groupIt(new_pins, new_board, [...hist, shift]);
                }
            }
        }
    }
    groupIt(pins, board, history);
    return histories;
}

function buildSimpleHistory(n) {
    let res = [];
    for (var i=1; i < n; i++) {
        res.push(i);
    }
    return res;
}

function rotLeft(i) {
    return i;
}

function rotRight(n, i) {
    return n-i;
}

function buildOtherSimpleHistory(n) {
    let res = [];
    for (var i=1; i < n; i++) {
        res.push(i%2 === n%2 ? rotRight(n, i):rotLeft(i));
    }
    return res;
}

// Ansatz: Optimierender Algorithmus; Starten mit Drehungen 1..n-1, vertauschen dann jeweils 2 s.d. weniger Kollisionen sind.

function countIssues(n, rot, min_issues, white_pos) {
    let issues = 0;
    let k = new Array(n);
    k[0] = true;
    k[Math.ceil(n/2)] = true;
    let d = 0;
    for (let i=0; i < rot.length-1; i++) {
        let r = rot[i];
        d += r;
        let x = d % n;
        if (x === white_pos && i < rot.length-2) {
            issues++;
        } else {
            if (k[x]) {
                issues++;
            } else {
                k[x] = true;
            }
        }
        if (issues > min_issues) {
            return issues;
        }
    }
    return issues;
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function optAlgo(n, white_pos) {
    let rot = buildSimpleHistory(n);
    shuffle(rot);
    let min_issues = countIssues(n, rot);
    while (min_issues !== 0) {
        for (let i=0; i < rot.length-1; i++) {
            for (let j=i+1; j < rot.length; j++) {
                let rot_copy = [...rot];
                let rot_copy_i = rot_copy[i];
                rot_copy[i] = rot_copy[j];
                rot_copy[j] = rot_copy_i;
                let new_issues = countIssues(n, rot_copy, min_issues, white_pos);
                if (new_issues <= min_issues) {
                    rot = rot_copy;
                    min_issues = new_issues;
                    if (min_issues === 0) {
                        return rot;
                    }
                }
            }
        }
    }
    return rot;
}

// Various tests

function testGrouping() {
    for (let i=1; i < 16; i++) {
        console.log("n="+i+": "+grouping(p+1).length);
    }
}

function testSimplyHistory() {
    for (let i=2; i < 10000; i*=2) {
        console.log("n="+i+": "+tryHistory(i, buildSimpleHistory(i)));
    }
}

function testBruteComplexity() {
    let arr = [];
    for (let i=1; i < 16; i++) {
        let start = new Date().getTime();
        let loes = bruteForce(i, true);
        let end = new Date().getTime();
        console.log("n="+i+", l="+loes.length+", t="+(end-start));
        arr.push({loes, time: (end-start)});
    }
    return arr;
}

function testWhitePinSolutions(n) {
    let arr = [];
    let endpos = new Array(n);
    for (let wp = 1; wp < n; wp++) {
        if (wp != Math.floor(n/2)) {
            let loes = bruteForce(n, true, wp);
            arr.push(loes.length);
            for (let hist of loes) {
                let h = hist[hist.length-1];
                endpos[h] = endpos[h] ? endpos[h]+1:1;
            }
        }
    }
    return arr;
}