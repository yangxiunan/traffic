function TrafficLayer(t) {
	this._options = t || {},
	this._options.map && this.init()
}
function Animation(t) {
	this.opts = t || {},
	this.flag = !0;
	var i = this;
	void 0 !== this.opts.from && void 0 !== this.opts.to && (this.index = t.from, requestAnimationFrame(function () {
			i.circulate()
		}))
}
TrafficLayer.prototype.init = function () {
	var t = this,
	i = this._options.map;
	this.map = i,
	this.mercatorProjection = this.map.getMapType().getProjection(),
	this._data = {},
	this._styleKey = {},
	this._showKeys = [],
	this.initCanvas(),
	this._showAnimateText = {},
	this._animateStack = [],
	this._animationList = [],
	this._animateFlag = !0,
	requestAnimationFrame(function () {
		t._animate()
	}),
	this._bind()
}, TrafficLayer.prototype.initCanvas = function () {
	var t = this;
	this.baseCanvas = new MapMask({
			map : map,
			elementTag : "canvas"
		}),
	this.baseCanvas.show(),
	this.ctx = this.baseCanvas.getContainer().getContext("2d"),
	this.baseCanvas.addEventListener("draw", function () {
		t.draw()
	}),
	this.animateMask = new MapMask({
			map : map,
			elementTag : "canvas"
		}),
	this.animateMask.show(),
	this.anictx = this.animateMask.getContainer().getContext("2d"),
	this.animateBlurMask = new MapMask({
			map : map,
			elementTag : "canvas"
		}),
	this.animateBlurMask.show(),
	this.aniblurctx = this.animateBlurMask.getContainer().getContext("2d"),
	this.aniblurctx.globalAlpha = .85;
	var i = this.animateBlurMask.getContainer().cloneNode();
	this.aniblurctxTmp = i.getContext("2d"),
	this.aniblurctxTmp.globalCompositeOperation = "copy"
}, TrafficLayer.prototype.draw = function () {
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height),
	this.anictx.clearRect(0, 0, this.anictx.canvas.width, this.anictx.canvas.height),
	this.aniblurctx.clearRect(0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height),
	this._animateStack.length = [];
	for (var t = 0; t < this._animationList.length; t++)
		this._animationList[t].dispose();
	this._animationList.length = [];
	for (var t in this._showKeys)
		this.drawLinesAni(this._showKeys[t])
}, TrafficLayer.prototype.show = function (t) {
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height),
	this._showKeys = t;
	for (var i in this._showKeys) {
		var a = this._showKeys[i];
		this._data[a] ? this.drawLinesAni(a) : this.request(a)
	}
}, TrafficLayer.prototype.workToHome = function () {
	for (var t in this._showKeys) {
		var i = this._showKeys[t],
		a = this._data[i],
//		e = 500;
		e = pointNum;
		isMobile() && (e = 80);
		for (var t = 0; e > t; t++)
			a[t][3] = 0;
		this._data[i] && this.workToHomeByKey(i)
	}
}, TrafficLayer.prototype.workToHomeByKey = function (t) {
	function i() {
		e._animationList.push(new Animation({
				from : a[0][1].length - 1,
				to : 0,
				action : function (i) {
					var s = [.07, .09, .1, .12, .15];
					e._styleKey[t].lineWidth = s[1],
					e.ctx.clearRect(0, 0, e.ctx.canvas.width, e.ctx.canvas.height),
					e.drawLines(a, e._styleKey[t], void 0, o, a.length),
					e.drawLines(a, e._styleKey[t], i, n, o)
				},
				callback : function () {
					n += s,
					o += s,
					n < a.length ? i() : e.drawLinesAni(t)
				}
			}))
	}
	utilityClock && utilityClock.setTimer(new Date("2014-12-11 18:00:00").getTime()),
	this._showAnimateText[t] ? animateText.hide() : (animateText.show(), animateText.setPointAndText(workPlaces[t].center, workPlaces[t].toHome)),
	this._showAnimateText[t] = !0;
	var a = this._data[t],
	e = this;
	if (a) {
		var s = clockSpeed;
		isMobile() && (s = 100),
		e._animateFlag = !0;
		var n = 0,
		o = s;
		i()
	}
}, TrafficLayer.prototype.request = function (t) {
	if (this._data[t])
		return this._data[t];
	var i = this;
	$(".loading").show();
	var a = "data/" + t;
	isMobile() && (a += "_min"),
	a += ".js",
	$.ajax({
		url : a,
		dataType : "JSON",
		success : function (a) {
			var a = changePoints(a);
//			var e = 500;
			var e = pointNum;
			isMobile() && (a.length = 350, e = 80);
			for (var s = 0; e > s; s++)
				a[s][2] = ~~(Math.random() * a[s][1].length), a[s][3] = 0;
			i._data[t] = a,
			i.drawLinesAni(t),
			$(".loading").hide()
		},
		error : function () {
			i._data[t] = [],
			$(".loading").hide(),
			$(".tip").html("无数据返回"),
			$(".tip").show(),
			setTimeout(function () {
				$(".tip").hide()
			}, 2e3)
		}
	})
}, TrafficLayer.prototype.drawLines = function (t, i, a, e, s) {
	var n = this.ctx;
	if (t) {
		n.beginPath();
		var o = map.getZoom(),
		h = Math.pow(2, 18 - o),
		r = this.mercatorProjection.lngLatToPoint(this.map.getCenter()),
		c = new BMap.Pixel(r.x - n.canvas.width / 2 * h, r.y + n.canvas.height / 2 * h);
		n.save(),
		n.strokeStyle = i && i.strokeStyle || "rgba(255,255,0,0.9)",
		n.lineWidth = i && i.lineWidth || .1,
		isMobile() && (n.lineWidth = .4),
		e = e || 0,
		s = s || 0,
		s > t.length && (s = t.length);
		for (var l = e; s > l; l++) {
			var m = t[l][1];
			if (void 0 !== a) {
				n.moveTo((m[0][0] - c.x) / h, (c.y - m[0][1]) / h);
				for (var f = 1; a > f; f++)
					n.lineTo((m[f][0] - c.x) / h, (c.y - m[f][1]) / h)
			} else {
				n.moveTo((m[0][0] - c.x) / h, (c.y - m[0][1]) / h);
				for (var f = 1; f < m.length; f++)
					n.lineTo((m[f][0] - c.x) / h, (c.y - m[f][1]) / h)
			}
		}
		n.stroke(),
		n.restore()
	}
}, TrafficLayer.prototype.drawLinesAni = function (t) {
	function i() {
		s._animationList.push(new Animation({
				from : 0,
				to : e[0][1].length - 1,
				action : function (i) {
					s.ctx.clearRect(0, 0, s.ctx.canvas.width, s.ctx.canvas.height),
					s.drawLines(e, s._styleKey[t], void 0, 0, c),
					s.drawLines(e, s._styleKey[t], i, c, l)
				},
				callback : function () {
					c += r,
					l += r,
					c < e.length ? i() : s.workToHome()
				}
			}))
	}
	var a = workPlaces[t];
	this._showAnimateText[t] ? animateText.hide() : (animateText.show(), animateText.setPointAndText(a.center, workPlaces[t].toWork)),
	utilityClock && utilityClock.setTimer(new Date("2014-12-11 06:00:00").getTime());
	var e = this._data[t],
	s = this,
	n = this._data[t],
//	o = 500;
	o = pointNum;
	isMobile() && (o = 80);
	for (var h = 0; o > h; h++)
		n[h][3] = 1;
	if (e) {
		var r = clockSpeed;
		isMobile() && (r = 100),
		s._animateFlag = !0;
		var c = 0,
		l = r;
		i()
	}
}, TrafficLayer.prototype._animate = function (t) {
	var i = this;
	if (this.aniblurctxTmp.drawImage(this.aniblurctx.canvas, 0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height), this.anictx.clearRect(0, 0, this.anictx.canvas.width, this.anictx.canvas.height), this.aniblurctx.clearRect(0, 0, this.aniblurctx.canvas.width, this.aniblurctx.canvas.height), this._animateFlag) {
		this._animateStack.length > 0 && this._animateStack.shift()();
		for (var a in this._showKeys)
			this._drawAnimatePath(this._showKeys[a], t), this.aniblurctx.fill(), this._drawAnimateMarker(this._showKeys[a], t)
	}
	this.aniblurctx.drawImage(this.aniblurctxTmp.canvas, 0, 0, this.aniblurctxTmp.canvas.width, this.aniblurctxTmp.canvas.height),
	setTimeout(function () {
		requestAnimationFrame(function () {
			i._animate(t)
		})
	}, 55)
};
var circleSize = 10;
TrafficLayer.prototype._drawAnimateMarker = function (t) {
	var i = workPlaces[t] && workPlaces[t].center;
	if (i && this._data[t]) { {
			this._styleKey[t]
		}
		i = this.map.pointToPixel(i);
		var a = this.aniblurctx;
		a.save(),
		a.beginPath(),
		a.strokeStyle = "rgba(255,255,255,0.9)",
		circleSize += 1,
		a.arc(i.x, i.y, circleSize, 0, 2 * Math.PI),
		a.stroke(),
		a.restore(),
		circleSize > 35 && (circleSize = 0)
	}
}, TrafficLayer.prototype._drawAnimatePath = function (t) {
	if (this._data[t]) {
		var i = this.anictx,
		a = this.aniblurctx;
		i.beginPath(),
		a.beginPath(),
		i.fillStyle = "rgba(255,255,255,0.9)",
		a.fillStyle = "rgba(255,255,255,0.9)";
		for (var e = this.map.getZoom(), s = Math.pow(2, 18 - e), n = this.mercatorProjection.lngLatToPoint(this.map.getCenter()), o = new BMap.Pixel(n.x - i.canvas.width / 2 * s, n.y + i.canvas.height / 2 * s), h = this._data[t], r = h.length, c = 0; r > c; c++)
			if (void 0 !== h[c][1][2]) {
				var l = h[c][1][h[c][2]];
				1 === h[c][3] ? (h[c][2]++, h[c][2] > h[c][1].length && (h[c][2] = 0)) : (h[c][2]--, h[c][2] < 0 && (h[c][2] = h[c][1].length)),
				l && (25 > c ? (a.moveTo((l[0] - o.x) / s, (o.y - l[1]) / s), a.arc((l[0] - o.x) / s, (o.y - l[1]) / s, 4, 0, 2 * Math.PI)) : i.fillRect((l[0] - o.x) / s, (o.y - l[1]) / s, 2, 2))
			}
	}
}, TrafficLayer.prototype.setStyle = function (t, i) {
	this._styleKey[t] = i
}, TrafficLayer.prototype._bind = function () {
	var t = this;
	this.map.addEventListener("movestart", function () {
		t._animateFlag = !1
	}),
	this.map.addEventListener("moveend", function () {
		t._animateFlag = !0
	}),
	this.map.addEventListener("click", function () {
		t._animateFlag = !0
	})
}, Animation.prototype.circulate = function () {
	if (this.flag) {
		var t = this;
		this.opts.to > this.opts.from && this.index < this.opts.to || this.opts.to < this.opts.from && this.index > this.opts.to ? (this.opts.action && this.opts.action(this.index), setTimeout(function () {
				requestAnimationFrame(function () {
					t.circulate()
				})
			}, this.opts.fps ? 1e3 / this.opts.fps : 0), this.opts.to > this.opts.from ? this.index++ : this.index--) : this.opts.callback && this.opts.callback()
	}
}, Animation.prototype.dispose = function () {
	this.flag = !1
};