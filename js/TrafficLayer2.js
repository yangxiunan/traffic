/**
 * 交通通勤图类
 * @author nikai
 * @date 2014-11-27
 * $params {Object} 一些传入的参数
 * {
 *     map: map对象,
 * }
 */
function TrafficLayer (options) {
    this._options = options || {};
    if (!this._options.map) {
        return;
    }
    this.init();
}

function isMobile() {
    return false
}

/**
 * 初始化
 */
TrafficLayer.prototype.init = function() {

    var me = this,
        map = this._options.map;

    this.map = map;
    this.mercatorProjection = this.map.getMapType().getProjection();

    // 用来存储数据用的
    // 如{"xierqi":[西二旗线数据]}
    this._data = {};

    // 用来存储绘制的一些样式
    this._styleKey = {};

    // 存储展示的地点的key
    this._showKeys = [];

    this.initCanvas();

    this._showAnimateText = {}; //是否显示过文字

    // 执行动画的栈
    this._animateStack = [];

    // 存储Animation的实例对象
    this._animationList = [];

    this._animateFlag = true; //控制动画的开关

    requestAnimationFrame(function() {
        me._animate();
    });

    this._bind();
}

//初始化canvas层
TrafficLayer.prototype.initCanvas = function() {
    var me = this;

    //用来显示路线层用的
    this.baseCanvas = new MapMask({
        map: map,
        elementTag: "canvas"
    });
    this.baseCanvas.show();

    this.ctx = this.baseCanvas.getContainer().getContext("2d");
    this.baseCanvas.addEventListener('draw', function() {
        me.draw();
    });

    //用来展示动画层用的
    this.animateMask = new MapMask({
        map: map,
        elementTag: "canvas"
    });
    this.animateMask.show();

    this.anictx = this.animateMask.getContainer().getContext("2d");

    //用来展示有阴影动画层用的
    this.animateBlurMask = new MapMask({
        map: map,
        elementTag: "canvas"
    });
    this.animateBlurMask.show();

    this.aniblurctx = this.animateBlurMask.getContainer().getContext("2d");
    this.aniblurctx.globalAlpha = 0.85; //关键
    var aniBlurCanvasTmp = this.animateBlurMask.getContainer().cloneNode(); //用来做动画的临时canvas
    this.aniblurctxTmp = aniBlurCanvasTmp.getContext("2d");
    this.aniblurctxTmp.globalCompositeOperation = 'copy';
}

/*
 * 拖动、缩放地图的时候进行重绘
 */
TrafficLayer.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.anictx.clearRect(0, 0, this.anictx.canvas.width, this.anictx.canvas.height);
    this.aniblurctx.clearRect(0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height);
    this._animateStack.length = [];
    for (var i = 0; i < this._animationList.length; i++) {
        this._animationList[i].dispose();
    }
    this._animationList.length = [];
    for (var i in this._showKeys) {
        this.drawLinesAni(this._showKeys[i]);
    }
}

/**
 * 显示需要展示的地点
 */
TrafficLayer.prototype.show = function(keys) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this._showKeys = keys;
    for (var i in this._showKeys) {
        var key = this._showKeys[i];
        if (this._data[key]) {
            this.drawLinesAni(key);
        } else {
            this.request(key);
        }
    }
}

/**
 * 从工作地点回家
 */
TrafficLayer.prototype.workToHome = function() {
    for (var i in this._showKeys) {
        var key = this._showKeys[i];
        var rs = this._data[key];
        var len = 500;
        if (isMobile()) {
            len = 80;
        }
        for (var i = 0; i < len; i++) {
            // 流动的方向
            rs[i][3] = 0;
        }
        if (this._data[key]) {
            this.workToHomeByKey(key);
        }
    }
}

TrafficLayer.prototype.workToHomeByKey = function(key) {

    this._showAnimateText[key] = true;

    var lines = this._data[key];
    var me = this;

    if (!lines) {
        return;
    }


    var count = 1500;
    if (isMobile()) {
        count = 100;
    }
    me._animateFlag = true;
    var start = 0;
    var end = count;
    function animate() {
        me._animationList.push(
        new Animation({
            from: lines[0][1].length - 1,
            to: 0,
            //fps: 50,
            action: function(index) {
                var lineWidths = [0.07,0.09,0.1,0.12,0.15];
                me._styleKey[key].lineWidth = lineWidths[1];
                me.ctx.clearRect(0, 0, me.ctx.canvas.width, me.ctx.canvas.height);
                me.drawLines(lines, me._styleKey[key], undefined, end, lines.length);
                me.drawLines(lines, me._styleKey[key], index, start, end);
            },
            callback: function() {
                start += count;
                end += count;
                if (start < lines.length) {
                    animate();
                } else {
                    me.drawLinesAni(key);
                }
                //me._animateFlag = true;
            }
        })
        );
    }
    animate();
}

/*
 * 拖动、缩放地图的时候进行重绘
 */
