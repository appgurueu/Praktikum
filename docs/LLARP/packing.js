class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Point(this.x, this.y);
    }
}

function sortPoints(points) {
    points.sort((b, a) => a.x + a.y - b.x - b.y);
    return points;
}

function sortPointsRev(points) {
    points.sort((a, b) => a.x + a.y - b.x - b.y);
    return points;
}

function generateRandomPoints(n) {
    points = [new Point(0, 0)];
    for (; n > 0; n--) {
        searchCandidate: while (true) {
            let candidate = new Point(Math.random(), Math.random());
            for (point of points) {
                if (point.x === candidate.x && point.y === candidate.y) {
                    continue searchCandidate;
                }
            }
            points.push(candidate);
            break;
        }
    }
    return points;
}

class Rectangle {
    constructor(p, q) {
        this.p = p;
        this.q = q;
    }

    getW() {
        return this.q.x - this.p.x;
    }

    getH() {
        return this.q.y - this.p.y;
    }

    area() {
        return Math.abs(this.getW() * this.getH());
    }

    collidepoint(x) {
        return x.x > this.p.x && x.y > this.p.y && x.x < this.q.x && x.y < this.q.y;
    }

    colliderect(r) {
        return this.p.x < r.q.x && this.p.y < r.q.y && r.p.x < this.q.x && r.p.y < this.q.y;
    }

    clone() {
        return new Rectangle(this.p.clone(), this.q.clone());
    }

    waysToShrink(out_points, rects) {
        let options = [];
        let points = [...out_points, new Point(1, 1)];
        let [x, y] = ["x", "y"];
        for (let k = 0; k < 2; k++) {
            for (let i = 0; i < points.length; i++) {
                let sx = points[i];
                if (sx[x] < this.p[x]) {
                    continue;
                }
                for (let j = i; j < points.length; j++) {
                    let sy = points[j];
                    if (sy[y] < this.p[y]) {
                        continue;
                    }
                    let q = new Point(0, 0);
                    q[x] = sx[x];
                    q[y] = sy[y];
                    let shrinked = new Rectangle(this.p, q);
                    an_option: {
                        for (let p of out_points) {
                            if (shrinked.collidepoint(p)) {
                                break an_option;
                            }
                        }
                        for (let r of rects) {
                            if (shrinked.colliderect(r)) {
                                break an_option;
                            }
                        }
                        options.push(shrinked);
                    }
                }
            }
            [x, y] = ["y", "x"];
        }
        return options;
    }

    brutyShrink(out_points, rects) {
        let best_option = new Rectangle(new Point(0, 0), new Point(0, 0));
        // check all ways to shrink
        let points = [...out_points, new Point(1, 1)];
        let [x, y] = ["x", "y"];
        for (let k = 0; k < 2; k++) {
            for (let i = 0; i < points.length; i++) {
                let sx = points[i];
                if (sx[x] < this.p[x]) {
                    continue;
                }
                for (let j = i; j < points.length; j++) {
                    let sy = points[j];
                    if (sy[y] < this.p[y]) {
                        continue;
                    }
                    let q = new Point(0, 0);
                    q[x] = sx[x];
                    q[y] = sy[y];
                    let shrinked = new Rectangle(this.p, q);
                    an_option: {
                        if (shrinked.area() <= best_option.area()) {
                            break an_option;
                        }
                        // theoretically unnecessary
                        for (let p of out_points) {
                            if (shrinked.collidepoint(p)) {
                                break an_option;
                            }
                        }
                        for (let r of rects) {
                            if (shrinked.colliderect(r)) {
                                break an_option;
                            }
                        }
                        best_option = shrinked;
                    }
                }
            }
            [x, y] = ["y", "x"];
        }
        return best_option;
    }
}

function totalArea(rects) {
    let area = 0;
    for (let r of rects) {
        area += r.area();
    }
    return area;
}

function brutePacking(points) {
    let best_packing = undefined;
    let best_area = 0;
    function brutyPacking(points, rects, area) {
        if (rects.length === points.length) {
            if (area > best_area) {
                best_area = area;
                best_packing = rects;
            }
            return;
        }
        let p = points[rects.length];
        let r = new Rectangle(p, new Point(1, 1));
        for (let rect of r.waysToShrink(points, rects)) {
            brutyPacking(points, [...rects, rect], area + rect.area());
        }
    }
    brutyPacking(points, [], 0);
    return best_packing;
}

function fastGreedyPacking(points) {
    let rects = [];
    points = sortPointsRev(points);
    for (let i = 0; i < points.length; i++) {
        let r = new Rectangle(points[i], new Point(1, 1));
        // (possibly) limiting "past" rects
        for (let j = 0; j < i; j++) {
            if (rects[j].colliderect(r)) {
                // we've got two options here: shrink rect_j or shrink r
                if (rects[j].p.y > r.p.y) {
                    r.q.y = rects[j].p.y;
                } else {
                    r.q.x = rects[j].p.x;
                }
            }
        }
        // (certainly) limiting points
        for (let j = i + 1; j < points.length; j++) {
            let p_j = points[j];
            if (!r.collidepoint(p_j)) {
                continue;
            }
            // p_j might collide with the max rect, so we need to shrink it "greedily"
            let x_loss = (r.q.x - p_j.x) * r.getH();
            let y_loss = (r.q.y - p_j.y) * r.getW();
            if (x_loss < y_loss) {
                r.q.x = p_j.x;
            } else {
                r.q.y = p_j.y;
            }
        }
        rects.push(r);
    }
    return rects;
}

