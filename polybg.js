/**
 * ShapeDisplay classes for circle display.
 *
 * This file includes a few classes to build the ShapeDisplay.
 * 
 * Classes:
 * * Hsl:          A class to contain and alter hsl(a) colors 
 * * Circle:       The shape being displayed in ShapeDisplay, will eventually change it to allow any shape class that contains specific methods.
 * * ShapeDisplay: Main class to build and display the shapes in a canvas. Automatically uses a double buffer but can be told not to use one, or to use one specified by the user.
 * 
 * Functions:
 * * const:
 * * * deg2rad(degrees): converts degrees to radians.
 * * * directPoint(point, angle, distance): returns a new point that is distance away at angle direction from the original point.
 * * * normalizeDegree(degrees):            normalizes degrees so it's always within [0, 360).
 * 
 * * function:
 * * * requestAnimationFrameT(callback, _this): Helper function to run requestAnimationFrame(callback) with a reference to this for class objects.
 * * * setIntervalT(callback, _this, timer):    Helper function to run setInterval(callback, timer) with a reference to this for class objects.
 * * * evtT(evt, callback, _this):              Helper function to run $(window).on(evt, callback) with a reference to this for class objects.
 * 
 * file     polybg.js
 * author   Andrew Kerr
 * created  12/11/2018
 */
  


class Hsl {
    constructor(hue, saturation, lightness, alpha) {
        if (hue instanceof Hsl) {
            this.h = hue.h;
            this.s = hue.s;
            this.l = hue.l;
            this.a = hue.a;
        }
        else {
            this.h = hue;
            this.s = saturation;
            this.l = lightness;
            this.a = alpha;
        }
    }
    equals(hsl, ignoreAlpha, ignoreSat, ignoreLight) {
        if (!(hsl instanceof Hsl))
            return false;
        if (ignoreSat === void 0)
            ignoreSat = false;
        if (ignoreSat === void 0)
            ignoreLight = false;
        if (ignoreAlpha === void 0)
            ignoreAlpha = false;
        
        var e = this.h == hsl.h;
        if (!ignoreSat)
            e = e && this.s == hsl.s;
        
        if (!ignoreLight)
            e = e && this.l == hsl.l;
        
        if (!ignoreAlpha)
            e = e && this.a == hsl.a;
        return e;
    }
    css(alpha) {
        var hsla = '(' + Math.abs(this.h) + ',' + Math.abs(this.s) + '%,' + Math.abs(this.l) + '%';
        if (alpha === void 0 || !!alpha)
        {
            hsla = 'hsla' + hsla;
            if (alpha === void 0 || typeof alpha == 'boolean')
                hsla += ',' + Math.abs(this.a);
            else
                hsla += ',' + alpha;
        } else
            hsla = 'hsl' + hsla;
        hsla += ')';
        return hsla;
    }
    static random() {
        return new Hsl(360 * Math.random(), 15 + 80 * Math.random(), 80 + 15 * Math.random(), Math.random() * .4 + .1);
    }
}
(function() {
    var _transparent = new Hsl(0, 100, 100, 0);
    Object.defineProperty(Hsl, 'transparent', { get: function() { return _transparent; } });
})();
const deg2rad = (degree) =>
{
    return degree * (Math.PI / 180);
}
const directPoint = (pt, angle, dist) =>
{
    return {
        x: pt.x + Math.cos(angle * Math.PI / 180) * dist,
        y: pt.y + Math.sin(angle * Math.PI / 180) * dist
    };
}
const normalizeDegree = (deg) => {
    var deg2 = deg % 360;
    if (deg2 < 0)
        deg2 += 360;
    return deg2;
}