TrafficLayer.prototype.request = function(key) {
    if (this._data[key]) {
        return this._data[key];
    }

    var me = this;
    $('.loading').show();
    var url = 'data/' + key;
    if (isMobile()) {
        url += '_min';
    }
    url += '.js';
    $.ajax({
        url: url,
        dataType: "JSON",
        success: function(rs){
        	//平移坐标到上海
        	rs = changePoints(rs);
            var len = 500;
            if (isMobile()) {
                rs.length = 350;
                len = 80;
            }
            for (var i = 0; i < len; i++) {
                rs[i][2] = ~~(Math.random() * rs[i][1].length); //流动的位置
                rs[i][3] = 1; //流动的方向，单向流动
            }
            me._data[key] = rs;
            me.drawLinesAni(key);
            $('.loading').hide();
        },
        error: function() {
            me._data[key] = [];
            $('.loading').hide();
            $('.tip').html('无数据返回');
            $('.tip').show();
            setTimeout(function(){
                $('.tip').hide();
            }, 2000);
        }
    });
}

/*
 * 绘制交通通勤底层的线
 */
TrafficLayer.prototype.drawLines = function(lines, style, pos, start, end) {
    var me = this;
    var ctx = this.ctx;

    if (!lines) {
        return;
    }

    ctx.beginPath();
    var zoom = map.getZoom();
    var zoomUnit = Math.pow(2, 18 - zoom);
    var mcCenter = this.mercatorProjection.lngLatToPoint(this.map.getCenter());
    var nwMc = new BMap.Pixel(mcCenter.x - (ctx.canvas.width / 2) * zoomUnit, mcCenter.y + (ctx.canvas.height / 2) * zoomUnit);//左上角墨卡托坐标
    ctx.save();
    ctx.strokeStyle = style && style['strokeStyle'] || "rgba(255,255,0,0.9)";
    ctx.lineWidth = style && style['lineWidth'] || 0.1;
    if (isMobile()) {
        ctx.lineWidth = 0.4;
    }

    start = start || 0;
    end = end || 0;
    if (end > lines.length) {
        end = lines.length;
    }
    for (var i = start; i < end; i++) {
        var line = lines[i][1];
        if (pos !== undefined) {
            ctx.moveTo((line[0][0] - nwMc.x) / zoomUnit, (nwMc.y - line[0][1]) / zoomUnit);
            for (var index = 1; index < pos; index++) {
                ctx.lineTo((line[index][0] - nwMc.x) / zoomUnit, (nwMc.y - line[index][1]) / zoomUnit);
            }
        }  else {
            ctx.moveTo((line[0][0] - nwMc.x) / zoomUnit, (nwMc.y - line[0][1]) / zoomUnit);
            for (var index = 1; index < line.length; index++) {
                ctx.lineTo((line[index][0] - nwMc.x) / zoomUnit, (nwMc.y - line[index][1]) / zoomUnit);
            }
        }
    }
    ctx.stroke();
    ctx.restore();
}

/*
 * 分图层绘制交通通勤底层的线
 */
TrafficLayer.prototype.drawLinesAni = function(key) {

    var item = workPlaces[key];

    var layers = this._data[key],
        me = this;

    var rs = this._data[key];
    var len = 500;
    if (isMobile()) {
        len = 80;
    }

    for (var i = 0; i < len; i++) {
        if (rs && rs[i]) {
            rs[i][3] = 1; //流动的方向
        }
    }

    if (!layers) {
        return;
    }

    var count = 1500;
    if (isMobile()) {
        count = 100;
    }
    me._animateFlag = true;
    var start = 0;
    var end = count;
    function animate() {
        me._animationList.push(
        new Animation({
            from: 0,
            to: layers[0][1].length - 1,
            //fps: 50,
            action: function(index) {
                me.ctx.clearRect(0, 0, me.ctx.canvas.width, me.ctx.canvas.height);
                me.drawLines(layers, me._styleKey[key], undefined, 0, start);
                me.drawLines(layers, me._styleKey[key], index, start, end);
            },
            callback: function() {
                start += count;
                end += count;
                if (start < layers.length) {
                    animate();
                } else {
                    me.workToHome();
                }
                //me._animateFlag = true;
            }
        })
        );
    }
    animate();

}

/*
 * 展示动画用
 */
TrafficLayer.prototype._animate = function(key) {
    var me = this;
    this.aniblurctxTmp.drawImage(this.aniblurctx.canvas, 0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height);
    this.anictx.clearRect(0, 0, this.anictx.canvas.width, this.anictx.canvas.height);
    this.aniblurctx.clearRect(0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height);

    if (this._animateFlag) {

        if (this._animateStack.length > 0) { //执行动画栈中的函数
            this._animateStack.shift()();
        }

        for (var i in this._showKeys) {
            this._drawAnimatePath(this._showKeys[i], key);
            this.aniblurctx.fill();
            this._drawAnimateMarker(this._showKeys[i], key);
        }
    }

    this.aniblurctx.drawImage( this.aniblurctxTmp.canvas, 0, 0, this.aniblurctxTmp.canvas.width, this.aniblurctxTmp.canvas.height);

    setTimeout(function(){
        requestAnimationFrame(function(){
            me._animate(key);
        });
    }, 55);
}

