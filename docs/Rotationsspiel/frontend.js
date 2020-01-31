let n;
let white_pos;

function toggleW() {
    if ($("#w-enabled").is(":checked")) {
        $(".w").removeAttr("disabled");
    } else {
        $(".w").attr("disabled", "true");
    }
}

function readInputs() {
    n = parseInt($(".n").val());
    if (n <= 2) {
        n = 3;
    }
    if (n >= 100) {
        n = 100;
    }
    if ($("#w-enabled").is(":checked")) {
        white_pos = parseInt($(".w").val());
        if (white_pos <= 0 || white_pos === Math.floor(n / 2)) {
            white_pos = 1;
        }
        if (white_pos >= n) {
            white_pos = n - 1;
        }
    } else {
        white_pos = undefined;
    }
}

function scale(new_size) {
    $("div.board-container").attr("style", "height: "+(new_size)+"em !important; margin-top:"+(new_size/2+2)+"em !important;");
    $("div.outer-board").attr("style", "margin: -" + new_size / 2 + "em !important; width: " + new_size + "em !important; height: " + new_size + "em !important");
    let old_size = new_size;
    new_size -= 4;
    translate = new_size / 2 - 1;
    $("div.realpin").each((_, e) => $(e).attr("style", $(e).attr("style").replace(/translate\((\d*)em\)/i, "translate(" + translate + "em)")));
    second_translate = (old_size + new_size) / 4;
    $("div.realslot").each((_, e) => $(e).attr("style", $(e).attr("style").replace(/translate\((\d*)em\)/i, "translate(" + second_translate + "em)")));
    $("div.board").attr("style", "margin: -" + new_size / 2 + "em !important; width: " + new_size + "em !important; height: " + new_size + "em !important");
}

function autoscale() {
    scale(n + 4 + (n <= 4 ? 2 : 0));
}

let translate = 4;
let second_translate = 6;

let to_be_cleared = new Set();
function timeout(func, secs) {
    let ti;
    ti = setTimeout(function () {
        func();
        to_be_cleared.delete(ti);
    }, secs);
    to_be_cleared.add(ti);
}

function animate_step(step, prev) {
    let rot = step > n / 2 ? step - n : step;
    let next = (prev + rot) % n;
    timeout(function () {
        let k = prev === 0 ? 0 : (n - prev);
        $(".pin" + k).addClass("thing-selected"); // Select thing
        timeout(function () {
            // Rotate
            $(".board").css("transform", "rotate(" + (360 / n * (prev + rot)) + "deg)");
            // Pin -> Slot & Slot -> Pin
            timeout(function () {
                let additional = ($(".pin" + k).hasClass("pin-white") ? " pin-white" : "");
                $(".pin" + k).removeClass("pin thing-selected pin" + k + additional).addClass("slot pinslot" + k);
                $(".slot" + step).removeClass("slot slot" + step).addClass("pin slotpin" + step + additional);
            }, 2000);
        }, 500);
    }, 10);
    return next;
}

function animateHistory(history) {
    let previous_turns = 0;
    let m = n;
    for (let i = 0; i < history.length; i++) {
        timeout(function () {
            let k = n - m;
            $(".pin" + k).addClass("thing-selected");
            timeout(function () {
                // Rotate
                let rot = history[i] > n / 2 ? history[i] - n : history[i];
                $(".board").css("transform", "rotate(" + (360 / n * (rot + previous_turns)) + "deg)");
                previous_turns += rot;
                // Pin -> Slot & Slot -> Pin
                timeout(function () {
                    let j = history[i];
                    let additional = ($(".pin" + k).hasClass("pin-white") ? " pin-white" : "");
                    $(".pin" + k).removeClass("pin thing-selected pin" + k + additional).addClass("slot pinslot" + k);
                    $(".slot" + j).removeClass("slot slot" + j).addClass("pin slotpin" + j + additional);
                    m += history[i];
                    m %= n;
                }, 2000);
            }, 500);
        }, (i + 0.3) * 3500);
    }
}

function prepare(last_p, last_b) {
    readInputs();
    for (let timeout_id of to_be_cleared) {
        clearTimeout(timeout_id);
    }
    to_be_cleared = new Set();
    $(".outer-board").removeClass("inactive").html('<div class="board"></div>');
    let board = "board";
    let t = translate + "em";
    for (let type of ["pin", "slot"]) {
        for (let i = 0; i < n; i++) {
            $("." + board).append("<div class='" + type + "-container'><div class='real" + type + " " + type + " " + type + "" + i + "' data-i='" + i + "'></div></div>");
            let deg = (i + 3 / 4 * n) % n / n * 360;
            $("." + type + i).css("transform", "rotate(" + deg + "deg) translate(" + t + ") rotate(-" + deg + "deg)").css("z-index", "" + (1 + i));
        }
        t = second_translate + "em";
        board = "outer-board";
    }
    if (last_p && last_b) {
        for (let i = 0; i < last_p.length; i++) {
            let elem = $(".pin" + i);
            if (last_p[i] === 0) {
                elem.removeClass("pin").addClass("slotpin slot");
            } else if (last_p[i] === 2) {
                elem.addClass("pin-special");
            } else if (last_p[i] === 3) {
                elem.addClass("pin-white");
            }
            elem = $(".slot" + i);
            if (last_b[i] === 1) {
                elem.removeClass("slot").addClass("slotpin pin");
            } else if (last_b[i] === 2) {
                elem.addClass("slot-special");
            }
        }
    } else {
        $(".pin" + Math.floor(n / 2)).addClass("pin-special");
        $(".slot0").addClass("slot-special");
        $(".pin" + white_pos).addClass("pin-white");
    }
    let last = 0;
    let score = 0;
    let [m_pins, m_board] = prepareGame(n, white_pos);
    if (last_p && last_b) {
        [m_pins, m_board] = [last_p, last_b];
    }
    let game_over = false;
    $(".outer-board:not(.inactive) > div > .slot").on("click", function (e) {
        var source = e.target || e.srcElement;
        let i = parseInt($(source).attr("data-i"));
        if (!game_over && isPossible(m_board, i)) {
            score++;
            if (endsGame(m_pins, i) || (needsToBeLast(m_pins, i) && score !== n - 2)) {
                game_over = true;
                let [c_pins, c_board] = [[...m_pins], [...m_board]];
                $("#reverse").on("click", function (e) {
                    prepare(c_pins, c_board);
                    $(".msg").html("Weiter gehts! <small>Punkte wurden zurückgesetzt.</small>");
                });
                $(".msg").html("Game over! <small>Punkte: " + score + "/" + (n - 1) + "</small>");
                $(".outer-board").addClass("inactive");
            }
            [m_pins, m_board] = applyShift(m_pins, m_board, i);
            m_board[i] = m_pins[i];
            m_pins[i] = 0;
            last = animate_step(i, last);
        }
    });
    autoscale();
}

function play() {
    $(".msg").html("Viel Spaß! <small>Zum Drehen die schwarzen Steckplätze anklicken.</small>");
    prepare();
}

function demonstrate() {
    $(".msg").html("Demonstration einer Lösung");
    prepare();
    animateHistory(bruteForce(n, false, white_pos)[0]);
}

prepare();