/**
 * @module Core
 * @namespace springroll
 */
(function()
{
	var Debug = include("springroll.Debug", false);
	
	/**
	 * HoledShape is a shape combining two other shapes, one as the main shape and the other as
	 * a hole in the shape.
	 * @class HoledShape
	 */
	var HoledShape = function(outer, hole)
	{
		this.outer = outer;
		this.hole = hole;
	};

	var p = HoledShape.prototype;

	p.contains = function(x, y)
	{
		return this.outer.contains(x, y) && !this.hole.contains(x, y);
	};
	
	p.drawOnGraphics = function(graphics, color)
	{
		if(!this.outer.drawOnGraphics || !this.hole.drawOnGraphics)
		{
			if(Debug)
			{
				Debug.warn("Trying to drawOnGraphics() with HoledShape and outer and/or hole lacks drawOnGraphics!");
			}
			return;
		}
		this.outer.drawOnGraphics(graphics, color);
		this.hole.drawOnGraphics(graphics, color);
	};

	namespace('springroll').HoledShape = HoledShape;
}());