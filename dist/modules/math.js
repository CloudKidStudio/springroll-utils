/*! springroll-utils 0.0.1 */
(function()
{
	var Debug = include("springroll.Debug", false);

	var RandomList = function(list)
	{
		if (!Array.isArray(list) && Debug)
		{
			Debug.error("Error: Attempting to make a RandomList without a list", list);
		}

		this.list = list.slice().shuffle();
		this.used = [];
	};

	var p = RandomList.prototype = {};

	/**
	 * get a random value from the source Array
	 * @return {*} Value from the array
	 */
	p.random = function()
	{
		var r = this.list.pop();
		this.used.push(r);
		if (this.list.length < 1)
		{
			for (var i = this.used.length - 1; i >= 0; --i)
			{
				this.list.push(this.used[i]);
			}
			this.list.shuffle();
			this.used.length = 0;
		}
		return r;
	};
	
	/**
	 * Clean up and don't use after this
	 */
	p.destroy = function()
	{
		this.list = this.used = null;
	};

	//Assign to namespace
	namespace('springroll').RandomList = RandomList;
}());
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