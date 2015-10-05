(function() {
	
	var Container = include("PIXI.Container"),
		Sprite = include("PIXI.Sprite");
	
	/**
	 * @class Slice3Sprite
	 * @constructor
	 * @param {Slice3Textures} texture
	 */
	var Slice3Sprite = function(texture)
	{
		Container.call(this);
		
		this.isHorizontal = texture.isHorizontal;
		
		this.sliceTexture = texture;
		
		if(this.isHorizontal)
		{
			this.left = new Sprite(texture.left);
			this.center = new Sprite(texture.center);
			this.center.x = texture.leftWidth;
			this.right = new Sprite(texture.right);
			
			this.addChild(this.left);
			this.addChild(this.center);
			this.addChild(this.right);
			
			this.setWidth(texture.origWidth);
		}
		else
		{
			this.top = new Sprite(texture.top);
			this.center = new Sprite(texture.center);
			this.center.y = texture.topHeight;
			this.bottom = new Sprite(texture.bottom);
			
			this.addChild(this.top);
			this.addChild(this.center);
			this.addChild(this.bottom);
			
			this.setHeight(texture.origHeight);
		}
		
		this._tint = 0xffffff;
	};

	// Extend BaseState
	var p = extend(Slice3Sprite, Container);
	var s = Container.prototype;
	
	Object.defineProperty(p, "tint", {
		get: function() { return this._tint; },
		set: function(value)
		{
			this._tint = value;
			this.center.tint = value;
			if(this.left)
			{
				this.left.tint = this.right.tint = value;
			}
			else
			{
				this.top.tint = this.bottom.tint = value;
			}
		}
	});
	
	p.setWidth = function(width)
	{
		var scale;
		var sliceTexture = this.sliceTexture;
		if(this.isHorizontal)
		{
			if(width >= sliceTexture.leftWidth + sliceTexture.rightWidth)
			{
				var center = width - sliceTexture.leftWidth - sliceTexture.rightWidth;
				this.left.scale.x = this.right.scale.x = 1;
				this.center.scale.x = center / sliceTexture.centerWidth;
				this.right.x = center + sliceTexture.leftWidth;
				this.center.visible = true;
			}
			else
			{
				scale = width / (sliceTexture.leftWidth + sliceTexture.rightWidth);
				this.left.scale.x = this.right.scale.x = scale;
				this.right.x = sliceTexture.leftWidth * scale;
				this.center.visible = false;
			}
		}
		else
		{
			scale = width / sliceTexture.origWidth;
			this.top.scale.x = scale;
			this.center.scale.x = scale;
			this.bottom.scale.x = scale;
		}
	};
	
	p.setHeight = function(height)
	{
		var scale;
		var sliceTexture = this.sliceTexture;
		if(this.isHorizontal)
		{
			scale = height / sliceTexture.origHeight;
			this.left.scale.y = scale;
			this.center.scale.y = scale;
			this.right.scale.y = scale;
		}
		else
		{
			if(height >= sliceTexture.topHeight + sliceTexture.bottomHeight)
			{
				var center = height - sliceTexture.topHeight - sliceTexture.bottomHeight;
				this.top.scale.y = this.bottom.scale.y = 1;
				this.center.scale.y = center / sliceTexture.centerHeight;
				this.bottom.y = center + sliceTexture.topHeight;
				this.center.visible = true;
			}
			else
			{
				scale = height / (sliceTexture.topHeight + sliceTexture.bottomHeight);
				this.top.scale.y = this.bottom.scale.y = scale;
				this.bottom.y = sliceTexture.topHeight * scale;
				this.center.visible = false;
			}
		}
	};

	p.destroy = function()
	{
		if(!this.center) return;
		
		this.center.destroy();
		if(this.left)
		{
			this.left.destroy();
			this.right.destroy();
		}
		else
		{
			this.top.destroy();
			this.bottom.destroy();
		}
		s.destroy.call(this);
		this.left = this.right = this.center = this.top = this.bottom = null;
	};

	namespace('springroll.pixi').Slice3Sprite = Slice3Sprite;
}());