(function() {
	
	var Container = include("PIXI.Container"),
		Sprite = include("PIXI.Sprite");
	
	/**
	 * @class Slice9Sprite
	 * @constructor
	 * @param {Slice9Textures} texture
	 */
	var Slice9Sprite = function(texture)
	{
		Container.call(this);
		
		this.sliceTexture = texture;
		
		this.topLeft = new Sprite(texture.topLeft);
		this.left = new Sprite(texture.left);
		this.left.y = texture.topHeight;
		this.bottomLeft = new Sprite(texture.bottomLeft);
		this.top = new Sprite(texture.top);
		this.top.x = texture.leftWidth;
		this.center = new Sprite(texture.center);
		this.center.x = texture.leftWidth;
		this.center.y = texture.topHeight;
		this.bottom = new Sprite(texture.bottom);
		this.bottom.x = texture.leftWidth;
		this.topRight = new Sprite(texture.topRight);
		this.right = new Sprite(texture.right);
		this.right.y = texture.topHeight;
		this.bottomRight = new Sprite(texture.bottomRight);
		
		this.addChild(this.topLeft);
		this.addChild(this.left);
		this.addChild(this.bottomLeft);
		this.addChild(this.top);
		this.addChild(this.center);
		this.addChild(this.bottom);
		this.addChild(this.topRight);
		this.addChild(this.right);
		this.addChild(this.bottomRight);
		
		this.setWidth(texture.origWidth);
		this.setHeight(texture.origHeight);
		
		this._tint = 0xffffff;
	};

	// Extend BaseState
	var p = extend(Slice9Sprite, Container);
	var s = Container.prototype;
	
	Object.defineProperty(p, "tint", {
		get: function() { return this._tint; },
		set: function(value)
		{
			this._tint = value;
			this.center.tint = this.left.tint = this.right.tint = value;
			this.top.tint = this.topLeft.tint = this.topRight.tint = value;
			this.bottom.tint = this.bottomLeft.tint = this.bottomRight.tint = value;
		}
	});
	
	p.setWidth = function(width)
	{
		var center = width - this.sliceTexture.leftWidth - this.sliceTexture.rightWidth;
		var centerScale = center / this.sliceTexture.centerWidth;
		var rightX = center + this.sliceTexture.leftWidth;
		this.top.scale.x = centerScale;
		this.center.scale.x = centerScale;
		this.bottom.scale.x = centerScale;
		this.topRight.x = rightX;
		this.right.x = rightX;
		this.bottomRight.x = rightX;
	};
	
	p.setHeight = function(height)
	{
		var center = height - this.sliceTexture.topHeight - this.sliceTexture.bottomHeight;
		var centerScale = center / this.sliceTexture.centerHeight;
		var bottomY = center + this.sliceTexture.topHeight;
		this.left.scale.y = centerScale;
		this.center.scale.y = centerScale;
		this.right.scale.y = centerScale;
		this.bottomLeft.y = bottomY;
		this.bottom.y = bottomY;
		this.bottomRight.y = bottomY;
	};

	p.destroy = function()
	{
		if(!this.center) return;
		
		this.center.destroy();
		this.left.destroy();
		this.right.destroy();
		this.top.destroy();
		this.bottom.destroy();
		this.topLeft.destroy();
		this.bottomLeft.destroy();
		this.topRight.destroy();
		this.bottomRight.destroy();
		s.destroy.call(this);
		this.left = this.right = this.center = this.top = this.bottom = this.topLeft =
			this.bottomLeft = this.topRight = this.bottomRight = null;
	};

	namespace('springroll.pixi').Slice9Sprite = Slice9Sprite;
}());