var circleSize = 10;
/*
 * 绘制动画的marker
 */
TrafficLayer.prototype._drawAnimateMarker = function(key) {

    var center = workPlaces[key] && workPlaces[key].center;

    if (!center || !this._data[key]) {
        return;
    }
    var style = this._styleKey[key];
    center = this.map.pointToPixel(center);

    var aniblurctx = this.aniblurctx;
    aniblurctx.save();
    aniblurctx.beginPath();
    //aniblurctx.strokeStyle = style && style.strokeStyle || "rgba(0,0,255,1)";
    aniblurctx.strokeStyle = "rgba(255,255,255,0.9)";
    circleSize += 1;
    aniblurctx.arc(center.x, center.y, circleSize, 0, 2 * Math.PI);
    aniblurctx.stroke();
    aniblurctx.restore();
    if (circleSize > 35) {
        circleSize = 0;
    }
}

/*
 * 绘制动画上的点
 */
TrafficLayer.prototype._drawAnimatePath = function(key) {
    if (!this._data[key]) {
        return;
    }

    var anictx = this.anictx;
    var aniblurctx = this.aniblurctx;
    anictx.beginPath();
    aniblurctx.beginPath();
    anictx.fillStyle = "rgba(255,255,255,0.9)";
    aniblurctx.fillStyle = "rgba(255,255,255,0.9)";
    var zoom = this.map.getZoom();
    var zoomUnit = Math.pow(2, 18 - zoom);
    var mcCenter = this.mercatorProjection.lngLatToPoint(this.map.getCenter());
    var nwMc = new BMap.Pixel(mcCenter.x - (anictx.canvas.width / 2) * zoomUnit, mcCenter.y + (anictx.canvas.height / 2) * zoomUnit);//左上角墨卡托坐标

    var lines = this._data[key];

    var len = lines.length;
    for (var i = 0; i < len; i++) {
        if (lines[i][1][2] === undefined) {
            continue;
        }

        var item = lines[i][1][lines[i][2]];
        if (lines[i][3] === 1) {
            lines[i][2]++;
            if (lines[i][2] > lines[i][1].length) {
                lines[i][2] = 0;
            }
        } else {
            lines[i][2]--;
            if (lines[i][2] < 0) {
                lines[i][2] = lines[i][1].length;
            }
        }


        /*
        //双向流动
        if (lines[i][2] > lines[i][1].length) {
            lines[i][3] = 0;
        } else if (lines[i][2] < 0) {
            lines[i][3] = 1;
        };
        */
        if (item) {
            if (i < 25) {
                aniblurctx.moveTo((item[0] - nwMc.x) / zoomUnit, (nwMc.y - item[1]) / zoomUnit);
                aniblurctx.arc((item[0] - nwMc.x) / zoomUnit, (nwMc.y - item[1]) / zoomUnit, 4, 0, 2 * Math.PI);
            } else {
                anictx.fillRect((item[0] - nwMc.x) / zoomUnit, (nwMc.y - item[1]) / zoomUnit, 2, 2);
            }

        }
    }

}

//根据key设置样式
TrafficLayer.prototype.setStyle = function(key, style) {
    this._styleKey[key] = style;
}

/**
 * 绑定一些事件
 */
TrafficLayer.prototype._bind = function() {
    var me = this;
    this.map.addEventListener('movestart', function(){
        me._animateFlag = false;
    });
    this.map.addEventListener('moveend', function(){
        me._animateFlag = true;
    });
    this.map.addEventListener('click', function(){
        me._animateFlag = true;
    });
}


/*
 * 做动画使用
 */
function Animation(opts) {
    this.opts = opts || {};
    this.flag = true;
    var me = this;
    if (this.opts.from === undefined || this.opts.to === undefined) {
        return;
    }

    this.index = opts.from;

    requestAnimationFrame(function(){
        me.circulate();
    });
}

Animation.prototype.circulate = function() {
    if (!this.flag) {
        return;
    }

    var me = this;
    if (this.opts.to > this.opts.from && this.index < this.opts.to || this.opts.to < this.opts.from && this.index > this.opts.to) {
        this.opts.action && this.opts.action(this.index);
        setTimeout(function() {
        requestAnimationFrame(function(){
            me.circulate();
        });
        }, this.opts.fps ? 1000 / this.opts.fps : 0);
        if (this.opts.to > this.opts.from) {
            this.index++;
        } else {
            this.index--;
        }
    } else {
        this.opts.callback && this.opts.callback();
    }
}

//销毁动画
Animation.prototype.dispose = function() {
    this.flag = false;
}
