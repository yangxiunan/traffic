function UtilityClock(e) {
	var t = this,
		i = e.querySelector(".dynamic");
	this.timer = (new Date).getTime();
	for (var n = e.querySelector(".hour"), o = e.querySelector(".minute"), r = e.querySelector(".second"), a = function(e) {
			return e % 5 == 0 ? c(e) : l(e)
		}, c = function(e) {
			var t = document.createElement("div");
			t.className = "minute-text", t.innerHTML = (10 > e ? "0" : "") + e, u(t, e / 60, 135), i.appendChild(t)
		}, l = function(e) {
			var t = document.createElement("div");
			t.className = "anchor";
			var n = document.createElement("div");
			n.className = "element minute-line", d(t, e), t.appendChild(n), i.appendChild(t)
		}, s = function(e) {
			var t = document.createElement("div");
			t.className = "hour-text hour-" + e, t.innerHTML = e, u(t, e / 12, 105), i.appendChild(t)
		}, u = function(e, t, i) {
			var n = 2 * t * Math.PI;
			e.style.top = (-i * Math.cos(n)).toFixed(1) + "px", e.style.left = (i * Math.sin(n)).toFixed(1) + "px"
		}, d = function(e, t) {
			e.style.transform = e.style.webkitTransform = "rotate(" + 6 * t + "deg)"
		}, m = function() {
			var e = new Date(t.timer);
			t.timer += 123e3;
			var i = 3600 * e.getHours() + 60 * e.getMinutes() + 1 * e.getSeconds() + e.getMilliseconds() / 1e3;
			d(r, i), d(o, i / 60), d(n, i / 60 / 12), requestAnimationFrame(m)
		}, f = 1; 60 >= f; f++) a(f);
	for (var f = 1; 12 >= f; f++) s(f);
	m()
}

function autoResize(e, t) {
	var i = function() {
		var i = Math.min(window.innerWidth, window.innerHeight) / t;
		i = .4, isMobile() && (i = .2), e.style.transform = e.style.webkitTransform = "scale(" + i.toFixed(3) + ")"
	};
	i(), window.addEventListener("resize", i)
}
var clock = document.querySelector("#utility-clock");
if (!isMobile()) var utilityClock = new UtilityClock(clock);
clock.parentNode.classList.contains("fill") && autoResize(clock, 327), UtilityClock.prototype.setTimer = function(e) {
	this.timer = e
};