class Circle
{
    constructor(radius, position, display)
    {
        if (radius === void 0)
            throw new Error("Shapes require a radius");
        this.radius = radius;
        if (position === void 0)
            throw new Error("Shapes require a position.");
        this.position = position;
        this.display = display;
        this.color = Hsl.random();
        this.originalcolor = new Hsl(this.color);
        this.colorspeed = Math.random() * 16 + 16;
        if (Math.random() < .5)
            this.colorspeed *= -1;
        this.movespeed = Math.random() * 18 + 2;
        this.direction = Math.random() * 360;
        if (Math.random() < .5)
            this.direction *= -1;
        this.growthspeed = Math.random() * 2 + 1;
        if (Math.random() < .5)
            this.growthspeed *= -1;
        this.linewidth = Math.random() * 2;
        this.timetolive = Math.random() * 26000 + 4000;
    }
    move(ellapsed)
    {
        //percent movement for ellapsed time in 1s per movement
        var percent = ellapsed/1000;
        this.position = directPoint(this.position, this.direction, this.movespeed * percent);
        this.color.h += this.colorspeed * percent;
        this.color.h = this.color.h % 360;
        this.radius += this.growthspeed * percent;
        if (this.radius >= this.maxgrowth && this.growthspeed > 0)
            this.growthspeed *= -1;
        if (this.radius <= this.mingrowth)
        {
            if (this.growthspeed < 0)
                this.growthspeed *= -1;
            this.radius += this.growthspeed * percent;
        }
        this.timetolive -= ellapsed;
        if (this.timetolive < 1500)
        {
            this.color.a *= this.timetolive/1500;
        }
        if (this.timetolive <= 0)
            this.display.shapes.splice(this.display.shapes.indexOf(this), 1);
    }
    attemptCollision(shape2)
    {
        //not in use
        if (this.isColliding(shape2))
        {   
            var shape1 = this;
            if (shape2.y < shape1.y)
            {
                shape1 = shape2;
                shape2 = this; 
            }
            var rangle = Math.atan2(shape1.position.y - shape2.position.y, shape1.position.x - shape2.position.x) * 180 / Math.PI;
            
            var tangent = rangle + 90;
            if (tangent > 180)
                tangent = 360 - tangent;
            
            //shape1 normalized direction
            var s1nd = shape1.direction - tangent;
            var s2nd = shape2.direction - tangent;

            s1nd = 360 - s1nd;
            s2nd = 360 - s2nd;

            s1nd += tangent;
            s2nd += tangent;

            //angle reflections
            var s2m = shape1.movespeed, s1m = shape2.movespeed;

            shape1.redirect(s1nd, s1m);
            shape2.redirect(s2nd, s2m);

            //transfer speeds, no friction

            return true;
        }
    
        return false;
    }
    isColliding(shape2)
    {
        var alpha = this.radius + shape2.radius;
        var cx = this.position.x - shape2.position.x;
        var cy = this.position.y - shape2.position.y;
        var beta = Math.sqrt((cx * cx) + (cy * cy));
        return alpha > beta;
    }
    redirect(direction, speed)
    {
        this.direction = direction % 360;
        this.movespeed = speed;
        this.move(40);
    }
    distance(shape)
    {
        p1 = this.position, p2 = shape.position;
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - (shape1.radius + shape2.radius);
    }
    draw(ctx)
    {
        ctx.save();

        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.color.css();
        if (this.timetolive <= 1500)
        {
            //ctx.filter = 'blur(' + Math.min(80, this.radius * (1500 / this.timetolive)) + 'px)';
            ctx.shadowBlur = Math.min(120, this.radius * (1500 / this.timetolive));
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowColor = this.originalcolor.css();
        }
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        var fill = new Hsl(this.color);
        fill.a *= 2 / 3;
        ctx.fillStyle = fill.css();
        ctx.fill();
        ctx.restore();
    }

    get mingrowth()
    {
        return Circle.growth.min();
    }
    get maxgrowth() 
    {
        return Circle.growth.max(this.display.width, this.display.height);
    }
}
Circle.growth = {
    max: function(width, height) {
        return Math.min(width, height) / Circle.growth.min();
    },
    min: function() {
        return 18;
    }
}