function greedyPacking(points) {
    rects = [];
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let q = new Point(1, 1);
        rects.push(new Rectangle(p, q).brutyShrink(points.slice(0, i), rects));
    }
    return rects;
}

function greedyPackingUnsorted(points) {
    return greedyPacking(sortPoints(points));
}

function permArr(a) {
    let perms = [];
    if (a.length !== 1) {
        for (let i = 0; i < a.length; i++) {
            let copy = [...a];
            copy.splice(i, 1);
            for (let perm of permArr(copy)) {
                perms.push([a[i], ...perm]);
            }
        }
    } else {
        return [a];
    }
    return perms;
}

// possibly always good to chose those closest to the diagonal? remains open
function sortPointsPermutations(points) {
    let perms = [points];
    let last = 0;
    for (let i = 1; i <= points.length; i++) {
        let a = points[last];
        let b = points[i];
        let same = i === points.length ? false : (a.x + a.y - b.x - b.y === 0);
        if (!same) {
            if (i - last > 1) {
                for (let k = perms.length - 1; k > -1; k--) {
                    let permes = permArr(points.slice(last, i));
                    perms[k] = permes[0];
                    for (let j = 1; j < permes.length; j++) {
                        let copy = [...perms[k]];
                        copy.splice(last, i - last, ...permes[j]);
                        perms.push(copy);
                    }
                }
            }
            last = i;
        }
    }
    return perms;
}

function permyGreedyPacking(points) {
    let best_packing;
    let best_area = 0;
    for (let sorted of sortPointsPermutations(sortPoints(points))) {
        let packing = greedyPacking(sorted);
        let packing_area = totalArea(packing);
        if (packing_area > best_area) {
            best_packing = packing;
            best_area = packing_area;
        }
    }
    return best_packing;
}

function brutyGreedyPacking(packer, points) {
    let best_packing;
    let best_area = 0;
    for (let sorted of permArr(points)) {
        let packing = packer(sorted);
        let packing_area = totalArea(packing);
        if (packing_area > best_area) {
            best_packing = packing;
            best_area = packing_area;
        }
    }
    return best_packing;
}


function improvePacking(points, rects) {
    // idea: choose two rects where one is limiting the other
    // check whether "swapping roles" is effective: more area occupied?
    let improving;
    do {
        improving = false;
        for (let i=0; i < rects.length; i++) {
            let r = rects[i];
            for (let j=0; j < rects.length; j++) {
                if (i === j) {
                    continue;
                }
                let r2 = rects[j];
                if (r.q.x === r2.p.x || r.q.y === r2.p.y) {
                    let prev_r_q = r.q.clone();
                    let prev_r2_q = r2.q.clone();
                    let prev_area = r.area() + r2.area();
                    r.q = r.p; r2.q = r2.p;
                    let r_proposal = new Rectangle(r.p, new Point(1,1)).brutyShrink(points, rects);
                    r.q = r_proposal.q;
                    let r2_proposal = new Rectangle(r2.p, new Point(1,1)).brutyShrink(points, rects);
                    r2.q = r2_proposal.q;
                    let prop_area = r_proposal.area() + r2_proposal.area();
                    if (prop_area > prev_area) {
                        improving = true;
                    } else {
                        r.q = prev_r_q;
                        r2.q = prev_r2_q;
                    }
                    // r is limited to the right/top by r_2
                }
            }
        }
    } while (improving);
    return rects;
}

function maxImprovePacking(points, rects) {
    // idea: choose two rects where one is limiting the other
    // check whether "swapping roles" is effective: more area occupied?
    let improving;
    do {
        improving = false;
        let max_gain = 0;
        let best_r, best_r2, best_r_q, best_r2_q;
        for (let i=0; i < rects.length; i++) {
            let r = rects[i];
            for (let j=0; j < rects.length; j++) {
                if (i === j) {
                    continue;
                }
                let r2 = rects[j];
                if (r.q.x === r2.p.x || r.q.y === r2.p.y) {
                    let prev_r_q = r.q.clone();
                    let prev_r2_q = r2.q.clone();
                    let prev_area = r.area() + r2.area();
                    r.q = r.p; r2.q = r2.p;
                    let r_proposal = new Rectangle(r.p, new Point(1,1)).brutyShrink(points, rects);
                    r.q = r_proposal.q;
                    let r2_proposal = new Rectangle(r2.p, new Point(1,1)).brutyShrink(points, rects);
                    r2.q = r2_proposal.q;
                    let prop_area = r_proposal.area() + r2_proposal.area();
                    let gain = prop_area - prev_area;
                    if (gain > max_gain) {
                        max_gain = gain;
                        best_r = r;
                        best_r2 = r2;
                        best_r_q = r.q;
                        best_r2_q = r2.q;
                    }
                    r.q = prev_r_q;
                    r2.q = prev_r2_q;
                }
            }
        }
        if (best_r_q && best_r2_q) {
            best_r.q = best_r_q;
            best_r2.q = best_r2_q;
            improving = true;

        }
    } while (improving);
    return rects;
}