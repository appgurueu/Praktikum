let rect_colors = {};
function showPacking(packing, u) {
    $(".unit-square-" + u).html("");
    $(".percentage-" + u).html("~"+(Math.round((totalArea(packing)*10000))/100)+"%");
    let i = 0;
    for (let r of packing) {
        let w = r.getW();
        let h = r.getH();
        let c = "rgb(" + [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)].join(",") + ")";
        c = rect_colors[JSON.stringify(r.p)] || c;
        rect_colors[JSON.stringify(r.p)] = c;
        $(".unit-square-" + u).append("<div class='rect rect-" + i + "' style='background-color:" + c + ";left:" + r.p.x * 100 + "%;bottom:" + ((r.p.y * 100)) + "%;width:" + (w) * 100 + "%;height:" + (h) * 100 + "%'></div>");
        i++;
    }
    for (let r of packing) {
        $(".unit-square-" + u).append("<div class='point' style='left:" + r.p.x * 100 + "%;bottom:" + (r.p.y * 100) + "%'></div>");
    }
}

let points = [new Point(0,0)];

$("div.unit-square").on("click", function (e) {
    let us = $(e.target);
    if (!us.hasClass("unit-square")) {
        us = us.parent();
    }
    let o = us.offset();
    let x = Math.min(Math.max((e.pageX - o.left) / us.width(), 0), 1);
    let y = Math.min(Math.max((e.pageY - o.top) / us.height(), 0), 1);
    let q = new Point(x, 1-y);
    for (let p of points) {
        if (p.x === q.x && p.y === q.y) {
            return;
        }
    }
    points.push(q);
    $(".unit-square").append("<div class='point' style='left:" + (x * 100) + "%;top:" + (y * 100) + "%'></div>");
});

function demonstrate() {
    let n = parseInt($(".n").val());
    let ps = points.length > 1 ? points : generateRandomPoints(n);
    let fp = fastGreedyPacking(ps);
    let pg = permyGreedyPacking(ps);
    showPacking(fp, "1");
    showPacking(pg, "2");
    showPacking(improvePacking(ps, fp), "3");
    showPacking(improvePacking(ps, pg), "4");
    points = [new Point(0,0)];
}

demonstrate();