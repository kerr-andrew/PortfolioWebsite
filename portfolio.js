//not in use 
//test idea for background shapes travelling on bezier curve paths
//became too muddled and decided on a different idea
$(document).ready(function() {
    var hexagons, canvas, ctx, animating = true, frame, create;
    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
      }
    Math.dist = function(pt, pt2)
    {
        return Math.sqrt((pt2.x - pt.x)*(pt2.x - pt.x) + (pt2.y - pt.y)*(pt2.y - pt.y));
    }
    function pt2s(pt) 
    {
        return '{ x: ' + pt.x + ', y: ' + pt.y + '}';
    }
    

    class Timeslot
    {
        constructor(distance, ellapse, point)
        {
            this.distance = distance;
            this.ellapse = ellapse;
            this.pt = point;
        }
        toString()
        {
            return '{distance: ' + this.distance + ', ellapse: ' + this.ellapse + ', pt: ' + pt2s(this.pt) + '}';
        }
    }
    class BezierSegment {
        constructor(start, control1, control2, end)
        {
            this.start = start;
            this.control1 = control1;
            this.control2 = control2;
            this.end = end;
            this.timetable = [];
            this.laststep = 0;
            const tpp = 280;
            this.length = 0;
            var ptold = 0;
            this.timetable.push(new Timeslot(0, 0, this.start));
            var pt1;
            for (var i = 1; i < 200; i++)
            {
                pt1 = this.pointFrom(i/199);
                if (ptold != 0)
                {
                    var dist = Math.dist(ptold, pt1);
                    this.length += dist;
                    var ts = new Timeslot(dist, tpp/dist, { x: pt1.x, y: pt1.y });
                    console.log(ts.toString());
                    this.timetable.push(ts);
                }
                ptold = pt1;
            }
            this.currentstep = this.timetable[0];
         
        }
        ended()
        {
            return this.timetable.length == 0;
        }
        step(ellapsed, increase)
        {
            if (increase === void 0)
                increase = true;
            console.log("this.laststep: " + this.laststep + ", ellapsed:" + ellapsed);
            if (isNaN(this.laststep))
                this.laststep = 0;
            this.laststep += ellapsed;
            if (this.timetable.length == 0)
                return this.currentstep;

            while (this.laststep > this.timetable[0].ellapse)
            {
                console.log("stepping");
                //enough time has taken to perform a new step
                //keep iterating until the time taken is less than the time it takes for another step
                //if the computer has a less than optimal performance items should still step the correct distance over each frame

                this.currentstep = this.timetable.shift();
                this.laststep -= this.currentstep.ellapse;
                //should not happen but just in case
                if (this.laststep < 0)
                    this.laststep = 0;
            }
            return this.currentstep;
        }
        pointFrom(percent)
        {
            return BezierSegment.pointOn(percent, this.start, this.control1, this.control2, this.end);
        }
        static pointOn(t, start, ctrl1, ctrl2, end)
        {
            var x = BezierSegment.cubic(t, start.x, ctrl1.x, ctrl2.x, end.x);
            var y = BezierSegment.cubic(t, start.y, ctrl1.y, ctrl2.y, end.y);
            return {x: x, y: y};
        }
        static cubic(t, a, b, c, d)
        {
            var t2 = t * t;
            var t3 = t2 * t;
            return a + (-a * 3 + t * (3 * a - a * t)) * t
            + (3 * b + t * (-6 * b + b * 3 * t)) * t
            + (c * 3 - c * 3 * t) * t2
            + d * t3;
        }
        toString()
        {
            var str = '{start:' + pt2s(this.start) + ', ';
            str += 'control1: ' + pt2s(this.control1) + ', ';
            str += 'control2: ' + pt2s(this.control2) + ', ';
            str += 'end: ' + pt2s(this.end) + ', ';
            str += 'timetable: [';
            for (var i = 0; i < this.timetable.length; i++)
                str += this.timetable[i].toString() + ', ';
            str = str.substring(0, str.length - 2);

            str += '], laststep:' + this.laststep + ', length:' + this.length + ', currentstep: ' + pt2s(this.currentstep) + '}';

            return  str;
        }

        static biasedControl(start, end, w, h, d)
        {
            //control should be within d of one of the end points, doesn't matter where
            var ctrl;
            do {
                ctrl = {x: Math.random() * w, y: Math.random() * h};
            } while ((Math.dist(ctrl, start) > d && Math.dist(ctrl, end) > d) ||
                ctrl.x < 0 || ctrl.x > w || ctrl.y < 0 || ctrl.y > h);
            return ctrl;
        }
    }
    class Hexagon {
        constructor(ctr, cvs) {
            this.size = Math.round(Math.random() * 14) + 4;
            console.log("Center x:" + ctr.x + ", Center y:" + ctr.y);
            this.center = ctr;
            this.origin = ctr;
            this.color = Hsl.random();
            this.clockwiseColor = Math.random() * 2 - 1;
            this.clockwiseRotation = Math.random() * 2 - 1;
            this.angle = Math.random() * 360;
            this.growing = Math.random() >= .5 ? .1 : -.1;
            this.move = Math.random() * 360;
            this.points = [];
            this.path = [];
            this.generatePath(cvs);
            this.length = 0;
            for (var i = 0; i < this.path.length; i++)
                this.length += this.path[i].length;
            this.translate();
        }
        generatePath(cvs)
        {
            var len = Math.random() * 8 + 4, dist = Math.max(cvs.h/5, cvs.w/5), endpt;
            do {
                endpt = { x: Math.random() * cvs.w, y: Math.random() * cvs.h };
            } while (Math.dist(this.center, endpt) > dist || endpt.x > cvs.w || endpt.x < 0 || endpt.y > cvs.h || endpt.y < 0);
            var ctrl1 = BezierSegment.biasedControl(this.center, endpt, cvs.w, cvs.h, dist/2);
            var ctrl2 = BezierSegment.biasedControl(this.center, endpt, cvs.w, cvs.h, dist/2);
            this.path[0] = new BezierSegment(this.center, ctrl1, ctrl2, endpt);
            for (var i = 1; i < len; i++)
            {
                do {

                    endpt = { x: Math.random() * cvs.w, y: Math.random() * cvs.h };
                } while (Math.dist(this.path[i - 1], endpt) > 40 || endpt.x > cvs.w || endpt.x < 0 || endpt.y > cvs.h || endpt.y < 0);
                ctrl1 = BezierSegment.biasedControl(this.path[i - 1], endpt, cvs.w, cvs.h, dist);
                ctrl2 = BezierSegment.biasedControl(this.path[i - 1], endpt, cvs.w, cvs.h, dist);
                this.path[i] = new BezierSegment(this.path[i - 1].end, ctrl1, ctrl2, endpt);
            }
        }
        segments()
        {
            var theta = deg2rad(this.angle);
            var sides = [];
            for (var idx = 0; idx < this.points.length; idx++)
            {
                var alpha = this.points[idx];
                var beta = this.points[(idx + 1) % this.points.length];

                sides.push({
                    start: {
                        x: alpha.x * Math.cos(theta) - alpha.y * Math.sin(theta),
                        y: alpha.x * Math.sin(theta) + alpha.y * Math.cos(theta)
                    },
                    end: {
                        x: beta.x * Math.cos(theta) - beta.y * Math.sin(theta),
                        y: beta.x * Math.sin(theta) + beta.y * Math.cos(theta)
                    }
                });
            }
            return sides;
        }
        translate(ellapsed) {
            this.path[0].step(ellapsed);
            if (this.path[0].ended())
            {
                if (this.path.length == 1)

                {
                    removeHexagon(this);
                    return;
                }
                this.origin = this.path[0].end;
                this.path.shift();
            }
            this.center = this.path[0].currentstep.pt;
            this.color.hue = (this.color.hue + this.clockwiseColor) % 360;
            this.angle = (this.angle + this.clockwiseRotation) % 360;
            this.size += this.growing;
            if ((this.growing < 0 && this.size <= 4) || (this.growing > 0 && this.size >= 40))
                this.growing *= -1;
            this.points = [];
            for (var idx = 0; idx < 360; idx += (360/6))
            {
                this.points.push({
                    x: Math.cos(deg2rad(idx)) * this.size,
                    y: Math.sin(deg2rad(idx)) * this.size
                });
            }
        }

        toString()
        {
            var str = '{side:' + this.size + ', center:' + pt2s(this.center) +
                ', color:' + this.color.toString() + ', clockwise:' + this.clockwise + ', ' +
                'angle:' + this.angle + ', growing:' + this.growing + ', points:[';
            for (var i = 0; i < this.points.length; i++)
                str += pt2s(this.points[i]) + ', ';
            str = str.substring(0, str.length - 2);
            str += '], path:[';
            for (var i = 0; i < this.path.length; i++)
                str += this.path[i].toString() + ', ';
            return str.substring(0, str.length - 2) + ']}';
        }
    }


    function initCanvas()
    {
        var w = $(window).width(), h = $(window).height();
        canvas = $('canvas#bg-canvas')[0];
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
        if (hexagons != void 0)
        {
            fadeOutCanvas(initCanvas);
            return;
        }
        hexagons = [];
        
        if (!animating)
            return;
       //animationframe = setInterval(animate, 1000/60);

       //createframe = setInterval(createHexagon, 1000/60);


    }
    var omega = new Date(), ellapsed;

    function testBezierPoints()
    {
        ellapsed = new Date() - omega;
        omega = new Date();
        for (var i = 0; i < hexagons.length; i++)
            hexagons[i].translate(ellapsed);
        var hex = hexagons[0];
        ctx.fillStyle = 'rgba(14, 14, 14, .8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = hex.color.css();
        for (var i in hex.path)
        {
            var path = hex.path[i];
            for (var j in path.timetable)
            {
                var t = path.timetable[i];
                console.log(t.toString());
                ctx.fillRect(t.pt.x,t.pt.y, 1, 1);
            }
        }
    }
    function createHexagon()
    {
        if (hexagons.length > 40)
            return;
        if (Math.random() < .01 || hexagons.length < 1)
        {
            var pt = {x:canvas.width * Math.random(), y:canvas.height * Math.random()};
            hexagons[hexagons.length] = new Hexagon(pt, {w:canvas.width, h:canvas.height});
        }
    }
    function animate() {
        ellapsed = new Date() - omega;
        omega = new Date();
        if (animating = false)
        {
            if (frame === void 0)
                return;

            clearInterval(frame);
            frame = void 0;
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle='rgba(14, 14, 14, .8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var hexidx in hexagons)
        {
            var hex = hexagons[hexidx];

            hex.translate(ellapsed);
            var segments = hex.segments();
            ctx.strokeStyle = hex.color.css();
            ctx.lineWidth = 1;
            for (var idx = 0; idx < segments.length; idx++)
            {
                var seg = segments[idx];
                ctx.beginPath();
                ctx.moveTo(seg.start.x + hex.center.x, seg.start.y + hex.center.y);
                ctx.lineTo(seg.end.x + hex.center.x, seg.end.y + hex.center.y);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
    function removeHexagon(hex)
    {
        hexagons.splice(hexagons.indexOf(hex), 1);
    }
    initCanvas();
    $(window).on('resize', function() {
    });
});