function requestAnimationFrameT(callback, _this)
{
    return requestAnimationFrame(function(timestamp) {
        callback.call(_this, timestamp);
    });
}
function setIntervalT(callback, _this, timer)
{
    return setInterval(function(){
        callback.call(_this);
    }, timer);
}
function evtT(evt, callback, _this)
{
    $(window).on(evt, function(e) {
        callback.call(_this, e);
    });
}
Mouse = {x: -1, y: -1};
$(document).mousemove(function(evt) {
    Mouse.x = evt.pageX;
    Mouse.y = evt.pageY;
})
class ShapeDisplay
{
    constructor(selector, width, height, usebuffer, background)
    {
        if (selector === void 0 || !($(selector)[0] instanceof HTMLCanvasElement))
            throw new Error('ShapeDisplay requires reference to a canvas object');
        this.canvas = $(selector)[0];
        if (width === void 0)
            width = this.canvas.width;
        if (height === void 0)
            height = this.canvas.height;
        this._width = width;
        this._height = height;
        this.usebuffer = usebuffer;
        this.starttime = null;
        this.totalellapsed = 0;
        this.shapes = [];
        this.background = background === void 0 ? Hsl.transparent : background;
        this.running = false;
        this.resize();
    }
    get maxshapes()
    {
        return Math.floor(Math.min(this.width, this.height) / Circle.growth.max(this.width, this.height));
    }
    get minshapes()
    {
        return Math.floor(this.maxshapes/10);
    }
    set usebuffer(usebuffer)
    {
        if (usebuffer === void 0 || usebuffer === true)
        {
            this._usebuffer = true;
            this.buffer = document.createElement('canvas');
        } else if (usebuffer instanceof HTMLCanvasElement)
        {
            this._usebuffer = true;
            this.buffer = usebuffer;
        } else {
            //either not a canvas or true, so false
            this._usebuffer = false;
            //does not clear buffer object, maybe it should?
        }
        if (!!this.buffer)
        {
            this.buffer.width = this.width;
            this.buffer.height = this.height;
        }
    }
    get usebuffer()
    {
        return this._usebuffer;
    }
    get context()
    {
        if (this._usebuffer)
            return this.buffer.getContext('2d');
        return this.canvas.getContext('2d');
    }
    get width()
    {
        return this._width;
    }
    get height()
    {
        return this._height;
    }
    set width(w)
    {
        if (this._width == w)
            return;
        this._width = w;
        this.resize();
    }
    set height(h)
    {
        if (this._height == h)
            return;
        this._height = h;
        this.resize();
    }
    resize()
    {
        var ow = this.canvas.width;
        var oh = this.canvas.height;
        var nw = this.width;
        var nh = this.height;

        var pxc = nw/ow;
        var pyc = nh/oh;

        this.canvas.width = nw;
        this.canvas.height = nh;
        if (this.usebuffer)
        {
            this.buffer.width = nw;
            this.buffer.height = nh;
        }
        for (var idx = 0; idx < this.shapes.length; idx++)
        {
            this.shapes[idx].position.x *= pxc;
            this.shapes[idx].position.y *= pyc;
            this.shapes[idx].radius *= Math.min(pxc, pyc);
        }
        for (var i = 0; i < this.shapes.length; i++)
        {
            for (var j = 0; j < this.shapes.length; j++)
            {
                if (i == j)
                    continue;
                var s1 = this.shapes[i];
                var s2 = this.shapes[j];

                if (s1.isColliding(s2))
                {
                    //pop the circles randomly, maybe animate popping later
                    if (Math.random() >= .5)
                        this.shapes = this.shapes.slice(i, 1);
                    else
                        this.shapes = this.shapes.slice(j, 1);
                }
            }
        }
    }
    start()
    {
        this.running = true;

        this.animationframe_id = requestAnimationFrameT(this.animate, this);
        this.drawframe_id = setIntervalT(this.draw, this, 1000/60);
    }
    stop()
    {
        this.running = false;
        cancelAnimationFrame(this.animationframe_id);
        clearInterval(this.drawframe_id);
    }
    draw()
    {
        if (!this.running)
            return;
        var ctx = this.context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (var i = 0; i < this.shapes.length; i++)
        {
            this.shapes[i].draw(ctx);
        }

        if (!(this.postprocess === void 0))
            this.postprocess(ctx);
    }
    closest(shape1)
    {
        var close = void 0;
        for (var idx = 0; idx < this.shapes.length; idx++)
        {
            var shape2 = this.shapes[idx];
            if (shape1 == shape2)
                continue;
            
            if (close === void 0)
            {
                close = shape2;
                continue;
            }
            
            if (shape1.distance(shape2) < shape1.distance(close))
                close = shape2;
        }
        return close;
    }
    collisionTest()
    {
        var alreadyCollided = [];
        for (var i = 0; i < this.shapes.length; i++)
        {
            var shape1 = this.shapes[i];
            /*
            //check if colliding with another shape
            //leaving out for now possibly permanently gone
            //keeping code just in case though
            collisions:
            for (var j = 0; j < this.shapes.length; j++)
            {
                if (i == j)
                    continue;
                for (var k = 0; k < alreadyCollided.length; k++)
                {
                    if (alreadyCollided[k].s2 == i && alreadyCollided[k].s1 == j)
                        continue collisions;
                }
                var shape2 = this.shapes[j];
                
                if (shape1.attemptCollision(shape2))
                {
                    alreadyCollided.push({
                        s1: i,
                        s2: j
                    });
                } 
            }
            */
            if (shape1.position.x - shape1.radius <= 0 ||
                shape1.position.x + shape1.radius >= this.width)
            {
                shape1.redirect(normalizeDegree(180 - shape1.direction), shape1.movespeed);
            }
            if (shape1.position.y - shape1.radius <= 0 ||
                shape1.position.y + shape1.radius >= this.height)
            {
                //bounce floor
                shape1.redirect(360 - shape1.direction, shape1.movespeed);
            }

            if (shape1.position.x < 0 || shape1.position.x > this.width || 
                shape1.position.y < 0 || shape1.position.y > this.height)
                //this has managed to move to at least the wall, remove from the display
                //when in background fps is dramatically slower thanks to requestAnimationFrame 
                //may skip too far and often made invisible
                this.shapes = this.shapes.slice(i, 1);
        }
    }
    transferbuffer(buffer)
    {
        if (buffer === void 0)
            buffer = this.buffer;
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.getContext('2d').drawImage(buffer, 0, 0);
    }
    animate(timestamp)
    {
        if (!this.running)
            return;
        if (this.starttime === void 0)
            this.starttime = timestamp;
        var ellapsed = (timestamp - this.starttime) - this.totalellapsed;
        this.totalellapsed = timestamp - this.starttime;
        this.lastellapsed = ellapsed;
        for (var idx = 0; idx < this.shapes.length; idx++)
        {
            var shape = this.shapes[idx];
            shape.move(ellapsed);
        }
        this.collisionTest();
        
        if (this.shapes.length < this.minshapes ||
            (this.shapes.length < this.maxshapes && Math.random() > Math.pow(this.shapes.length/this.maxshapes, 2)))
        {
            var rad = Math.random() * (Circle.growth.max(this.width, this.height) - Circle.growth.min()) + Circle.growth.min();
            var shape;
            do 
            {
                shape = new Circle(1, { 
                    x: Math.random() * (this.width - rad * 2) + rad,
                    y: Math.random() * (this.height - rad * 2) + rad,
                }, this);
                shape.movespeed += 20;
            } while (((shape) => {
                for (var i = 0; i < this.shapes.length; i++)
                    if (this.shapes[i].isColliding(shape))
                        return true;
                return false;
            }).call(this, shape));
            
            this.shapes.push(shape);
        }

        if (this.usebuffer)
            this.transferbuffer();

        this.animationframe_id = requestAnimationFrameT(this.animate, this);
    }
}