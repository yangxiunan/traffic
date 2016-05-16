function MapMask(t) {
	this.options = t || {}, this.initElement(), this._map = t.map
}
MapMask.prototype = new BMap.Overlay, MapMask.prototype.initialize = function(t) {
	this._map = t;
	var e = this.options.elementTag || "div",
		i = this.element = document.createElement(e),
		n = t.getSize();
	i.width = n.width, i.height = n.height, i.style.cssText = "position:absolute;left:0;top:0;width:" + n.width + "px;height:" + n.height + "px", t.getPanes().labelPane.appendChild(this.element);
	var a = this;
	return t.addEventListener("moving", function() {
		a.rp()
	}), this.element
}, MapMask.prototype.initElement = function() {}, MapMask.prototype.draw = function() {
	this.rp(), this.dispatchEvent("draw")
}, MapMask.prototype.rp = function() {
	var t = this._map,
		e = t.getBounds(),
		i = e.getSouthWest(),
		n = e.getNorthEast(),
		a = t.pointToOverlayPixel(new BMap.Point(i.lng, n.lat));
	this.element.style.left = a.x + "px", this.element.style.top = a.y + "px"
}, MapMask.prototype.getContainer = function() {
	return this.element
}, MapMask.prototype.show = function() {
	this._map.addOverlay(this)
}, MapMask.prototype.hide = function() {
	this._map.removeOverlay(this)
};